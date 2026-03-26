import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import formbody from "@fastify/formbody";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { getServerEnv } from "./config/env";
import { isAppError } from "./lib/app-error";
import { registerAuthRoutes } from "./modules/auth/auth.routes";
import { registerProfileRoutes } from "./modules/profiles/profile.routes";

export async function buildServer() {
  const env = getServerEnv();
  const allowedOrigins = new Set(env.allowedOrigins);
  const app = Fastify({
    logger: true,
    trustProxy: true,
  });

  await app.register(cookie);
  await app.register(formbody);
  await app.register(rateLimit, {
    global: false,
  });
  await app.register(cors, {
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
  });

  app.setErrorHandler((error, request, reply) => {
    if (isAppError(error)) {
      return reply.status(error.statusCode).send({
        success: false,
        code: error.code,
        message: error.message,
        details: error.details,
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      success: false,
      code: "internal_error",
      message: "Internal server error.",
    });
  });

  app.get("/health", async () => ({
    status: "ok",
    service: "buddies-auth-api",
    uptimeSeconds: Math.round(process.uptime()),
  }));

  await app.register(registerAuthRoutes, {
    prefix: "/api/auth",
  });
  await app.register(registerProfileRoutes, {
    prefix: "/api/profiles",
  });

  return app;
}
