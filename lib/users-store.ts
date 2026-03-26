import { randomUUID } from "node:crypto";
import type { QueryResultRow } from "pg";
import {
  executeStatement,
  isPostgresProvider,
  queryRows,
  runSchemaStatement,
} from "@/lib/database";
import { getMysqlPool } from "@/lib/mysql";
import {
  isVerificationStatus,
  type VerificationStatus,
} from "@/lib/user-verification";

export type MarketplaceUser = {
  id: string;
  authUserId: string;
  email: string | null;
  preferredUsername: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  verificationStatus: VerificationStatus;
  verificationPhone: string | null;
  verificationIdType: string | null;
  verificationIdReference: string | null;
  verificationIdDocumentUrl: string | null;
  verificationAddressDocumentUrl: string | null;
  verificationAddressText: string | null;
  verificationSubmissionNote: string | null;
  verificationReviewNote: string | null;
  verificationSubmittedAt: string | null;
  verificationReviewedAt: string | null;
  verificationReviewedBy: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type MarketplaceUserRow = QueryResultRow & {
  id: string;
  keycloak_sub: string;
  email: string | null;
  preferred_username: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  verification_status: string | null;
  verification_phone: string | null;
  verification_id_type: string | null;
  verification_id_reference: string | null;
  verification_id_document_url: string | null;
  verification_address_document_url: string | null;
  verification_address_text: string | null;
  verification_submission_note: string | null;
  verification_review_note: string | null;
  verification_submitted_at: string | null;
  verification_reviewed_at: string | null;
  verification_reviewed_by: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

type UpsertMarketplaceUserInput = {
  authUserId: string;
  email?: string | null;
  preferredUsername?: string | null;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export type SubmitMarketplaceUserVerificationInput = {
  userId: string;
  phone: string;
  idType: string;
  idReference: string;
  idDocumentUrl: string;
  addressDocumentUrl: string;
  addressText: string;
  submissionNote?: string | null;
};

export type UpdateMarketplaceUserVerificationInput = {
  status: VerificationStatus;
  reviewNote?: string | null;
  reviewedBy?: string | null;
};

let usersTableReady: Promise<void> | null = null;

function normalizeDateTime(value: string | Date | null) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
}

function normalizeNullable(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeVerificationStatus(value: string | null | undefined): VerificationStatus {
  return value && isVerificationStatus(value) ? value : "unsubmitted";
}

async function ensureColumnExists(
  columnName: string,
  mysqlDefinition: string,
  postgresDefinition = mysqlDefinition,
) {
  if (isPostgresProvider()) {
    await runSchemaStatement(
      `ALTER TABLE marketplace_users ADD COLUMN IF NOT EXISTS ${postgresDefinition}`,
    );
    return;
  }

  const pool = getMysqlPool();
  const [rows] = (await pool.query(
    "SHOW COLUMNS FROM marketplace_users LIKE ?",
    [columnName],
  )) as [{ Field: string }[], unknown[]];

  if (rows.length === 0) {
    await pool.execute(`ALTER TABLE marketplace_users ADD COLUMN ${mysqlDefinition}`);
  }
}

function mapRowToMarketplaceUser(row: MarketplaceUserRow): MarketplaceUser {
  return {
    id: row.id,
    authUserId: row.keycloak_sub,
    email: row.email,
    preferredUsername: row.preferred_username,
    displayName: row.display_name,
    firstName: row.first_name,
    lastName: row.last_name,
    verificationStatus: normalizeVerificationStatus(row.verification_status),
    verificationPhone: row.verification_phone,
    verificationIdType: row.verification_id_type,
    verificationIdReference: row.verification_id_reference,
    verificationIdDocumentUrl: row.verification_id_document_url,
    verificationAddressDocumentUrl: row.verification_address_document_url,
    verificationAddressText: row.verification_address_text,
    verificationSubmissionNote: row.verification_submission_note,
    verificationReviewNote: row.verification_review_note,
    verificationSubmittedAt: normalizeDateTime(row.verification_submitted_at),
    verificationReviewedAt: normalizeDateTime(row.verification_reviewed_at),
    verificationReviewedBy: row.verification_reviewed_by,
    lastLoginAt: normalizeDateTime(row.last_login_at),
    createdAt: normalizeDateTime(row.created_at) ?? new Date(0).toISOString(),
    updatedAt: normalizeDateTime(row.updated_at) ?? new Date(0).toISOString(),
  };
}

async function ensureUsersTable() {
  if (!usersTableReady) {
    usersTableReady = (async () => {
      if (isPostgresProvider()) {
        await runSchemaStatement(`
          CREATE TABLE IF NOT EXISTS marketplace_users (
            id VARCHAR(36) PRIMARY KEY,
            keycloak_sub VARCHAR(128) NOT NULL UNIQUE,
            email VARCHAR(255),
            preferred_username VARCHAR(255),
            display_name VARCHAR(255),
            first_name VARCHAR(120),
            last_name VARCHAR(120),
            verification_status VARCHAR(32) NOT NULL DEFAULT 'unsubmitted',
            verification_phone VARCHAR(40) NULL,
            verification_id_type VARCHAR(80) NULL,
            verification_id_reference VARCHAR(120) NULL,
            verification_id_document_url TEXT NULL,
            verification_address_document_url TEXT NULL,
            verification_address_text TEXT NULL,
            verification_submission_note TEXT NULL,
            verification_review_note TEXT NULL,
            verification_submitted_at TIMESTAMPTZ NULL DEFAULT NULL,
            verification_reviewed_at TIMESTAMPTZ NULL DEFAULT NULL,
            verification_reviewed_by VARCHAR(120) NULL,
            last_login_at TIMESTAMPTZ NULL DEFAULT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await runSchemaStatement(
          "CREATE INDEX IF NOT EXISTS idx_marketplace_users_email ON marketplace_users (email)",
        );
        await runSchemaStatement(
          "CREATE INDEX IF NOT EXISTS idx_marketplace_users_preferred_username ON marketplace_users (preferred_username)",
        );
        await ensureColumnExists(
          "verification_status",
          "verification_status VARCHAR(32) NOT NULL DEFAULT 'unsubmitted'",
        );
        await ensureColumnExists("verification_phone", "verification_phone VARCHAR(40) NULL");
        await ensureColumnExists("verification_id_type", "verification_id_type VARCHAR(80) NULL");
        await ensureColumnExists(
          "verification_id_reference",
          "verification_id_reference VARCHAR(120) NULL",
        );
        await ensureColumnExists(
          "verification_id_document_url",
          "verification_id_document_url TEXT NULL",
        );
        await ensureColumnExists(
          "verification_address_document_url",
          "verification_address_document_url TEXT NULL",
        );
        await ensureColumnExists("verification_address_text", "verification_address_text TEXT NULL");
        await ensureColumnExists(
          "verification_submission_note",
          "verification_submission_note TEXT NULL",
        );
        await ensureColumnExists("verification_review_note", "verification_review_note TEXT NULL");
        await ensureColumnExists(
          "verification_submitted_at",
          "verification_submitted_at TIMESTAMP NULL DEFAULT NULL",
          "verification_submitted_at TIMESTAMPTZ NULL DEFAULT NULL",
        );
        await ensureColumnExists(
          "verification_reviewed_at",
          "verification_reviewed_at TIMESTAMP NULL DEFAULT NULL",
          "verification_reviewed_at TIMESTAMPTZ NULL DEFAULT NULL",
        );
        await ensureColumnExists(
          "verification_reviewed_by",
          "verification_reviewed_by VARCHAR(120) NULL",
        );
        await executeStatement(
          "UPDATE marketplace_users SET verification_status = 'unsubmitted' WHERE verification_status IS NULL OR verification_status = ''",
        );
        return;
      }

      const pool = getMysqlPool();

      await pool.execute(`
        CREATE TABLE IF NOT EXISTS marketplace_users (
          id CHAR(36) NOT NULL PRIMARY KEY,
          keycloak_sub VARCHAR(128) NOT NULL UNIQUE,
          email VARCHAR(255) NULL,
          preferred_username VARCHAR(255) NULL,
          display_name VARCHAR(255) NULL,
          first_name VARCHAR(120) NULL,
          last_name VARCHAR(120) NULL,
          verification_status VARCHAR(32) NOT NULL DEFAULT 'unsubmitted',
          verification_phone VARCHAR(40) NULL,
          verification_id_type VARCHAR(80) NULL,
          verification_id_reference VARCHAR(120) NULL,
          verification_id_document_url TEXT NULL,
          verification_address_document_url TEXT NULL,
          verification_address_text TEXT NULL,
          verification_submission_note TEXT NULL,
          verification_review_note TEXT NULL,
          verification_submitted_at TIMESTAMP NULL DEFAULT NULL,
          verification_reviewed_at TIMESTAMP NULL DEFAULT NULL,
          verification_reviewed_by VARCHAR(120) NULL,
          last_login_at TIMESTAMP NULL DEFAULT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          KEY idx_marketplace_users_email (email),
          KEY idx_marketplace_users_preferred_username (preferred_username)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await ensureColumnExists(
        "verification_status",
        "verification_status VARCHAR(32) NOT NULL DEFAULT 'unsubmitted'",
      );
      await ensureColumnExists("verification_phone", "verification_phone VARCHAR(40) NULL");
      await ensureColumnExists("verification_id_type", "verification_id_type VARCHAR(80) NULL");
      await ensureColumnExists(
        "verification_id_reference",
        "verification_id_reference VARCHAR(120) NULL",
      );
      await ensureColumnExists(
        "verification_id_document_url",
        "verification_id_document_url TEXT NULL",
      );
      await ensureColumnExists(
        "verification_address_document_url",
        "verification_address_document_url TEXT NULL",
      );
      await ensureColumnExists("verification_address_text", "verification_address_text TEXT NULL");
      await ensureColumnExists(
        "verification_submission_note",
        "verification_submission_note TEXT NULL",
      );
      await ensureColumnExists("verification_review_note", "verification_review_note TEXT NULL");
      await ensureColumnExists(
        "verification_submitted_at",
        "verification_submitted_at TIMESTAMP NULL DEFAULT NULL",
        "verification_submitted_at TIMESTAMPTZ NULL DEFAULT NULL",
      );
      await ensureColumnExists(
        "verification_reviewed_at",
        "verification_reviewed_at TIMESTAMP NULL DEFAULT NULL",
        "verification_reviewed_at TIMESTAMPTZ NULL DEFAULT NULL",
      );
      await ensureColumnExists(
        "verification_reviewed_by",
        "verification_reviewed_by VARCHAR(120) NULL",
      );
      await executeStatement(
        "UPDATE marketplace_users SET verification_status = 'unsubmitted' WHERE verification_status IS NULL OR verification_status = ''",
      );
      return;
    })();
  }

  try {
    await usersTableReady;
  } catch (error) {
    usersTableReady = null;
    throw error;
  }
}

export async function getMarketplaceUserById(
  id: string,
): Promise<MarketplaceUser | undefined> {
  await ensureUsersTable();
  const rows = await queryRows<MarketplaceUserRow>(
    `
      SELECT
        id,
        keycloak_sub,
        email,
        preferred_username,
        display_name,
        first_name,
        last_name,
        verification_status,
        verification_phone,
        verification_id_type,
        verification_id_reference,
        verification_id_document_url,
        verification_address_document_url,
        verification_address_text,
        verification_submission_note,
        verification_review_note,
        verification_submitted_at,
        verification_reviewed_at,
        verification_reviewed_by,
        last_login_at,
        created_at,
        updated_at
      FROM marketplace_users
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

  return rows[0] ? mapRowToMarketplaceUser(rows[0]) : undefined;
}

export async function upsertMarketplaceUser(
  input: UpsertMarketplaceUserInput,
): Promise<MarketplaceUser | undefined> {
  await ensureUsersTable();
  const normalizedEmail = normalizeNullable(input.email);
  const normalizedPreferredUsername = normalizeNullable(input.preferredUsername);
  const normalizedFirstName = normalizeNullable(input.firstName);
  const normalizedLastName = normalizeNullable(input.lastName);
  const derivedDisplayName =
    [normalizedFirstName, normalizedLastName].filter(Boolean).join(" ") || null;
  const normalizedDisplayName =
    normalizeNullable(input.displayName) ??
    derivedDisplayName ??
    normalizedPreferredUsername;

  const existingRows = await queryRows<MarketplaceUserRow>(
    `
      SELECT
        id,
        keycloak_sub,
        email,
        preferred_username,
        display_name,
        first_name,
        last_name,
        verification_status,
        verification_phone,
        verification_id_type,
        verification_id_reference,
        verification_id_document_url,
        verification_address_document_url,
        verification_address_text,
        verification_submission_note,
        verification_review_note,
        verification_submitted_at,
        verification_reviewed_at,
        verification_reviewed_by,
        last_login_at,
        created_at,
        updated_at
      FROM marketplace_users
      WHERE keycloak_sub = ?
      LIMIT 1
    `,
    [input.authUserId],
  );

  if (existingRows[0]) {
    await executeStatement(
      `
        UPDATE marketplace_users
        SET
          email = ?,
          preferred_username = ?,
          display_name = ?,
          first_name = ?,
          last_name = ?,
          last_login_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE keycloak_sub = ?
      `,
      [
        normalizedEmail,
        normalizedPreferredUsername,
        normalizedDisplayName || null,
        normalizedFirstName,
        normalizedLastName,
        input.authUserId,
      ],
    );

    return getMarketplaceUserById(existingRows[0].id);
  }

  const id = randomUUID();

  await executeStatement(
    `
      INSERT INTO marketplace_users (
        id,
        keycloak_sub,
        email,
        preferred_username,
        display_name,
        first_name,
        last_name,
        last_login_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
    [
      id,
      input.authUserId,
      normalizedEmail,
      normalizedPreferredUsername,
      normalizedDisplayName || null,
      normalizedFirstName,
      normalizedLastName,
    ],
  );

  return getMarketplaceUserById(id);
}

export async function readMarketplaceUsers(): Promise<MarketplaceUser[]> {
  await ensureUsersTable();
  const rows = await queryRows<MarketplaceUserRow>(
    `
      SELECT
        id,
        keycloak_sub,
        email,
        preferred_username,
        display_name,
        first_name,
        last_name,
        verification_status,
        verification_phone,
        verification_id_type,
        verification_id_reference,
        verification_id_document_url,
        verification_address_document_url,
        verification_address_text,
        verification_submission_note,
        verification_review_note,
        verification_submitted_at,
        verification_reviewed_at,
        verification_reviewed_by,
        last_login_at,
        created_at,
        updated_at
      FROM marketplace_users
      ORDER BY
        COALESCE(verification_submitted_at, verification_reviewed_at, last_login_at, created_at) DESC,
        created_at DESC
    `,
  );

  return rows.map(mapRowToMarketplaceUser);
}

export async function submitMarketplaceUserVerification(
  input: SubmitMarketplaceUserVerificationInput,
) {
  await ensureUsersTable();

  await executeStatement(
    `
      UPDATE marketplace_users
      SET
        verification_phone = ?,
        verification_id_type = ?,
        verification_id_reference = ?,
        verification_id_document_url = ?,
        verification_address_document_url = ?,
        verification_address_text = ?,
        verification_submission_note = ?,
        verification_status = 'submitted',
        verification_submitted_at = CURRENT_TIMESTAMP,
        verification_review_note = NULL,
        verification_reviewed_at = NULL,
        verification_reviewed_by = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [
      normalizeNullable(input.phone),
      normalizeNullable(input.idType),
      normalizeNullable(input.idReference),
      normalizeNullable(input.idDocumentUrl),
      normalizeNullable(input.addressDocumentUrl),
      normalizeNullable(input.addressText),
      normalizeNullable(input.submissionNote),
      input.userId,
    ],
  );

  return getMarketplaceUserById(input.userId);
}

export async function updateMarketplaceUserVerification(
  userId: string,
  input: UpdateMarketplaceUserVerificationInput,
) {
  await ensureUsersTable();

  await executeStatement(
    `
      UPDATE marketplace_users
      SET
        verification_status = ?,
        verification_review_note = ?,
        verification_reviewed_by = ?,
        verification_reviewed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [
      input.status,
      normalizeNullable(input.reviewNote),
      normalizeNullable(input.reviewedBy),
      userId,
    ],
  );

  return getMarketplaceUserById(userId);
}
