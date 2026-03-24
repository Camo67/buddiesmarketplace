import { randomUUID } from "node:crypto";
import type { QueryResultRow } from "pg";
import {
  executeStatement,
  isPostgresProvider,
  queryRows,
  runSchemaStatement,
} from "@/lib/database";
import { getMysqlPool } from "@/lib/mysql";
import type { ParsedPaxiShipment } from "@/lib/paxi-bulk";

export type PaxiBulkShipment = {
  id: string;
  batchId: string;
  sourceFileName: string;
  receiverName: string;
  receiverMobile: string;
  destinationStore: string;
  trackingNumber: string | null;
  status: string;
  createdAt: string;
};

type PaxiBulkShipmentRow = QueryResultRow & {
  id: string;
  batch_id: string;
  source_file_name: string;
  receiver_name: string;
  receiver_mobile: string;
  destination_store: string;
  tracking_number: string | null;
  status: string;
  created_at: string;
};

let paxiBulkTableReady: Promise<void> | null = null;

function normalizeDateTime(value: string | Date) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
}

function mapRowToShipment(row: PaxiBulkShipmentRow): PaxiBulkShipment {
  return {
    id: row.id,
    batchId: row.batch_id,
    sourceFileName: row.source_file_name,
    receiverName: row.receiver_name,
    receiverMobile: row.receiver_mobile,
    destinationStore: row.destination_store,
    trackingNumber: row.tracking_number,
    status: row.status,
    createdAt: normalizeDateTime(row.created_at),
  };
}

async function ensurePaxiBulkShipmentsTable() {
  if (!paxiBulkTableReady) {
    paxiBulkTableReady = (async () => {
      if (isPostgresProvider()) {
        await runSchemaStatement(`
          CREATE TABLE IF NOT EXISTS paxi_bulk_shipments (
            id VARCHAR(36) PRIMARY KEY,
            batch_id VARCHAR(36) NOT NULL,
            source_file_name VARCHAR(255) NOT NULL,
            receiver_name VARCHAR(255) NOT NULL,
            receiver_mobile VARCHAR(32) NOT NULL,
            destination_store VARCHAR(32) NOT NULL,
            tracking_number VARCHAR(64) NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'staged',
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await runSchemaStatement(
          "CREATE INDEX IF NOT EXISTS idx_paxi_bulk_shipments_batch_created ON paxi_bulk_shipments (batch_id, created_at)",
        );
        await runSchemaStatement(
          "CREATE INDEX IF NOT EXISTS idx_paxi_bulk_shipments_created ON paxi_bulk_shipments (created_at)",
        );
        return;
      }

      const pool = getMysqlPool();
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS paxi_bulk_shipments (
          id CHAR(36) NOT NULL PRIMARY KEY,
          batch_id CHAR(36) NOT NULL,
          source_file_name VARCHAR(255) NOT NULL,
          receiver_name VARCHAR(255) NOT NULL,
          receiver_mobile VARCHAR(32) NOT NULL,
          destination_store VARCHAR(32) NOT NULL,
          tracking_number VARCHAR(64) NULL,
          status VARCHAR(32) NOT NULL DEFAULT 'staged',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          KEY idx_paxi_bulk_shipments_batch_created (batch_id, created_at),
          KEY idx_paxi_bulk_shipments_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    })();
  }

  try {
    await paxiBulkTableReady;
  } catch (error) {
    paxiBulkTableReady = null;
    throw error;
  }
}

export async function createPaxiBulkShipmentBatch(
  shipments: ParsedPaxiShipment[],
  sourceFileName: string,
): Promise<PaxiBulkShipment[]> {
  await ensurePaxiBulkShipmentsTable();
  const batchId = randomUUID();

  for (const shipment of shipments) {
    await executeStatement(
      `
        INSERT INTO paxi_bulk_shipments (
          id,
          batch_id,
          source_file_name,
          receiver_name,
          receiver_mobile,
          destination_store,
          tracking_number,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        randomUUID(),
        batchId,
        sourceFileName,
        shipment.receiverName,
        shipment.receiverMobile,
        shipment.destinationStore,
        shipment.trackingNumber,
        "staged",
      ],
    );
  }

  return readPaxiBulkShipmentsByBatch(batchId);
}

export async function readPaxiBulkShipmentsByBatch(
  batchId: string,
): Promise<PaxiBulkShipment[]> {
  await ensurePaxiBulkShipmentsTable();
  const rows = await queryRows<PaxiBulkShipmentRow>(
    `
      SELECT
        id,
        batch_id,
        source_file_name,
        receiver_name,
        receiver_mobile,
        destination_store,
        tracking_number,
        status,
        created_at
      FROM paxi_bulk_shipments
      WHERE batch_id = ?
      ORDER BY created_at DESC, receiver_name ASC
    `,
    [batchId],
  );

  return rows.map(mapRowToShipment);
}

export async function readRecentPaxiBulkShipments(
  limit = 25,
): Promise<PaxiBulkShipment[]> {
  await ensurePaxiBulkShipmentsTable();
  const rows = await queryRows<PaxiBulkShipmentRow>(
    `
      SELECT
        id,
        batch_id,
        source_file_name,
        receiver_name,
        receiver_mobile,
        destination_store,
        tracking_number,
        status,
        created_at
      FROM paxi_bulk_shipments
      ORDER BY created_at DESC
      LIMIT ?
    `,
    [limit],
  );

  return rows.map(mapRowToShipment);
}
