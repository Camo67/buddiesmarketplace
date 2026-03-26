import type { UserSession } from "../../../lib/user-auth";

declare module "fastify" {
  interface FastifyRequest {
    userSession?: UserSession | null;
  }
}
