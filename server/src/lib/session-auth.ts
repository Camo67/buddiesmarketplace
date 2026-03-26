import type { FastifyRequest } from "fastify";
import { readUserSession, userSessionCookieName } from "../../../lib/user-auth";
import { AppError } from "./app-error";

export async function loadUserSession(request: FastifyRequest) {
  if (request.userSession !== undefined) {
    return request.userSession;
  }

  request.userSession = await readUserSession(request.cookies[userSessionCookieName]);
  return request.userSession;
}

export async function requireUserSession(request: FastifyRequest) {
  const session = await loadUserSession(request);

  if (!session) {
    throw new AppError("Authentication is required.", {
      statusCode: 401,
      code: "unauthorized",
    });
  }

  return session;
}
