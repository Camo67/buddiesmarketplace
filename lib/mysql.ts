import mysql, { type Pool } from "mysql2/promise";

declare global {
  var buddiesMysqlPool: Pool | undefined;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getConfiguredMysqlUrl() {
  const configured =
    stringValue(process.env.APP_DB_URL) ??
    stringValue(process.env.DATABASE_URL) ??
    stringValue(process.env.MYSQL_URL);

  if (!configured) {
    return null;
  }

  return configured.startsWith("mysql://") || configured.startsWith("mariadb://")
    ? configured
    : null;
}

function getMysqlConfig() {
  const configuredUrl = getConfiguredMysqlUrl();

  if (configuredUrl) {
    const url = new URL(configuredUrl);
    const database = url.pathname.replace(/^\//, "");

    if (!database || !url.username || !url.password) {
      throw new Error(
        "Invalid MySQL connection string. Set DATABASE_URL, APP_DB_URL, or MYSQL_URL using mysql://user:pass@host:3306/database.",
      );
    }

    return {
      host: url.hostname,
      port: Number(url.port || "3306"),
      database,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
    };
  }

  const host = process.env.APP_DB_HOST ?? process.env.MYSQL_HOST ?? "127.0.0.1";
  const port = Number(process.env.APP_DB_PORT ?? process.env.MYSQL_PORT ?? "3306");
  const database = process.env.APP_DB_NAME ?? process.env.MYSQL_DATABASE;
  const user = process.env.APP_DB_USER ?? process.env.MYSQL_USER;
  const password = process.env.APP_DB_PASSWORD ?? process.env.MYSQL_PASSWORD;

  if (!database || !user || !password) {
    throw new Error(
      "Missing MySQL connection settings. Set APP_DB_* or MYSQL_* environment variables.",
    );
  }

  return {
    host,
    port,
    database,
    user,
    password,
  };
}

export function getMysqlPool() {
  if (!globalThis.buddiesMysqlPool) {
    const config = getMysqlConfig();

    globalThis.buddiesMysqlPool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: "utf8mb4",
      timezone: "Z",
      dateStrings: true,
    });
  }

  return globalThis.buddiesMysqlPool;
}
