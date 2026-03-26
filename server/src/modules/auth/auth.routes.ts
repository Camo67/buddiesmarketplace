import type { FastifyInstance } from "fastify";
import { verifyFastifyBotProtection } from "../../lib/fastify-bot-protection";
import { requireUserSession } from "../../lib/session-auth";
import { buildAuthController } from "./auth.controller";
import { loginSchema, signUpSchema } from "./auth.schemas";
import { AuthService } from "./auth.service";

export async function registerAuthRoutes(fastify: FastifyInstance) {
  const authService = new AuthService();
  const authController = buildAuthController(authService);

  fastify.post(
    "/signup",
    {
      schema: signUpSchema,
      config: {
        rateLimit: {
          max: 4,
          timeWindow: "15 minutes",
        },
      },
      preHandler: async (request) => {
        await verifyFastifyBotProtection(request, "account_auth");
      },
    },
    authController.signUp,
  );

  fastify.post(
    "/login",
    {
      schema: loginSchema,
      config: {
        rateLimit: {
          max: 8,
          timeWindow: "10 minutes",
        },
      },
      preHandler: async (request) => {
        await verifyFastifyBotProtection(request, "account_auth");
      },
    },
    authController.login,
  );

  fastify.post(
    "/logout",
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: "5 minutes",
        },
      },
    },
    authController.logout,
  );

  fastify.get(
    "/me",
    {
      preHandler: async (request) => {
        await requireUserSession(request);
      },
    },
    authController.me,
  );
}
