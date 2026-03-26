import type { FastifyReply, FastifyRequest } from "fastify";
import { ProfileService } from "./profile.service";

export function buildProfileController(profileService: ProfileService) {
  return {
    getPublicProfile: async (
      request: FastifyRequest<{ Params: { userId: string } }>,
      reply: FastifyReply,
    ) => {
      const profile = await profileService.getPublicProfile(request.params.userId);

      return reply.send({
        success: true,
        profile,
      });
    },
  };
}
