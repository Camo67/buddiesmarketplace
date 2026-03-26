import { createHmac, timingSafeEqual } from "node:crypto";

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function getMetaWebhookVerifyToken() {
  return stringValue(process.env.META_WEBHOOK_VERIFY_TOKEN);
}

export function getMetaAppSecret() {
  return stringValue(process.env.META_APP_SECRET);
}

export function verifyMetaWebhookSignature(rawBody: string, signatureHeader: string | null) {
  const secret = getMetaAppSecret();

  if (!secret || !signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = signatureHeader.slice("sha256=".length);

  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(provided, "hex");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

export type MetaWebhookPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: {
        messaging_product?: string;
        metadata?: Record<string, unknown>;
        contacts?: Array<Record<string, unknown>>;
        messages?: Array<Record<string, unknown>>;
        statuses?: Array<Record<string, unknown>>;
        [key: string]: unknown;
      };
    }>;
    [key: string]: unknown;
  }>;
};
