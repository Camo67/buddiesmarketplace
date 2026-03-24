function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeOrigin(value: string, name: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a fully-qualified URL including http:// or https://.`);
  }

  return url.origin;
}

function normalizeOriginList(value: string | null, name: string) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => normalizeOrigin(entry, name));
}

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function getOriginHost(origin: string) {
  return new URL(origin).host;
}

function getForwardedRequestOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const forwardedHost =
    firstHeaderValue(request.headers.get("x-forwarded-host")) ??
    firstHeaderValue(request.headers.get("host"));
  const forwardedProto =
    request.headers.get("x-forwarded-proto") ?? requestUrl.protocol.replace(/:$/, "");
  const forwardedPort = request.headers.get("x-forwarded-port");

  if (forwardedHost) {
    const host =
      forwardedPort &&
      !forwardedHost.includes(":") &&
      !["80", "443"].includes(forwardedPort)
        ? `${forwardedHost}:${forwardedPort}`
        : forwardedHost;

    return `${forwardedProto}://${host}`;
  }

  return null;
}

function getCandidateRequestHosts(request: Request | URL) {
  const requestUrl = request instanceof URL ? request : new URL(request.url);
  const hosts = new Set<string>();

  if (request instanceof Request) {
    const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
    const directHost = firstHeaderValue(request.headers.get("host"));

    if (forwardedHost) {
      hosts.add(forwardedHost);
    }

    if (directHost) {
      hosts.add(directHost);
    }
  }

  if (requestUrl.host) {
    hosts.add(requestUrl.host);
  }

  return [...hosts];
}

export function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

export function getConfiguredAppBaseUrl() {
  const configured = stringValue(process.env.APP_BASE_URL);

  if (configured) {
    return normalizeOrigin(configured, "APP_BASE_URL");
  }

  if (isProductionRuntime()) {
    throw new Error(
      "Missing APP_BASE_URL in production. Set APP_BASE_URL or use a request-aware route helper.",
    );
  }

  return "http://localhost:3000";
}

export function getRequestAppBaseUrl(request: Request | URL) {
  const configured = stringValue(process.env.APP_BASE_URL);
  const requestUrlOrigin = request instanceof URL ? request.origin : new URL(request.url).origin;
  const forwardedOrigin =
    request instanceof URL ? null : getForwardedRequestOrigin(request);

  if (configured) {
    const configuredOrigin = normalizeOrigin(configured, "APP_BASE_URL");
    const configuredAliases = normalizeOriginList(
      stringValue(process.env.APP_BASE_URL_ALIASES),
      "APP_BASE_URL_ALIASES",
    );

    const allowedOrigins = [configuredOrigin, ...configuredAliases];
    const allowedOriginsByHost = new Map(
      allowedOrigins.map((origin) => [getOriginHost(origin), origin]),
    );

    if (allowedOrigins.includes(requestUrlOrigin)) {
      return requestUrlOrigin;
    }

    if (forwardedOrigin && allowedOrigins.includes(forwardedOrigin)) {
      return forwardedOrigin;
    }

    for (const host of getCandidateRequestHosts(request)) {
      const matchedOrigin = allowedOriginsByHost.get(host);

      if (matchedOrigin) {
        return matchedOrigin;
      }
    }

    return configuredOrigin;
  }

  return forwardedOrigin ?? requestUrlOrigin;
}

export function buildAuthCookieOptions(appBaseUrl: string, maxAge: number) {
  const secure = new URL(appBaseUrl).protocol === "https:";

  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge,
  };
}
