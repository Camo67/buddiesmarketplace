import type { ResultSetHeader } from "mysql2/promise";
import { Pool as PostgresPool, type QueryResultRow } from "pg";
import { getMysqlPool } from "@/lib/mysql";

declare global {
  var buddiesPostgresPool: PostgresPool | undefined;
}

export type DatabaseProvider = "mysql" | "postgres";

type ExecuteResult = {
  affectedRows: number;
};

type MysqlParameter =
  | string
  | number
  | bigint
  | boolean
  | Date
  | null
  | Buffer
  | Uint8Array;

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function isLocalDatabaseHost(host: string) {
  const normalized = host.trim().toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}

function shouldUsePostgresSsl(host: string) {
  return !isLocalDatabaseHost(host);
}

function getConfiguredPostgresUrl() {
  return (
    stringValue(process.env.APP_DB_URL) ??
    stringValue(process.env.DATABASE_URL) ??
    stringValue(process.env.POSTGRES_URL)
  );
}

function getPostgresConfig() {
  const connectionString = getConfiguredPostgresUrl();

  if (connectionString) {
    const host = new URL(connectionString).hostname;

    return {
      connectionString,
      ssl: shouldUsePostgresSsl(host)
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
    };
  }

  const host =
    process.env.APP_DB_HOST ??
    process.env.PGHOST ??
    process.env.POSTGRES_HOST ??
    "127.0.0.1";
  const port = Number(
    process.env.APP_DB_PORT ?? process.env.PGPORT ?? process.env.POSTGRES_PORT ?? "5432",
  );
  const database =
    process.env.APP_DB_NAME ??
    process.env.PGDATABASE ??
    process.env.POSTGRES_DATABASE;
  const user =
    process.env.APP_DB_USER ??
    process.env.PGUSER ??
    process.env.POSTGRES_USER;
  const password =
    process.env.APP_DB_PASSWORD ??
    process.env.PGPASSWORD ??
    process.env.POSTGRES_PASSWORD;

  if (!database || !user || !password) {
    throw new Error(
      "Missing PostgreSQL connection settings. Set APP_DB_URL, DATABASE_URL, POSTGRES_URL, or APP_DB_* environment variables.",
    );
  }

  return {
    host,
    port,
    database,
    user,
    password,
    ssl: shouldUsePostgresSsl(host)
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
  };
}

export function getDatabaseProvider(): DatabaseProvider {
  const configuredProvider = stringValue(process.env.APP_DB_PROVIDER)?.toLowerCase();

  if (configuredProvider === "mysql" || configuredProvider === "postgres") {
    return configuredProvider;
  }

  const postgresUrl = getConfiguredPostgresUrl();

  if (postgresUrl?.startsWith("postgres://") || postgresUrl?.startsWith("postgresql://")) {
    return "postgres";
  }

  return "mysql";
}

export function isPostgresProvider() {
  return getDatabaseProvider() === "postgres";
}

export function getPostgresPool() {
  if (!globalThis.buddiesPostgresPool) {
    globalThis.buddiesPostgresPool = new PostgresPool({
      ...getPostgresConfig(),
      max: 10,
    });
  }

  return globalThis.buddiesPostgresPool;
}

function toPostgresPlaceholders(sql: string) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function toMysqlParams(params: readonly unknown[]) {
  return params as MysqlParameter[];
}

export async function queryRows<T extends QueryResultRow>(
  sql: string,
  params: readonly unknown[] = [],
) {
  if (isPostgresProvider()) {
    const result = await getPostgresPool().query<T>(
      toPostgresPlaceholders(sql),
      [...params],
    );
    return result.rows;
  }

  const [rows] = await getMysqlPool().query(sql, toMysqlParams(params));
  return rows as T[];
}

export async function executeStatement(
  sql: string,
  params: readonly unknown[] = [],
): Promise<ExecuteResult> {
  if (isPostgresProvider()) {
    const result = await getPostgresPool().query(toPostgresPlaceholders(sql), [...params]);
    return {
      affectedRows: result.rowCount ?? 0,
    };
  }

  const [result] = await getMysqlPool().execute<ResultSetHeader>(sql, toMysqlParams(params));
  return {
    affectedRows: result.affectedRows,
  };
}

export async function runSchemaStatement(sql: string) {
  if (isPostgresProvider()) {
    await getPostgresPool().query(sql);
    return;
  }

  await getMysqlPool().execute(sql);
}
