import { randomUUID } from "node:crypto";
import type { QueryResultRow } from "pg";
import {
  executeStatement,
  isPostgresProvider,
  queryRows,
  runSchemaStatement,
} from "@/lib/database";
import { getMysqlPool } from "@/lib/mysql";
import { getListingById } from "@/lib/listings-store";
import { calculateMarketplaceFee } from "@/lib/paystack";

export const orderStatuses = [
  "pending_payment",
  "paid",
  "cancelled",
  "payment_failed",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export type MarketplaceOrder = {
  id: string;
  reference: string;
  listingId: string;
  listingSlug: string;
  listingTitle: string;
  buyerUserId: string;
  sellerUserId: string | null;
  sellerDisplayName: string | null;
  amountSubunit: number;
  listingAmountSubunit: number;
  platformFeeSubunit: number;
  sellerNetAmountSubunit: number;
  currency: string;
  status: OrderStatus;
  paymentProvider: string;
  paymentProviderTransactionId: string | null;
  paymentProviderAccessCode: string | null;
  paymentAuthorizationUrl: string | null;
  paymentFailureReason: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type MarketplaceOrderRow = QueryResultRow & {
  id: string;
  reference: string;
  listing_id: string;
  listing_slug: string;
  listing_title: string;
  buyer_user_id: string;
  seller_user_id: string | null;
  seller_display_name: string | null;
  amount_subunit: number;
  listing_amount_subunit: number | null;
  platform_fee_subunit: number | null;
  seller_net_amount_subunit: number | null;
  currency: string;
  status: OrderStatus;
  payment_provider: string;
  payment_provider_transaction_id: string | null;
  payment_provider_access_code: string | null;
  payment_authorization_url: string | null;
  payment_failure_reason: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

type CreateOrderInput = {
  listingId: string;
  buyerUserId: string;
  reference: string;
  amountSubunit: number;
  currency: string;
};

let ordersTableReady: Promise<void> | null = null;

async function ensureOrderColumnExists(columnName: string, definition: string) {
  if (isPostgresProvider()) {
    await runSchemaStatement(
      `ALTER TABLE marketplace_orders ADD COLUMN IF NOT EXISTS ${definition}`,
    );
    return;
  }

  const pool = getMysqlPool();
  const [rows] = (await pool.query(
    "SHOW COLUMNS FROM marketplace_orders LIKE ?",
    [columnName],
  )) as [{ Field: string }[], unknown[]];

  if (rows.length === 0) {
    await pool.execute(`ALTER TABLE marketplace_orders ADD COLUMN ${definition}`);
  }
}

function normalizeDateTime(value: string | Date | null) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
}

function mapRowToOrder(row: MarketplaceOrderRow): MarketplaceOrder {
  return {
    id: row.id,
    reference: row.reference,
    listingId: row.listing_id,
    listingSlug: row.listing_slug,
    listingTitle: row.listing_title,
    buyerUserId: row.buyer_user_id,
    sellerUserId: row.seller_user_id,
    sellerDisplayName: row.seller_display_name,
    amountSubunit: row.amount_subunit,
    listingAmountSubunit: row.listing_amount_subunit ?? row.amount_subunit,
    platformFeeSubunit: row.platform_fee_subunit ?? 0,
    sellerNetAmountSubunit: row.seller_net_amount_subunit ?? row.amount_subunit,
    currency: row.currency,
    status: row.status,
    paymentProvider: row.payment_provider,
    paymentProviderTransactionId: row.payment_provider_transaction_id,
    paymentProviderAccessCode: row.payment_provider_access_code,
    paymentAuthorizationUrl: row.payment_authorization_url,
    paymentFailureReason: row.payment_failure_reason,
    paidAt: normalizeDateTime(row.paid_at),
    cancelledAt: normalizeDateTime(row.cancelled_at),
    createdAt: normalizeDateTime(row.created_at) ?? new Date(0).toISOString(),
    updatedAt: normalizeDateTime(row.updated_at) ?? new Date(0).toISOString(),
  };
}

async function ensureOrdersTables() {
  if (!ordersTableReady) {
    ordersTableReady = (async () => {
      if (isPostgresProvider()) {
        await runSchemaStatement(`
          CREATE TABLE IF NOT EXISTS marketplace_orders (
            id VARCHAR(36) PRIMARY KEY,
            reference VARCHAR(120) NOT NULL UNIQUE,
            listing_id VARCHAR(36) NOT NULL,
            listing_slug VARCHAR(120) NOT NULL,
            listing_title VARCHAR(255) NOT NULL,
            buyer_user_id VARCHAR(36) NOT NULL,
            seller_user_id VARCHAR(36) NULL,
            seller_display_name VARCHAR(255) NULL,
            amount_subunit INT NOT NULL,
            listing_amount_subunit INT NULL,
            platform_fee_subunit INT NULL,
            seller_net_amount_subunit INT NULL,
            currency VARCHAR(8) NOT NULL DEFAULT 'ZAR',
            status VARCHAR(32) NOT NULL DEFAULT 'pending_payment',
            payment_provider VARCHAR(32) NOT NULL DEFAULT 'paystack',
            payment_provider_transaction_id VARCHAR(120) NULL,
            payment_provider_access_code VARCHAR(120) NULL,
            payment_authorization_url TEXT NULL,
            payment_failure_reason TEXT NULL,
            paid_at TIMESTAMPTZ NULL DEFAULT NULL,
            cancelled_at TIMESTAMPTZ NULL DEFAULT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await runSchemaStatement(
          "CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer_created ON marketplace_orders (buyer_user_id, created_at)",
        );
        await runSchemaStatement(
          "CREATE INDEX IF NOT EXISTS idx_marketplace_orders_listing_created ON marketplace_orders (listing_id, created_at)",
        );
        await runSchemaStatement(
          "CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status_created ON marketplace_orders (status, created_at)",
        );
      } else {
        const pool = getMysqlPool();

        await pool.execute(`
          CREATE TABLE IF NOT EXISTS marketplace_orders (
            id CHAR(36) NOT NULL PRIMARY KEY,
            reference VARCHAR(120) NOT NULL UNIQUE,
            listing_id CHAR(36) NOT NULL,
            listing_slug VARCHAR(120) NOT NULL,
            listing_title VARCHAR(255) NOT NULL,
            buyer_user_id CHAR(36) NOT NULL,
            seller_user_id CHAR(36) NULL,
            seller_display_name VARCHAR(255) NULL,
            amount_subunit INT NOT NULL,
            listing_amount_subunit INT NULL,
            platform_fee_subunit INT NULL,
            seller_net_amount_subunit INT NULL,
            currency VARCHAR(8) NOT NULL DEFAULT 'ZAR',
            status VARCHAR(32) NOT NULL DEFAULT 'pending_payment',
            payment_provider VARCHAR(32) NOT NULL DEFAULT 'paystack',
            payment_provider_transaction_id VARCHAR(120) NULL,
            payment_provider_access_code VARCHAR(120) NULL,
            payment_authorization_url TEXT NULL,
            payment_failure_reason TEXT NULL,
            paid_at TIMESTAMP NULL DEFAULT NULL,
            cancelled_at TIMESTAMP NULL DEFAULT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_marketplace_orders_buyer_created (buyer_user_id, created_at),
            KEY idx_marketplace_orders_listing_created (listing_id, created_at),
            KEY idx_marketplace_orders_status_created (status, created_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
      }

      await ensureOrderColumnExists(
        "listing_amount_subunit",
        "listing_amount_subunit INT NULL",
      );
      await ensureOrderColumnExists(
        "platform_fee_subunit",
        "platform_fee_subunit INT NULL",
      );
      await ensureOrderColumnExists(
        "seller_net_amount_subunit",
        "seller_net_amount_subunit INT NULL",
      );

      await executeStatement(
        "UPDATE marketplace_orders SET listing_amount_subunit = amount_subunit WHERE listing_amount_subunit IS NULL",
      );
      await executeStatement(
        "UPDATE marketplace_orders SET platform_fee_subunit = 0 WHERE platform_fee_subunit IS NULL",
      );
      await executeStatement(
        "UPDATE marketplace_orders SET seller_net_amount_subunit = COALESCE(listing_amount_subunit, amount_subunit) WHERE seller_net_amount_subunit IS NULL",
      );

      if (isPostgresProvider()) {
        await runSchemaStatement(`
          CREATE TABLE IF NOT EXISTS marketplace_payment_events (
            id BIGSERIAL PRIMARY KEY,
            payment_provider VARCHAR(32) NOT NULL,
            event_type VARCHAR(120) NOT NULL,
            reference VARCHAR(120) NULL,
            payload_json TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await runSchemaStatement(
          "CREATE INDEX IF NOT EXISTS idx_marketplace_payment_events_reference_created ON marketplace_payment_events (reference, created_at)",
        );
        await runSchemaStatement(
          "CREATE INDEX IF NOT EXISTS idx_marketplace_payment_events_provider_created ON marketplace_payment_events (payment_provider, created_at)",
        );
        return;
      }

      const pool = getMysqlPool();
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS marketplace_payment_events (
          id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          payment_provider VARCHAR(32) NOT NULL,
          event_type VARCHAR(120) NOT NULL,
          reference VARCHAR(120) NULL,
          payload_json LONGTEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          KEY idx_marketplace_payment_events_reference_created (reference, created_at),
          KEY idx_marketplace_payment_events_provider_created (payment_provider, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    })();
  }

  try {
    await ordersTableReady;
  } catch (error) {
    ordersTableReady = null;
    throw error;
  }
}

export function createOrderReference() {
  return `buddies-${Date.now()}-${randomUUID().slice(0, 8)}`;
}

export async function createMarketplaceOrder(
  input: CreateOrderInput,
): Promise<MarketplaceOrder | undefined> {
  await ensureOrdersTables();
  const listing = await getListingById(input.listingId);

  if (!listing) {
    throw new Error("Listing not found.");
  }

  const id = randomUUID();
  const feeBreakdown = calculateMarketplaceFee(input.amountSubunit);

  await executeStatement(
    `
      INSERT INTO marketplace_orders (
        id,
        reference,
        listing_id,
        listing_slug,
        listing_title,
        buyer_user_id,
        seller_user_id,
        seller_display_name,
        amount_subunit,
        listing_amount_subunit,
        platform_fee_subunit,
        seller_net_amount_subunit,
        currency,
        status,
        payment_provider
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment', 'paystack')
    `,
    [
      id,
      input.reference,
      listing.id,
      listing.slug,
      listing.title,
      input.buyerUserId,
      listing.ownerUserId,
      listing.ownerDisplayName,
      feeBreakdown.buyerTotalSubunit,
      feeBreakdown.itemAmountSubunit,
      feeBreakdown.platformFeeSubunit,
      feeBreakdown.sellerNetAmountSubunit,
      input.currency,
    ],
  );

  return getMarketplaceOrderById(id);
}

export async function getMarketplaceOrderById(
  id: string,
): Promise<MarketplaceOrder | undefined> {
  await ensureOrdersTables();
  const rows = await queryRows<MarketplaceOrderRow>(
    `
      SELECT
        id,
        reference,
        listing_id,
        listing_slug,
        listing_title,
        buyer_user_id,
        seller_user_id,
        seller_display_name,
        amount_subunit,
        listing_amount_subunit,
        platform_fee_subunit,
        seller_net_amount_subunit,
        currency,
        status,
        payment_provider,
        payment_provider_transaction_id,
        payment_provider_access_code,
        payment_authorization_url,
        payment_failure_reason,
        paid_at,
        cancelled_at,
        created_at,
        updated_at
      FROM marketplace_orders
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

  return rows[0] ? mapRowToOrder(rows[0]) : undefined;
}

export async function getMarketplaceOrderByReference(
  reference: string,
): Promise<MarketplaceOrder | undefined> {
  await ensureOrdersTables();
  const rows = await queryRows<MarketplaceOrderRow>(
    `
      SELECT
        id,
        reference,
        listing_id,
        listing_slug,
        listing_title,
        buyer_user_id,
        seller_user_id,
        seller_display_name,
        amount_subunit,
        listing_amount_subunit,
        platform_fee_subunit,
        seller_net_amount_subunit,
        currency,
        status,
        payment_provider,
        payment_provider_transaction_id,
        payment_provider_access_code,
        payment_authorization_url,
        payment_failure_reason,
        paid_at,
        cancelled_at,
        created_at,
        updated_at
      FROM marketplace_orders
      WHERE reference = ?
      LIMIT 1
    `,
    [reference],
  );

  return rows[0] ? mapRowToOrder(rows[0]) : undefined;
}

export async function updateMarketplaceOrderCheckout(
  orderId: string,
  input: {
    accessCode: string;
    authorizationUrl: string;
  },
): Promise<MarketplaceOrder | undefined> {
  await ensureOrdersTables();
  await executeStatement(
    `
      UPDATE marketplace_orders
      SET
        payment_provider_access_code = ?,
        payment_authorization_url = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [input.accessCode, input.authorizationUrl, orderId],
  );

  return getMarketplaceOrderById(orderId);
}

export async function markMarketplaceOrderPaid(input: {
  reference: string;
  providerTransactionId: string;
}): Promise<MarketplaceOrder | undefined> {
  await ensureOrdersTables();
  await executeStatement(
    `
      UPDATE marketplace_orders
      SET
        status = 'paid',
        payment_provider_transaction_id = ?,
        payment_failure_reason = NULL,
        paid_at = CURRENT_TIMESTAMP,
        cancelled_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE reference = ?
    `,
    [input.providerTransactionId, input.reference],
  );

  return getMarketplaceOrderByReference(input.reference);
}

export async function markMarketplaceOrderCancelled(
  reference: string,
  reason?: string | null,
): Promise<MarketplaceOrder | undefined> {
  await ensureOrdersTables();
  await executeStatement(
    `
      UPDATE marketplace_orders
      SET
        status = 'cancelled',
        payment_failure_reason = ?,
        cancelled_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE reference = ? AND status <> 'paid'
    `,
    [reason ?? null, reference],
  );

  return getMarketplaceOrderByReference(reference);
}

export async function markMarketplaceOrderPaymentFailed(
  reference: string,
  reason?: string | null,
): Promise<MarketplaceOrder | undefined> {
  await ensureOrdersTables();
  await executeStatement(
    `
      UPDATE marketplace_orders
      SET
        status = 'payment_failed',
        payment_failure_reason = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE reference = ? AND status <> 'paid'
    `,
    [reason ?? null, reference],
  );

  return getMarketplaceOrderByReference(reference);
}

export async function recordMarketplacePaymentEvent(input: {
  eventType: string;
  paymentProvider: string;
  reference?: string | null;
  payload: unknown;
}) {
  await ensureOrdersTables();
  await executeStatement(
    `
      INSERT INTO marketplace_payment_events (
        payment_provider,
        event_type,
        reference,
        payload_json
      )
      VALUES (?, ?, ?, ?)
    `,
    [
      input.paymentProvider,
      input.eventType,
      input.reference ?? null,
      JSON.stringify(input.payload),
    ],
  );
}
