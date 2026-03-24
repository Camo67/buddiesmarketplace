import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import {
  getConfiguredAppBaseUrl,
} from "@/lib/auth-runtime";
import {
  createSupabaseAuthClient,
  getSupabaseAdminRole,
  getSupabaseUserIdentity,
  getSupabaseUserRoles,
  hasSupabaseAdminAccess,
  isSupabaseAuthConfigured,
} from "@/lib/supabase-auth";

export const adminSessionCookieName = "buddies_admin_session";
export const adminLoginCookieName = "buddies_admin_login";

const sessionIssuer = "buddies-worldwide";
const sessionAudience = "buddies-admin";
const maxAdminSessionDurationSeconds = 60 * 60 * 8;

type AdminSessionPayload = JWTPayload & {
  type: "admin-session";
  roles: string[];
  preferredUsername?: string;
  email?: string;
  name?: string;
};

export type AdminSession = {
  authUserId: string;
  roles: string[];
  preferredUsername: string | null;
  email: string | null;
  name: string | null;
  expiresAt: number;
};

export function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getSessionSecret() {
  const secret = stringValue(process.env.APP_SESSION_SECRET);

  if (!secret) {
    throw new Error("Missing APP_SESSION_SECRET for admin sessions.");
  }

  return new TextEncoder().encode(secret);
}

export function getAppBaseUrl() {
  return getConfiguredAppBaseUrl();
}

export function isAdminProtectionConfigured() {
  return isSupabaseAuthConfigured();
}

export function sanitizeAdminRedirectPath(path: string | null | undefined) {
  if (!path || !path.startsWith("/admin") || path.startsWith("//")) {
    return "/admin/reviews";
  }

  return path;
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

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function getExpiresAt(expiresAt: number | null | undefined) {
  return expiresAt ?? Math.floor(Date.now() / 1000) + maxAdminSessionDurationSeconds;
}

export async function signInAdminUser(input: {
  email: string;
  password: string;
  nextPath: string;
}) {
  const client = createSupabaseAuthClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error || !data.user) {
    throw error ?? new Error("Supabase did not return a user for admin sign-in.");
  }

  if (!hasSupabaseAdminAccess(data.user)) {
    throw new Error("This Supabase account is missing the required admin access.");
  }

  const identity = getSupabaseUserIdentity(data.user);
  const roles = getSupabaseUserRoles(data.user);
  const expiresAt = getExpiresAt(data.session?.expires_at);
  const session: AdminSession = {
    authUserId: identity.authUserId,
    roles,
    preferredUsername: identity.preferredUsername,
    email: identity.email,
    name: identity.name,
    expiresAt,
  };
  const sessionCookieValue = await signInternalToken(
    {
      type: "admin-session",
      authUserId: session.authUserId,
      roles: session.roles,
      preferredUsername: session.preferredUsername ?? undefined,
      email: session.email ?? undefined,
      name: session.name ?? undefined,
    } satisfies AdminSessionPayload,
    Math.min(session.expiresAt, getExpiresAt(null)),
  );

  return {
    session,
    sessionCookieValue,
    nextPath: sanitizeAdminRedirectPath(input.nextPath),
  };
}

export async function readAdminSession(token: string | null | undefined) {
  const payload = await verifyInternalToken(token);

  if (
    !payload ||
    payload.type !== "admin-session" ||
    typeof payload.authUserId !== "string" ||
    typeof payload.exp !== "number"
  ) {
    return null;
  }

  return {
    authUserId: payload.authUserId,
    roles: readStringArray(payload.roles),
    preferredUsername: stringValue(payload.preferredUsername),
    email: stringValue(payload.email),
    name: stringValue(payload.name),
    expiresAt: payload.exp,
  } satisfies AdminSession;
}

export function hasRequiredAdminRole(session: AdminSession | null | undefined) {
  return Boolean(session && session.roles.includes(getSupabaseAdminRole()));
}
