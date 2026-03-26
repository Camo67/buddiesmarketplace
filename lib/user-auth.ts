import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { getConfiguredAppBaseUrl } from "./auth-runtime";
import { createSupabaseAuthClient, getSupabaseUserIdentity } from "./supabase-auth";

export const userSessionCookieName = "buddies_user_session";
export const userLoginCookieName = "buddies_user_login";

const sessionIssuer = "buddies-worldwide";
const sessionAudience = "buddies-user";

type UserSessionPayload = JWTPayload & {
  type: "user-session";
  marketplaceUserId: string;
  authUserId: string;
  preferredUsername?: string;
  email?: string;
  name?: string;
};

export type UserSession = {
  marketplaceUserId: string;
  authUserId: string;
  preferredUsername: string | null;
  email: string | null;
  name: string | null;
  expiresAt: number;
};

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getSessionSecret() {
  const secret = stringValue(process.env.APP_SESSION_SECRET);

  if (!secret) {
    throw new Error("Missing APP_SESSION_SECRET for user sessions.");
  }

  return new TextEncoder().encode(secret);
}

async function signInternalToken(payload: JWTPayload, expirationTime: string | number) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(sessionIssuer)
    .setAudience(sessionAudience)
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(getSessionSecret());
}

async function verifyInternalToken(token: string | null | undefined) {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      issuer: sessionIssuer,
      audience: sessionAudience,
    });

    return payload;
  } catch {
    return null;
  }
}

export function sanitizeUserRedirectPath(path: string | null | undefined) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/listings";
  }

  if (path.startsWith("/api/")) {
    return "/listings";
  }

  return path;
}

function getDisplayNameParts(value: string | null | undefined) {
  const normalized = stringValue(value);

  if (!normalized) {
    return {
      firstName: null,
      lastName: null,
    };
  }

  const [firstName, ...rest] = normalized.split(/\s+/);
  return {
    firstName: firstName || null,
    lastName: rest.join(" ") || null,
  };
}

function getExpiresAt(expiresAt: number | null | undefined) {
  return expiresAt ?? Math.floor(Date.now() / 1000) + 60 * 60 * 8;
}

function buildSignupConfirmationUrl(nextPath: string, appBaseUrl?: string) {
  const url = new URL("/signup", appBaseUrl ?? getConfiguredAppBaseUrl());
  url.searchParams.set("confirmed", "1");
  url.searchParams.set("next", nextPath);

  return url.toString();
}

export async function signInMarketplaceUser(input: {
  email: string;
  password: string;
}) {
  const client = createSupabaseAuthClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error || !data.user) {
    throw error ?? new Error("Supabase did not return a user for sign-in.");
  }

  if (!stringValue(data.user.email_confirmed_at)) {
    throw new Error("Email not confirmed");
  }

  const identity = getSupabaseUserIdentity(data.user);

  return {
    ...identity,
    expiresAt: getExpiresAt(data.session?.expires_at),
  };
}

export async function signUpMarketplaceUser(input: {
  email: string;
  password: string;
  displayName?: string | null;
  nextPath: string;
  appBaseUrl?: string;
}) {
  const client = createSupabaseAuthClient();
  const names = getDisplayNameParts(input.displayName);
  const { data, error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: buildSignupConfirmationUrl(input.nextPath, input.appBaseUrl),
      data: {
        display_name: stringValue(input.displayName) ?? undefined,
        first_name: names.firstName ?? undefined,
        last_name: names.lastName ?? undefined,
      },
    },
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("Supabase did not return a user for sign-up.");
  }

  const identity = getSupabaseUserIdentity(data.user);

  if (!data.session) {
    return {
      needsEmailConfirmation: true as const,
      email: data.user.email ?? input.email,
      identity,
    };
  }

  return {
    needsEmailConfirmation: false as const,
    email: data.user.email ?? input.email,
    identity: {
      ...identity,
      expiresAt: getExpiresAt(data.session.expires_at),
    },
  };
}

export async function createUserSessionCookieValue(input: {
  marketplaceUserId: string;
  authUserId: string;
  preferredUsername?: string | null;
  email?: string | null;
  name?: string | null;
  expiresAt: number;
}) {
  return signInternalToken(
    {
      type: "user-session",
      marketplaceUserId: input.marketplaceUserId,
      authUserId: input.authUserId,
      preferredUsername: input.preferredUsername ?? undefined,
      email: input.email ?? undefined,
      name: input.name ?? undefined,
    } satisfies UserSessionPayload,
    input.expiresAt,
  );
}

export async function readUserSession(token: string | null | undefined) {
  const payload = await verifyInternalToken(token);

  if (
    !payload ||
    payload.type !== "user-session" ||
    typeof payload.marketplaceUserId !== "string" ||
    typeof payload.authUserId !== "string" ||
    typeof payload.exp !== "number"
  ) {
    return null;
  }

  return {
    marketplaceUserId: payload.marketplaceUserId,
    authUserId: payload.authUserId,
    preferredUsername: stringValue(payload.preferredUsername),
    email: stringValue(payload.email),
    name: stringValue(payload.name),
    expiresAt: payload.exp,
  } satisfies UserSession;
}
