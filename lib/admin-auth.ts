import {
  SignJWT,
  base64url,
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
} from "jose";

export const adminSessionCookieName = "buddies_admin_session";
export const adminLoginCookieName = "buddies_admin_login";

const sessionIssuer = "buddies-worldwide";
const sessionAudience = "buddies-admin";
const maxAdminSessionDurationSeconds = 60 * 60 * 8;

type DiscoveryDocument = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  end_session_endpoint?: string;
};

type LoginChallengePayload = JWTPayload & {
  type: "admin-login";
  state: string;
  nonce: string;
  codeVerifier: string;
  nextPath: string;
};

type AdminSessionPayload = JWTPayload & {
  type: "admin-session";
  roles: string[];
  preferredUsername?: string;
  email?: string;
  name?: string;
  idTokenHint?: string;
};

export type AdminSession = {
  sub: string;
  roles: string[];
  preferredUsername: string | null;
  email: string | null;
  name: string | null;
  expiresAt: number;
  idTokenHint: string | null;
};

let discoveryPromise: Promise<DiscoveryDocument> | null = null;
let jwksSetPromise: Promise<ReturnType<typeof createRemoteJWKSet>> | null = null;

function stringValue(value: unknown) {
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
  return stringValue(process.env.APP_BASE_URL) ?? "http://localhost:3000";
}

export function getKeycloakBaseUrl() {
  return (stringValue(process.env.KEYCLOAK_BASE_URL) ?? "http://localhost:8080").replace(/\/$/, "");
}

export function getKeycloakRealm() {
  return stringValue(process.env.KEYCLOAK_REALM) ?? "buddies";
}

export function getKeycloakIssuer() {
  return `${getKeycloakBaseUrl()}/realms/${getKeycloakRealm()}`;
}

export function getKeycloakClientId() {
  return stringValue(process.env.KEYCLOAK_CLIENT_ID) ?? "buddies-web";
}

function getKeycloakClientSecret() {
  const secret = stringValue(process.env.KEYCLOAK_CLIENT_SECRET);

  if (!secret) {
    throw new Error("Missing KEYCLOAK_CLIENT_SECRET for admin login.");
  }

  return secret;
}

export function getKeycloakAdminRole() {
  return stringValue(process.env.KEYCLOAK_ADMIN_ROLE) ?? "buddies-admin";
}

export function isAdminProtectionConfigured() {
  return Boolean(stringValue(process.env.APP_SESSION_SECRET) && stringValue(process.env.KEYCLOAK_CLIENT_SECRET));
}

export function sanitizeAdminRedirectPath(path: string | null | undefined) {
  if (!path || !path.startsWith("/admin") || path.startsWith("//")) {
    return "/admin/reviews";
  }

  return path;
}

function buildAppUrl(path: string) {
  return new URL(path, getAppBaseUrl()).toString();
}

function getKeycloakCallbackUrl() {
  return buildAppUrl("/api/auth/keycloak/callback");
}

function createRandomValue(size = 32) {
  return base64url.encode(crypto.getRandomValues(new Uint8Array(size)));
}

async function createCodeChallenge(codeVerifier: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier),
  );

  return base64url.encode(new Uint8Array(digest));
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

function extractRoles(payload: JWTPayload) {
  const roles = new Set<string>();
  const realmRoles = (payload.realm_access as { roles?: unknown } | undefined)?.roles;
  const resourceRoles = (payload.resource_access as Record<string, { roles?: unknown }> | undefined)?.[
    getKeycloakClientId()
  ]?.roles;

  for (const role of readStringArray(realmRoles)) {
    roles.add(role);
  }

  for (const role of readStringArray(resourceRoles)) {
    roles.add(role);
  }

  return [...roles];
}

async function getDiscoveryDocument() {
  if (!discoveryPromise) {
    discoveryPromise = (async () => {
      const response = await fetch(`${getKeycloakIssuer()}/.well-known/openid-configuration`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not load the Keycloak discovery document.");
      }

      return (await response.json()) as DiscoveryDocument;
    })();
  }

  try {
    return await discoveryPromise;
  } catch (error) {
    discoveryPromise = null;
    throw error;
  }
}

async function getJwksSet() {
  if (!jwksSetPromise) {
    jwksSetPromise = (async () => {
      const discovery = await getDiscoveryDocument();
      return createRemoteJWKSet(new URL(discovery.jwks_uri));
    })();
  }

  try {
    return await jwksSetPromise;
  } catch (error) {
    jwksSetPromise = null;
    throw error;
  }
}

export async function createKeycloakLogoutUrl(input: {
  nextPath: string;
  idTokenHint?: string | null;
}) {
  const discovery = await getDiscoveryDocument();
  const logoutUrl = new URL(
    discovery.end_session_endpoint ??
      `${getKeycloakIssuer()}/protocol/openid-connect/logout`,
  );

  logoutUrl.searchParams.set(
    "post_logout_redirect_uri",
    buildAppUrl(input.nextPath),
  );
  logoutUrl.searchParams.set("client_id", getKeycloakClientId());

  const idTokenHint = stringValue(input.idTokenHint);

  if (idTokenHint) {
    logoutUrl.searchParams.set("id_token_hint", idTokenHint);
  }

  return logoutUrl.toString();
}

export async function createKeycloakLoginRequest(nextPath: string) {
  const challenge = {
    state: createRandomValue(24),
    nonce: createRandomValue(24),
    codeVerifier: createRandomValue(48),
    nextPath: sanitizeAdminRedirectPath(nextPath),
  };
  const discovery = await getDiscoveryDocument();
  const codeChallenge = await createCodeChallenge(challenge.codeVerifier);
  const url = new URL(discovery.authorization_endpoint);

  url.searchParams.set("client_id", getKeycloakClientId());
  url.searchParams.set("redirect_uri", getKeycloakCallbackUrl());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("state", challenge.state);
  url.searchParams.set("nonce", challenge.nonce);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  const loginToken = await signInternalToken(
    {
      type: "admin-login",
      state: challenge.state,
      nonce: challenge.nonce,
      codeVerifier: challenge.codeVerifier,
      nextPath: challenge.nextPath,
    } satisfies LoginChallengePayload,
    "10m",
  );

  return {
    authorizationUrl: url.toString(),
    loginToken,
  };
}

async function readLoginChallenge(token: string | null | undefined) {
  const payload = await verifyInternalToken(token);

  if (
    !payload ||
    payload.type !== "admin-login" ||
    typeof payload.state !== "string" ||
    typeof payload.nonce !== "string" ||
    typeof payload.codeVerifier !== "string" ||
    typeof payload.nextPath !== "string"
  ) {
    return null;
  }

  return payload as LoginChallengePayload;
}

export async function exchangeKeycloakCodeForAdminSession(input: {
  code: string;
  state: string;
  loginToken: string | null | undefined;
}) {
  const challenge = await readLoginChallenge(input.loginToken);

  if (!challenge || challenge.state !== input.state) {
    throw new Error("The admin login attempt could not be verified.");
  }

  const discovery = await getDiscoveryDocument();
  const tokenResponse = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: getKeycloakClientId(),
      client_secret: getKeycloakClientSecret(),
      code: input.code,
      redirect_uri: getKeycloakCallbackUrl(),
      code_verifier: challenge.codeVerifier,
    }),
    cache: "no-store",
  });

  const tokenResult = (await tokenResponse.json()) as {
    access_token?: string;
    id_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!tokenResponse.ok || !tokenResult.access_token || !tokenResult.id_token) {
    throw new Error(
      tokenResult.error_description ??
        tokenResult.error ??
        "Keycloak rejected the admin login callback.",
    );
  }

  const jwksSet = await getJwksSet();
  const { payload: idTokenPayload } = await jwtVerify(tokenResult.id_token, jwksSet, {
    issuer: discovery.issuer,
    audience: getKeycloakClientId(),
  });

  if (idTokenPayload.nonce !== challenge.nonce) {
    throw new Error("The admin login nonce did not match the Keycloak callback.");
  }

  const { payload: accessTokenPayload } = await jwtVerify(tokenResult.access_token, jwksSet, {
    issuer: discovery.issuer,
  });
  const roles = extractRoles(accessTokenPayload);

  if (!roles.includes(getKeycloakAdminRole())) {
    throw new Error("This Keycloak account is missing the required admin role.");
  }

  const sub = stringValue(idTokenPayload.sub) ?? stringValue(accessTokenPayload.sub);

  if (!sub) {
    throw new Error("Keycloak did not return a usable subject identifier.");
  }

  const expiresAt =
    typeof accessTokenPayload.exp === "number"
      ? accessTokenPayload.exp
      : Math.floor(Date.now() / 1000) + (tokenResult.expires_in ?? 3600);
  const session: AdminSession = {
    sub,
    roles,
    preferredUsername:
      stringValue(idTokenPayload.preferred_username) ??
      stringValue(accessTokenPayload.preferred_username),
    email: stringValue(idTokenPayload.email) ?? stringValue(accessTokenPayload.email),
    name: stringValue(idTokenPayload.name) ?? stringValue(accessTokenPayload.name),
    expiresAt,
    idTokenHint: tokenResult.id_token,
  };
  const sessionCookieValue = await signInternalToken(
    {
      type: "admin-session",
      sub: session.sub,
      roles: session.roles,
      preferredUsername: session.preferredUsername ?? undefined,
      email: session.email ?? undefined,
      name: session.name ?? undefined,
      idTokenHint: session.idTokenHint ?? undefined,
    } satisfies AdminSessionPayload,
    Math.min(session.expiresAt, Math.floor(Date.now() / 1000) + maxAdminSessionDurationSeconds),
  );

  return {
    session,
    sessionCookieValue,
    nextPath: challenge.nextPath,
  };
}

export async function readAdminSession(token: string | null | undefined) {
  const payload = await verifyInternalToken(token);

  if (
    !payload ||
    payload.type !== "admin-session" ||
    typeof payload.sub !== "string" ||
    typeof payload.exp !== "number"
  ) {
    return null;
  }

  return {
    sub: payload.sub,
    roles: readStringArray(payload.roles),
    preferredUsername: stringValue(payload.preferredUsername),
    email: stringValue(payload.email),
    name: stringValue(payload.name),
    expiresAt: payload.exp,
    idTokenHint: stringValue(payload.idTokenHint),
  } satisfies AdminSession;
}

export function hasRequiredAdminRole(session: AdminSession | null | undefined) {
  return Boolean(session && session.roles.includes(getKeycloakAdminRole()));
}
