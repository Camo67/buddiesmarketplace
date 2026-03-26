import {
  botProtectionHoneypotFieldName,
  botProtectionResponseFieldName,
  botProtectionStartedAtFieldName,
  type BotProtectionPayload,
} from "./bot-protection-fields";

const turnstileVerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const fallbackMinimumFillMs = 1200;

type TurnstileValidationResult = {
  success: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function normalizeHostname(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  return normalized.includes(":") ? normalized.split(":")[0] : normalized;
}

function getTurnstileSiteKey() {
  return stringValue(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

function getTurnstileSecretKey() {
  return stringValue(process.env.TURNSTILE_SECRET_KEY);
}

export function getBotProtectionPublicConfig() {
  const siteKey = getTurnstileSiteKey();
  const secretKey = getTurnstileSecretKey();
  const enabled = Boolean(siteKey && secretKey);

  return {
    enabled,
    siteKey: enabled ? siteKey : null,
  };
}

export function readBotProtectionFromFormData(formData: FormData): BotProtectionPayload {
  return {
    honeypot: formData.get(botProtectionHoneypotFieldName),
    startedAt: formData.get(botProtectionStartedAtFieldName),
    turnstileToken: formData.get(botProtectionResponseFieldName),
  };
}

export function readBotProtectionFromBody(
  body: Record<string, unknown> | null | undefined,
): BotProtectionPayload {
  const nested = body?.botProtection;
  const source =
    nested && typeof nested === "object" && !Array.isArray(nested)
      ? (nested as Record<string, unknown>)
      : body ?? {};

  return {
    honeypot: source[botProtectionHoneypotFieldName] ?? source.honeypot,
    startedAt: source[botProtectionStartedAtFieldName] ?? source.startedAt,
    turnstileToken:
      source[botProtectionResponseFieldName] ??
      source.turnstileToken ??
      source.turnstileTokenValue,
  };
}

function getRequestIp(request: Request) {
  return (
    firstHeaderValue(request.headers.get("cf-connecting-ip")) ??
    firstHeaderValue(request.headers.get("x-forwarded-for")) ??
    null
  );
}

function getExpectedHostname(request: Request) {
  return (
    normalizeHostname(firstHeaderValue(request.headers.get("x-forwarded-host"))) ??
    normalizeHostname(firstHeaderValue(request.headers.get("host"))) ??
    normalizeHostname(new URL(request.url).hostname)
  );
}

async function validateTurnstileToken(input: {
  token: string;
  request: Request;
  expectedAction: string;
}) {
  const secretKey = getTurnstileSecretKey();

  if (!secretKey) {
    return {
      success: false,
      "error-codes": ["missing-input-secret"],
    } satisfies TurnstileValidationResult;
  }

  const formData = new FormData();
  formData.append("secret", secretKey);
  formData.append("response", input.token);

  const remoteIp = getRequestIp(input.request);

  if (remoteIp) {
    formData.append("remoteip", remoteIp);
  }

  const response = await fetch(turnstileVerifyUrl, {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as TurnstileValidationResult | null;
  const result = payload ?? {
    success: false,
    "error-codes": ["internal-error"],
  };

  if (!result.success) {
    return result;
  }

  if (result.action && result.action !== input.expectedAction) {
    return {
      success: false,
      "error-codes": ["action-mismatch"],
    } satisfies TurnstileValidationResult;
  }

  const expectedHostname = getExpectedHostname(input.request);

  if (result.hostname && expectedHostname && normalizeHostname(result.hostname) !== expectedHostname) {
    return {
      success: false,
      "error-codes": ["hostname-mismatch"],
    } satisfies TurnstileValidationResult;
  }

  return result;
}

function mapTurnstileError(errorCodes: string[]) {
  if (errorCodes.includes("missing-input-response")) {
    return "Please complete the anti-bot check and try again.";
  }

  if (errorCodes.includes("timeout-or-duplicate")) {
    return "The anti-bot check expired. Please try again.";
  }

  if (
    errorCodes.includes("invalid-input-response") ||
    errorCodes.includes("action-mismatch") ||
    errorCodes.includes("hostname-mismatch")
  ) {
    return "The anti-bot check was not accepted. Please try again.";
  }

  return "Bot protection could not verify this request. Please try again.";
}

export async function verifyBotProtectedRequest(input: {
  request: Request;
  action: string;
  botProtection: BotProtectionPayload;
}) {
  const honeypotValue = stringValue(input.botProtection.honeypot);

  if (honeypotValue) {
    return {
      ok: false,
      message: "Automated submissions are not allowed.",
    };
  }

  const { enabled } = getBotProtectionPublicConfig();

  if (!enabled) {
    const startedAtValue = stringValue(input.botProtection.startedAt);
    const startedAt = startedAtValue ? Number.parseInt(startedAtValue, 10) : Number.NaN;

    if (!Number.isFinite(startedAt) || Date.now() - startedAt < fallbackMinimumFillMs) {
      return {
        ok: false,
        message: "Please wait a moment and try again.",
      };
    }

    return {
      ok: true,
    };
  }

  const token = stringValue(input.botProtection.turnstileToken);

  if (!token) {
    return {
      ok: false,
      message: "Please complete the anti-bot check and try again.",
    };
  }

  try {
    const validation = await validateTurnstileToken({
      token,
      request: input.request,
      expectedAction: input.action,
    });

    if (!validation.success) {
      return {
        ok: false,
        message: mapTurnstileError(validation["error-codes"] ?? []),
      };
    }

    return {
      ok: true,
    };
  } catch {
    return {
      ok: false,
      message: "Bot protection could not verify this request. Please try again.",
    };
  }
}
