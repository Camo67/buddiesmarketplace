import { NextResponse } from "next/server";
import { buildAuthCookieOptions, getRequestAppBaseUrl } from "@/lib/auth-runtime";
import {
  readBotProtectionFromFormData,
  verifyBotProtectedRequest,
} from "@/lib/bot-protection";
import {
  adminLoginCookieName,
  adminSessionCookieName,
  isAdminProtectionConfigured,
  sanitizeAdminRedirectPath,
  signInAdminUser,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function buildAdminLoginUrl(request: Request, params: Record<string, string>) {
  const url = new URL("/admin/login", request.url);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url;
}

function getFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function mapAdminAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (normalized.includes("missing the required admin access")) {
    return "missing_role";
  }

  if (normalized.includes("invalid login credentials")) {
    return "invalid_credentials";
  }

  if (normalized.includes("email not confirmed")) {
    return "email_not_confirmed";
  }

  if (
    normalized.includes("anti-bot check") ||
    normalized.includes("automated submissions") ||
    normalized.includes("bot protection")
  ) {
    return "bot_protection_failed";
  }

  return "login_failed";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nextPath = sanitizeAdminRedirectPath(url.searchParams.get("next"));
  const loginUrl = buildAdminLoginUrl(request, { next: nextPath });

  return NextResponse.redirect(loginUrl);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const nextPath = sanitizeAdminRedirectPath(url.searchParams.get("next"));

  if (!isAdminProtectionConfigured()) {
    return NextResponse.redirect(
      buildAdminLoginUrl(request, { configured: "0", next: nextPath }),
    );
  }

  const formData = await request.formData();
  const botProtection = await verifyBotProtectedRequest({
    request,
    action: "admin_login",
    botProtection: readBotProtectionFromFormData(formData),
  });

  if (!botProtection.ok) {
    return NextResponse.redirect(
      buildAdminLoginUrl(request, {
        error: "bot_protection_failed",
        next: nextPath,
      }),
    );
  }

  const email = getFormValue(formData, "email");
  const password = getFormValue(formData, "password");

  if (!email || !password) {
    return NextResponse.redirect(
      buildAdminLoginUrl(request, {
        error: "missing_credentials",
        next: nextPath,
      }),
    );
  }

  const appBaseUrl = getRequestAppBaseUrl(request);

  try {
    const { sessionCookieValue, nextPath: resolvedNextPath } = await signInAdminUser({
      email,
      password,
      nextPath,
    });
    const response = NextResponse.redirect(new URL(resolvedNextPath, appBaseUrl));

    response.cookies.set({
      name: adminSessionCookieName,
      value: sessionCookieValue,
      ...buildAuthCookieOptions(appBaseUrl, 60 * 60 * 8),
    });
    response.cookies.set({
      name: adminLoginCookieName,
      value: "",
      ...buildAuthCookieOptions(appBaseUrl, 0),
    });

    return response;
  } catch (error) {
    return NextResponse.redirect(
      buildAdminLoginUrl(request, {
        error: mapAdminAuthError(error),
        next: nextPath,
      }),
    );
  }
}
