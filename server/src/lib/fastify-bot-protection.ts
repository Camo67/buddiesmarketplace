import type { FastifyRequest } from "fastify";
import {
  readBotProtectionFromBody,
  verifyBotProtectedRequest,
} from "../../../lib/bot-protection";
import { AppError } from "./app-error";

function buildRequestUrl(request: FastifyRequest) {
  const protocol =
    request.headers["x-forwarded-proto"]?.toString().split(",")[0]?.trim() ??
    request.protocol ??
    "http";
  const host =
    request.headers["x-forwarded-host"]?.toString().split(",")[0]?.trim() ??
    request.headers.host ??
    request.hostname;

  return new URL(request.raw.url ?? "/", `${protocol}://${host}`);
}

function toWebRequest(request: FastifyRequest) {
  const headers = new Headers();

  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        headers.append(key, entry);
      }
      continue;
    }

    if (typeof value === "string") {
      headers.set(key, value);
    }
  }

  return new Request(buildRequestUrl(request), {
    method: request.method,
    headers,
  });
}

export async function verifyFastifyBotProtection(request: FastifyRequest, action: string) {
  const result = await verifyBotProtectedRequest({
    request: toWebRequest(request),
    action,
    botProtection: readBotProtectionFromBody(
      request.body && typeof request.body === "object" ? (request.body as Record<string, unknown>) : null,
    ),
  });

  if (!result.ok) {
    throw new AppError(result.message ?? "Please complete the anti-bot check and try again.", {
      statusCode: 400,
      code: "bot_protection_failed",
    });
  }
}
