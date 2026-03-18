import {
  SignJWT,
  base64url,
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
} from "jose";
import {
  getAppBaseUrl,
  getKeycloakClientId,
  getKeycloakIssuer,
} from "@/lib/admin-auth";

export const userSessionCookieName = "buddies_user_session";
export const userLoginCookieName = "buddies_user_login";

const sessionIssuer = "buddies-worldwide";
const sessionAudience = "buddies-user";

type UserLoginChallengePayload = JWTPayload & {
  type: "user-login";
  state: string;
  nonce: string;
  codeVerifier: string;
  nextPath: string;
  prompt?: string;
};

type UserSessionPayload = JWTPayload & {
  type: "user-session";
  marketplaceUserId: string;
  keycloakSub: string;
  preferredUsername?: string;
  email?: string;
  name?: string;
  idTokenHint?: string;
};

export type UserSession = {
  marketplaceUserId: string;
  keycloakSub: string;
  preferredUsername: string | null;
  email: string | null;
  name: string | null;
  expiresAt: number;
  idTokenHint: string | null;
};

type DiscoveryDocument = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
};

let discoveryPromise: Promise<DiscoveryDocument> | null = null;
let jwksSetPromise: Promise<ReturnType<typeof createRemoteJWKSet>> | null = null;

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

function getKeycloakClientSecret() {
  const secret = stringValue(process.env.KEYCLOAK_CLIENT_SECRET);

  if (!secret) {
    throw new Error("Missing KEYCLOAK_CLIENT_SECRET for user login.");
  }

  return secret;
}

function buildAppUrl(path: string) {
  return new URL(path, getAppBaseUrl()).toString();
}

function getUserCallbackUrl() {
  return buildAppUrl("/api/auth/callback");
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

async function getDiscoveryDocument() {
  if (!discoveryPromise) {
    discoveryPromise = (async () => {
      const response = await fetch(`${getKeycloakIssuer()}/.well-known/openid-configuration`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not load the Keycloak discovery document for user login.");
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

export function sanitizeUserRedirectPath(path: string | null | undefined) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/listings";
  }

  if (path.startsWith("/api/")) {
    return "/listings";
  }

  return path;
}

export async function createUserLoginRequest(options?: {
  nextPath?: string;
  prompt?: "create";
}) {
  const challenge = {
    state: createRandomValue(24),
    nonce: createRandomValue(24),
    codeVerifier: createRandomValue(48),
    nextPath: sanitizeUserRedirectPath(options?.nextPath),
    prompt: options?.prompt,
  };
  const discovery = await getDiscoveryDocument();
  const codeChallenge = await createCodeChallenge(challenge.codeVerifier);
  const url = new URL(discovery.authorization_endpoint);

  url.searchParams.set("client_id", getKeycloakClientId());
  url.searchParams.set("redirect_uri", getUserCallbackUrl());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("state", challenge.state);
  url.searchParams.set("nonce", challenge.nonce);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  if (challenge.prompt) {
    url.searchParams.set("prompt", challenge.prompt);
  }

  const loginToken = await signInternalToken(
    {
      type: "user-login",
      state: challenge.state,
      nonce: challenge.nonce,
      codeVerifier: challenge.codeVerifier,
      nextPath: challenge.nextPath,
      prompt: challenge.prompt,
    } satisfies UserLoginChallengePayload,
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
    payload.type !== "user-login" ||
    typeof payload.state !== "string" ||
    typeof payload.nonce !== "string" ||
    typeof payload.codeVerifier !== "string" ||
    typeof payload.nextPath !== "string"
  ) {
    return null;
  }

  return payload as UserLoginChallengePayload;
}

export async function exchangeCodeForKeycloakIdentity(input: {
  code: string;
  state: string;
  loginToken: string | null | undefined;
}) {
  const challenge = await readLoginChallenge(input.loginToken);

  if (!challenge || challenge.state !== input.state) {
    throw new Error("The marketplace login attempt could not be verified.");
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
      redirect_uri: getUserCallbackUrl(),
      code_verifier: challenge.codeVerifier,
    }),
    cache: "no-store",
  });
  const tokenResult = (await tokenResponse.json()) as {
    id_token?: string;
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!tokenResponse.ok || !tokenResult.id_token || !tokenResult.access_token) {
    throw new Error(
      tokenResult.error_description ??
        tokenResult.error ??
        "Keycloak rejected the marketplace login callback.",
    );
  }

  const jwksSet = await getJwksSet();
  const { payload: claims } = await jwtVerify(tokenResult.id_token, jwksSet, {
    issuer: discovery.issuer,
    audience: getKeycloakClientId(),
  });

  if (claims.nonce !== challenge.nonce) {
    throw new Error("The marketplace login nonce did not match the Keycloak callback.");
  }

  const keycloakSub = stringValue(claims.sub);

  if (!keycloakSub) {
    throw new Error("Keycloak did not return a usable subject identifier.");
  }

  return {
    keycloakSub,
    preferredUsername: stringValue(claims.preferred_username),
    email: stringValue(claims.email),
    name: stringValue(claims.name),
    firstName: stringValue(claims.given_name),
    lastName: stringValue(claims.family_name),
    expiresAt: Math.floor(Date.now() / 1000) + (tokenResult.expires_in ?? 3600),
    nextPath: challenge.nextPath,
    idTokenHint: tokenResult.id_token,
  };
}

export async function createUserSessionCookieValue(input: {
  marketplaceUserId: string;
  keycloakSub: string;
  preferredUsername?: string | null;
  email?: string | null;
  name?: string | null;
  expiresAt: number;
  idTokenHint?: string | null;
}) {
  return signInternalToken(
    {
      type: "user-session",
      marketplaceUserId: input.marketplaceUserId,
      keycloakSub: input.keycloakSub,
      preferredUsername: input.preferredUsername ?? undefined,
      email: input.email ?? undefined,
      name: input.name ?? undefined,
      idTokenHint: input.idTokenHint ?? undefined,
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
    typeof payload.keycloakSub !== "string" ||
    typeof payload.exp !== "number"
  ) {
    return null;
  }

  return {
    marketplaceUserId: payload.marketplaceUserId,
    keycloakSub: payload.keycloakSub,
    preferredUsername: stringValue(payload.preferredUsername),
    email: stringValue(payload.email),
    name: stringValue(payload.name),
    expiresAt: payload.exp,
    idTokenHint: stringValue(payload.idTokenHint),
  } satisfies UserSession;
}
