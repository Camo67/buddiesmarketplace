import type { FastifyReply, FastifyRequest } from "fastify";
import type { LoginBody, SignUpBody } from "./auth.schemas";
import { requireUserSession } from "../../lib/session-auth";
import { AuthService } from "./auth.service";

export function buildAuthController(authService: AuthService) {
  return {
    signUp: async (request: FastifyRequest<{ Body: SignUpBody }>, reply: FastifyReply) => {
      const result = await authService.signUp(reply, {
        email: request.body.email,
        password: request.body.password,
        displayName: request.body.displayName,
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        phoneNumber: request.body.phoneNumber,
        next: request.body.next,
      });

      return reply.code(201).send({
        success: true,
        ...result,
      });
    },

    login: async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
      const result = await authService.login(reply, {
        email: request.body.email,
        password: request.body.password,
      });

      return reply.send({
        success: true,
        ...result,
      });
    },

    logout: async (_request: FastifyRequest, reply: FastifyReply) => {
      authService.clearSessionCookies(reply);

      return reply.send({
        success: true,
      });
    },

    me: async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireUserSession(request);
      const user = await authService.getCurrentUser(session.authUserId);

      return reply.send({
        success: true,
        session,
        user,
      });
    },
  };
}
