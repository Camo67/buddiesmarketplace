import type { FastifyInstance } from "fastify";
import { buildProfileController } from "./profile.controller";
import { ProfileService } from "./profile.service";

export async function registerProfileRoutes(fastify: FastifyInstance) {
  const profileService = new ProfileService();
  const profileController = buildProfileController(profileService);

  fastify.get(
    "/:userId",
    {
      config: {
        rateLimit: {
          max: 60,
          timeWindow: "1 minute",
        },
      },
    },
    profileController.getPublicProfile,
  );
}
