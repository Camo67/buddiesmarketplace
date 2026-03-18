import { randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "@/lib/mysql";

export type MarketplaceUser = {
  id: string;
  keycloakSub: string;
  email: string | null;
  preferredUsername: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type MarketplaceUserRow = RowDataPacket & {
  id: string;
  keycloak_sub: string;
  email: string | null;
  preferred_username: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

type UpsertMarketplaceUserInput = {
  keycloakSub: string;
  email?: string | null;
  preferredUsername?: string | null;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

let usersTableReady: Promise<void> | null = null;

function normalizeDateTime(value: string | null) {
  if (!value) {
    return null;
  }

  return value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
}

function normalizeNullable(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function mapRowToMarketplaceUser(row: MarketplaceUserRow): MarketplaceUser {
  return {
    id: row.id,
    keycloakSub: row.keycloak_sub,
    email: row.email,
    preferredUsername: row.preferred_username,
    displayName: row.display_name,
    firstName: row.first_name,
    lastName: row.last_name,
    lastLoginAt: normalizeDateTime(row.last_login_at),
    createdAt: normalizeDateTime(row.created_at) ?? new Date(0).toISOString(),
    updatedAt: normalizeDateTime(row.updated_at) ?? new Date(0).toISOString(),
  };
}

async function ensureUsersTable() {
  if (!usersTableReady) {
    usersTableReady = (async () => {
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
          last_login_at TIMESTAMP NULL DEFAULT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          KEY idx_marketplace_users_email (email),
          KEY idx_marketplace_users_preferred_username (preferred_username)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    })();
  }

  try {
    await usersTableReady;
  } catch (error) {
    usersTableReady = null;
    throw error;
  }
}

export async function getMarketplaceUserById(id: string) {
  await ensureUsersTable();
  const pool = getMysqlPool();
  const [rows] = await pool.query<MarketplaceUserRow[]>(
    `
      SELECT
        id,
        keycloak_sub,
        email,
        preferred_username,
        display_name,
        first_name,
        last_name,
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

export async function upsertMarketplaceUser(input: UpsertMarketplaceUserInput) {
  await ensureUsersTable();
  const pool = getMysqlPool();
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

  const [existingRows] = await pool.query<MarketplaceUserRow[]>(
    `
      SELECT
        id,
        keycloak_sub,
        email,
        preferred_username,
        display_name,
        first_name,
        last_name,
        last_login_at,
        created_at,
        updated_at
      FROM marketplace_users
      WHERE keycloak_sub = ?
      LIMIT 1
    `,
    [input.keycloakSub],
  );

  if (existingRows[0]) {
    await pool.execute<ResultSetHeader>(
      `
        UPDATE marketplace_users
        SET
          email = ?,
          preferred_username = ?,
          display_name = ?,
          first_name = ?,
          last_name = ?,
          last_login_at = CURRENT_TIMESTAMP
        WHERE keycloak_sub = ?
      `,
      [
        normalizedEmail,
        normalizedPreferredUsername,
        normalizedDisplayName || null,
        normalizedFirstName,
        normalizedLastName,
        input.keycloakSub,
      ],
    );

    return getMarketplaceUserById(existingRows[0].id);
  }

  const id = randomUUID();

  await pool.execute<ResultSetHeader>(
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
      input.keycloakSub,
      normalizedEmail,
      normalizedPreferredUsername,
      normalizedDisplayName || null,
      normalizedFirstName,
      normalizedLastName,
    ],
  );

  return getMarketplaceUserById(id);
}
