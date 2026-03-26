import { config as loadEnv } from "dotenv";

loadEnv();

export type ServerEnv = {
  apiHost: string;
  apiPort: number;
  appBaseUrl: string;
  allowedOrigins: string[];
  sessionSecret: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  emailVerifierApiKey: string | null;
};

let cachedEnv: ServerEnv | null = null;

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeOrigin(value: string, name: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a fully-qualified URL including http:// or https://.`);
  }

  return url.origin;
}

function parseOriginList(value: string | null, name: string) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => normalizeOrigin(entry, name));
}

function parsePort(value: string | null, fallback: number) {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function hasMysqlConfig() {
  const mysqlUrl =
    stringValue(process.env.DATABASE_URL) ??
    stringValue(process.env.APP_DB_URL) ??
    stringValue(process.env.MYSQL_URL);

  if (mysqlUrl?.startsWith("mysql://") || mysqlUrl?.startsWith("mariadb://")) {
    return true;
  }

  return Boolean(
    (stringValue(process.env.APP_DB_NAME) || stringValue(process.env.MYSQL_DATABASE)) &&
      (stringValue(process.env.APP_DB_USER) || stringValue(process.env.MYSQL_USER)) &&
      (stringValue(process.env.APP_DB_PASSWORD) || stringValue(process.env.MYSQL_PASSWORD)),
  );
}

export function getServerEnv() {
  if (cachedEnv) {
    return cachedEnv;
  }

  const appBaseUrl = normalizeOrigin(
    stringValue(process.env.APP_BASE_URL) ?? "http://localhost:3000",
    "APP_BASE_URL",
  );
  const allowedOrigins = new Set<string>([
    appBaseUrl,
    ...parseOriginList(stringValue(process.env.APP_BASE_URL_ALIASES), "APP_BASE_URL_ALIASES"),
    ...parseOriginList(stringValue(process.env.API_CORS_ORIGINS), "API_CORS_ORIGINS"),
  ]);
  const sessionSecret = stringValue(process.env.APP_SESSION_SECRET);
  const supabaseUrl =
    stringValue(process.env.SUPABASE_URL) ?? stringValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey =
    stringValue(process.env.SUPABASE_ANON_KEY) ??
    stringValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasMysqlConfig()) {
    throw new Error(
      "Missing MySQL settings. Set DATABASE_URL/APP_DB_URL or APP_DB_*/MYSQL_* environment variables.",
    );
  }

  if (!sessionSecret) {
    throw new Error("Missing APP_SESSION_SECRET for the Fastify auth server.");
  }

  if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.");
  }

  if (!supabaseAnonKey) {
    throw new Error("Missing SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  cachedEnv = {
    apiHost: stringValue(process.env.API_HOST) ?? "0.0.0.0",
    apiPort: parsePort(stringValue(process.env.API_PORT), 4000),
    appBaseUrl,
    allowedOrigins: [...allowedOrigins],
    sessionSecret,
    supabaseUrl,
    supabaseAnonKey,
    emailVerifierApiKey: stringValue(process.env.EMAIL_VERIFIER_API_KEY),
  };

  return cachedEnv;
}
