import mysql, { type Pool } from "mysql2/promise";

declare global {
  var buddiesMysqlPool: Pool | undefined;
}

function getMysqlConfig() {
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
