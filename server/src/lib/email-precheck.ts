import { resolveMx } from "node:dns/promises";
import { getServerEnv } from "../config/env";

type EmailVerifierResult = {
  catchAll?: string;
  disposable?: string;
  dns?: string;
  emailAddress?: string;
  free?: string;
  mxs?: string[];
  smtp?: string;
  validFormat?: string;
};

export type EmailPrecheckSignal = {
  provider: "email-verifier" | "local-fallback";
  status: "ok" | "review" | "invalid" | "limited";
  checkedAt: string;
  email: string;
  validFormat: boolean;
  dnsValid: boolean | null;
  disposable: boolean | null;
  mxRecords: string[];
  warnings: string[];
  providerError: string | null;
  raw: Record<string, unknown> | null;
};


function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function isValidEmailFormat(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseBooleanFlag(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = stringValue(value)?.toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return null;
}

function buildWarnings(signal: {
  validFormat: boolean;
  dnsValid: boolean | null;
  disposable: boolean | null;
  providerError: string | null;
}) {
  const warnings: string[] = [];

  if (!signal.validFormat) {
    warnings.push("The email address format looks invalid.");
  }

  if (signal.dnsValid === false) {
    warnings.push("The email domain does not appear to accept mail.");
  }

  if (signal.disposable === true) {
    warnings.push("Disposable email domains may slow down trust verification.");
  }

  if (signal.providerError) {
    warnings.push("The full email-risk check was unavailable, so a lighter fallback check was used.");
  }

  return warnings;
}

function getStatus(signal: {
  provider: "email-verifier" | "local-fallback";
  validFormat: boolean;
  dnsValid: boolean | null;
  disposable: boolean | null;
  providerError: string | null;
}) {
  if (!signal.validFormat) {
    return "invalid" as const;
  }

  if (signal.dnsValid === false || signal.disposable === true) {
    return "review" as const;
  }

  if (signal.provider === "local-fallback" || signal.providerError) {
    return "limited" as const;
  }

  return "ok" as const;
}

// Fixed origin, no redirects, bounded response and timeout. No provider key means local fallback.
async function verifyWithProvider(email: string, apiKey: string): Promise<EmailVerifierResult> {
  const url = new URL("https://emailverification.whoisxmlapi.com/api/v1");
  for (const [key, value] of Object.entries({
    apiKey, emailAddress: email, validateDNS: "true", validateSMTP: "false",
    checkCatchAll: "false", checkFree: "false", checkDisposable: "true", outputFormat: "json",
  })) url.searchParams.set(key, value);

  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(5000) });
  if (!response.ok || !response.body) throw new Error("email_verifier_unavailable");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 32768) throw new Error("email_verifier_unavailable");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const data: unknown = JSON.parse(new TextDecoder().decode(bytes));
  if (!data || typeof data !== "object" || Array.isArray(data) ||
      "ErrorMessage" in data || !("emailAddress" in data) || data.emailAddress !== email) {
    throw new Error("email_verifier_unavailable");
  }
  return data as EmailVerifierResult;
}

async function runLocalFallback(email: string, providerError: string | null) {
  const checkedAt = new Date().toISOString();
  const validFormat = isValidEmailFormat(email);
  const domain = validFormat ? email.split("@")[1] : null;
  let dnsValid: boolean | null = null;
  let mxRecords: string[] = [];

  if (domain) {
    try {
      const records = await resolveMx(domain);
      mxRecords = records.map((record) => record.exchange);
      dnsValid = records.length > 0;
    } catch {
      dnsValid = false;
    }
  }

  const baseSignal = {
    provider: "local-fallback" as const,
    checkedAt,
    email,
    validFormat,
    dnsValid,
    disposable: null,
    mxRecords,
    providerError,
    raw: null,
  };

  return {
    ...baseSignal,
    status: getStatus(baseSignal),
    warnings: buildWarnings(baseSignal),
  } satisfies EmailPrecheckSignal;
}

async function runProviderCheck(email: string) {
  const { emailVerifierApiKey } = getServerEnv();

  if (!emailVerifierApiKey) {
    return runLocalFallback(email, null);
  }

  try {
    const raw = await verifyWithProvider(email, emailVerifierApiKey);

    const signalBase = {
      provider: "email-verifier" as const,
      checkedAt: new Date().toISOString(),
      email,
      validFormat: stringValue(raw.validFormat)?.toUpperCase() === "OK",
      dnsValid:
        raw.dns == null ? null : stringValue(raw.dns)?.toUpperCase() === "OK",
      disposable: parseBooleanFlag(raw.disposable),
      mxRecords: Array.isArray(raw.mxs) ? raw.mxs.filter((entry) => typeof entry === "string") : [],
      providerError: null,
      raw: raw as Record<string, unknown>,
    };

    return {
      ...signalBase,
      status: getStatus(signalBase),
      warnings: buildWarnings(signalBase),
    } satisfies EmailPrecheckSignal;
  } catch {
    return runLocalFallback(email, "email_verifier_unavailable");
  }
}

export async function runEmailPrecheck(email: string) {
  return runProviderCheck(email.trim().toLowerCase());
}
