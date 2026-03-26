import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "./mysql";

type CanonicalAccountRow = RowDataPacket & {
  user_id: string;
  email: string;
  role: string;
  account_status: string;
  email_precheck_signal_json: string | null;
  user_created_at: string;
  user_updated_at: string;
  profile_id: number | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  business_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  province: string | null;
  city: string | null;
  trust_level: string | null;
  trust_score: number | null;
  is_fica_verified: number | null;
  fica_verified_at: string | null;
  did_uri: string | null;
  public_profile_json: string | null;
  profile_created_at: string | null;
  profile_updated_at: string | null;
};

export type CanonicalUserAccount = {
  userId: string;
  email: string;
  role: string;
  accountStatus: string;
  emailPrecheckSignal: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  profile: {
    id: number | null;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    businessName: string | null;
    phoneNumber: string | null;
    avatarUrl: string | null;
    province: string | null;
    city: string | null;
    trustLevel: string | null;
    trustScore: number | null;
    isFicaVerified: boolean;
    ficaVerifiedAt: string | null;
    didUri: string | null;
    publicProfile: Record<string, unknown> | null;
    createdAt: string | null;
    updatedAt: string | null;
  };
};

export type UpsertCanonicalUserAccountInput = {
  userId: string;
  email: string;
  role?: "user" | "moderator" | "admin";
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  phoneNumber?: string | null;
  emailPrecheckSignal?: Record<string, unknown> | null;
  markEmailConfirmed?: boolean;
};

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function parseJsonValue(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function mapCanonicalAccount(row: CanonicalAccountRow): CanonicalUserAccount {
  return {
    userId: row.user_id,
    email: row.email,
    role: row.role,
    accountStatus: row.account_status,
    emailPrecheckSignal: parseJsonValue(row.email_precheck_signal_json),
    createdAt: row.user_created_at,
    updatedAt: row.user_updated_at,
    profile: {
      id: row.profile_id,
      firstName: row.first_name,
      lastName: row.last_name,
      displayName: row.display_name,
      businessName: row.business_name,
      phoneNumber: row.phone_number,
      avatarUrl: row.avatar_url,
      province: row.province,
      city: row.city,
      trustLevel: row.trust_level,
      trustScore: row.trust_score,
      isFicaVerified: Boolean(row.is_fica_verified),
      ficaVerifiedAt: row.fica_verified_at,
      didUri: row.did_uri,
      publicProfile: parseJsonValue(row.public_profile_json),
      createdAt: row.profile_created_at,
      updatedAt: row.profile_updated_at,
    },
  };
}

async function withTransaction<T>(handler: (connection: PoolConnection) => Promise<T>) {
  const connection = await getMysqlPool().getConnection();

  try {
    await connection.beginTransaction();
    const result = await handler(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getCanonicalUserAccountByIdInternal(
  userId: string,
  connection?: PoolConnection,
) {
  const executor = connection ?? getMysqlPool();
  const [rows] = await executor.query<CanonicalAccountRow[]>(
    `
      SELECT
        u.id AS user_id,
        u.email,
        u.role,
        u.account_status,
        u.email_precheck_signal_json,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at,
        p.id AS profile_id,
        p.first_name,
        p.last_name,
        p.display_name,
        p.business_name,
        p.phone_number,
        p.avatar_url,
        p.province,
        p.city,
        p.trust_level,
        p.trust_score,
        p.is_fica_verified,
        p.fica_verified_at,
        p.did_uri,
        p.public_profile_json,
        p.created_at AS profile_created_at,
        p.updated_at AS profile_updated_at
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = ?
      LIMIT 1
    `,
    [userId],
  );

  return rows[0] ? mapCanonicalAccount(rows[0]) : null;
}

export async function getCanonicalUserAccountById(userId: string) {
  return getCanonicalUserAccountByIdInternal(userId);
}

export async function upsertCanonicalUserAccount(input: UpsertCanonicalUserAccountInput) {
  const normalizedDisplayName =
    stringValue(input.displayName) ??
    ([stringValue(input.firstName), stringValue(input.lastName)].filter(Boolean).join(" ") ||
      null);
  const publicProfileJson = JSON.stringify({
    source: "fastify_auth",
  });
  const emailPrecheckSignalJson = input.emailPrecheckSignal
    ? JSON.stringify(input.emailPrecheckSignal)
    : null;

  return withTransaction(async (connection) => {
    await connection.execute(
      `
        INSERT INTO users (
          id,
          email,
          role,
          account_status,
          email_precheck_signal_json
        )
        VALUES (?, ?, ?, 'active', ?)
        ON DUPLICATE KEY UPDATE
          email = VALUES(email),
          email_precheck_signal_json = COALESCE(
            VALUES(email_precheck_signal_json),
            email_precheck_signal_json
          ),
          updated_at = CURRENT_TIMESTAMP
      `,
      [input.userId, input.email, input.role ?? "user", emailPrecheckSignalJson],
    );

    await connection.execute(
      `
        INSERT INTO profiles (
          user_id,
          first_name,
          last_name,
          display_name,
          phone_number,
          trust_level,
          trust_score,
          public_profile_json
        )
        VALUES (?, ?, ?, ?, ?, ?, 0, ?)
        ON DUPLICATE KEY UPDATE
          first_name = COALESCE(VALUES(first_name), first_name),
          last_name = COALESCE(VALUES(last_name), last_name),
          display_name = COALESCE(VALUES(display_name), display_name),
          phone_number = COALESCE(VALUES(phone_number), phone_number),
          trust_level = CASE
            WHEN ? = 1 AND trust_level = 'unverified' THEN 'email_checked'
            ELSE trust_level
          END,
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        input.userId,
        stringValue(input.firstName),
        stringValue(input.lastName),
        normalizedDisplayName,
        stringValue(input.phoneNumber),
        input.markEmailConfirmed ? "email_checked" : "unverified",
        publicProfileJson,
        input.markEmailConfirmed ? 1 : 0,
      ],
    );

    const account = await getCanonicalUserAccountByIdInternal(input.userId, connection);

    if (!account) {
      throw new Error("Could not load the canonical user account after upsert.");
    }

    return account;
  });
}
