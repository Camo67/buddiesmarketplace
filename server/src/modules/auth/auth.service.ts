import type { FastifyReply } from "fastify";
import { buildAuthCookieOptions } from "../../../../lib/auth-runtime";
import {
  createUserSessionCookieValue,
  sanitizeUserRedirectPath,
  signInMarketplaceUser,
  signUpMarketplaceUser,
  userLoginCookieName,
  userSessionCookieName,
} from "../../../../lib/user-auth";
import {
  getCanonicalUserAccountById,
  upsertCanonicalUserAccount,
} from "../../../../lib/canonical-accounts-store";
import { getServerEnv } from "../../config/env";
import { AppError } from "../../lib/app-error";
import { runEmailPrecheck } from "../../lib/email-precheck";

type SignUpInput = {
  email: string;
  password: string;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  next?: string | null;
};

type LoginInput = {
  email: string;
  password: string;
};

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function mapAuthError(error: unknown, mode: "signup" | "login") {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return new AppError("Invalid email or password.", {
      statusCode: 401,
      code: "invalid_credentials",
    });
  }

  if (normalized.includes("email not confirmed")) {
    return new AppError("Please confirm your email address before signing in.", {
      statusCode: 403,
      code: "email_not_confirmed",
    });
  }

  if (normalized.includes("user already registered")) {
    return new AppError("An account with this email address already exists.", {
      statusCode: 409,
      code: "account_exists",
    });
  }

  return new AppError(
    mode === "signup" ? "We could not create the account." : "We could not sign you in.",
    {
      statusCode: 400,
      code: mode === "signup" ? "sign_up_failed" : "sign_in_failed",
    },
  );
}

export class AuthService {
  private env = getServerEnv();

  private async setSessionCookies(
    reply: FastifyReply,
    input: {
      userId: string;
      email: string | null;
      preferredUsername: string | null;
      name: string | null;
      expiresAt: number;
    },
  ) {
    const maxAge = Math.max(0, input.expiresAt - Math.floor(Date.now() / 1000));
    const sessionCookieValue = await createUserSessionCookieValue({
      marketplaceUserId: input.userId,
      authUserId: input.userId,
      preferredUsername: input.preferredUsername,
      email: input.email,
      name: input.name,
      expiresAt: input.expiresAt,
    });

    reply.setCookie(userSessionCookieName, sessionCookieValue, {
      ...buildAuthCookieOptions(this.env.appBaseUrl, maxAge),
    });
    reply.setCookie(userLoginCookieName, "", {
      ...buildAuthCookieOptions(this.env.appBaseUrl, 0),
    });
  }

  clearSessionCookies(reply: FastifyReply) {
    reply.setCookie(userSessionCookieName, "", {
      ...buildAuthCookieOptions(this.env.appBaseUrl, 0),
    });
    reply.setCookie(userLoginCookieName, "", {
      ...buildAuthCookieOptions(this.env.appBaseUrl, 0),
    });
  }

  async signUp(reply: FastifyReply, input: SignUpInput) {
    const nextPath = sanitizeUserRedirectPath(input.next);
    const emailPrecheck = await runEmailPrecheck(input.email);
    const displayName =
      stringValue(input.displayName) ??
      ([stringValue(input.firstName), stringValue(input.lastName)].filter(Boolean).join(" ") ||
        null);

    try {
      const authResult = await signUpMarketplaceUser({
        email: input.email,
        password: input.password,
        displayName,
        nextPath,
        appBaseUrl: this.env.appBaseUrl,
      });
      const identity = authResult.identity;

      if (!identity) {
        throw new Error("Supabase did not return a user identity during sign-up.");
      }

      const account = await upsertCanonicalUserAccount({
        userId: identity.authUserId,
        email: authResult.email ?? identity.email ?? input.email,
        firstName: identity.firstName ?? input.firstName,
        lastName: identity.lastName ?? input.lastName,
        displayName: identity.name ?? displayName,
        phoneNumber: input.phoneNumber,
        emailPrecheckSignal: emailPrecheck,
        markEmailConfirmed: !authResult.needsEmailConfirmation,
      });

      if (!authResult.needsEmailConfirmation) {
        const sessionIdentity = authResult.identity as typeof identity & { expiresAt: number };

        await this.setSessionCookies(reply, {
          userId: account.userId,
          email: sessionIdentity.email,
          preferredUsername: sessionIdentity.preferredUsername,
          name: sessionIdentity.name,
          expiresAt: sessionIdentity.expiresAt,
        });
      } else {
        this.clearSessionCookies(reply);
      }

      return {
        requiresEmailConfirmation: authResult.needsEmailConfirmation,
        nextPath,
        emailPrecheck,
        user: account,
      };
    } catch (error) {
      throw mapAuthError(error, "signup");
    }
  }

  async login(reply: FastifyReply, input: LoginInput) {
    try {
      const identity = await signInMarketplaceUser({
        email: input.email,
        password: input.password,
      });
      const account = await upsertCanonicalUserAccount({
        userId: identity.authUserId,
        email: identity.email ?? input.email,
        firstName: identity.firstName,
        lastName: identity.lastName,
        displayName: identity.name,
        markEmailConfirmed: true,
      });

      await this.setSessionCookies(reply, {
        userId: account.userId,
        email: identity.email,
        preferredUsername: identity.preferredUsername,
        name: identity.name,
        expiresAt: identity.expiresAt,
      });

      return {
        user: account,
        session: {
          expiresAt: identity.expiresAt,
        },
      };
    } catch (error) {
      throw mapAuthError(error, "login");
    }
  }

  async getCurrentUser(authUserId: string) {
    const account = await getCanonicalUserAccountById(authUserId);

    if (!account) {
      throw new AppError("The authenticated user could not be found.", {
        statusCode: 404,
        code: "user_not_found",
      });
    }

    return account;
  }
}
