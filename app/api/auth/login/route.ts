import { NextResponse } from "next/server";
import { buildAuthCookieOptions, getRequestAppBaseUrl } from "@/lib/auth-runtime";
import {
  readBotProtectionFromFormData,
  verifyBotProtectedRequest,
} from "@/lib/bot-protection";
import {
  createUserSessionCookieValue,
  signInMarketplaceUser,
  signUpMarketplaceUser,
  sanitizeUserRedirectPath,
  userLoginCookieName,
  userSessionCookieName,
} from "@/lib/user-auth";
import { upsertMarketplaceUser } from "@/lib/users-store";

export const dynamic = "force-dynamic";

function buildSignupUrl(request: Request, params: Record<string, string>) {
  const url = new URL("/signup", request.url);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url;
}

function getFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function mapUserAuthError(error: unknown, mode: "signin" | "register") {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "invalid_credentials";
  }

  if (normalized.includes("email not confirmed")) {
    return "email_not_confirmed";
  }

  if (normalized.includes("user already registered")) {
    return "account_exists";
  }

  if (
    normalized.includes("anti-bot check") ||
    normalized.includes("automated submissions") ||
    normalized.includes("bot protection")
  ) {
    return "bot_protection_failed";
  }

  return mode === "register" ? "sign_up_failed" : "sign_in_failed";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nextPath = sanitizeUserRedirectPath(url.searchParams.get("next"));
  const mode = url.searchParams.get("mode") === "register" ? "register" : "signin";

  return NextResponse.redirect(
    buildSignupUrl(request, {
      next: nextPath,
      mode,
    }),
  );
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const nextPath = sanitizeUserRedirectPath(url.searchParams.get("next"));
  const mode = url.searchParams.get("mode") === "register" ? "register" : "signin";
  let stage: "runtime" | "auth" | "profile" | "session" = "runtime";

  try {
    const appBaseUrl = getRequestAppBaseUrl(request);
    const formData = await request.formData();
    const botProtection = await verifyBotProtectedRequest({
      request,
      action: "account_auth",
      botProtection: readBotProtectionFromFormData(formData),
    });

    if (!botProtection.ok) {
      return NextResponse.redirect(
        buildSignupUrl(request, {
          error: "bot_protection_failed",
          next: nextPath,
          mode,
        }),
        { status: 303 },
      );
    }

    const email = getFormValue(formData, "email");
    const password = getFormValue(formData, "password");
    const displayName = getFormValue(formData, "displayName");

    if (!email || !password) {
      return NextResponse.redirect(
        buildSignupUrl(request, {
          error: "missing_credentials",
          next: nextPath,
          mode,
        }),
        { status: 303 },
      );
    }

    stage = "auth";
    const authResult =
      mode === "register"
        ? await signUpMarketplaceUser({
            email,
            password,
            displayName,
            nextPath,
            appBaseUrl,
          })
        : {
            needsEmailConfirmation: false as const,
            identity: await signInMarketplaceUser({
              email,
              password,
            }),
          };

    if (authResult.needsEmailConfirmation) {
      return NextResponse.redirect(
        buildSignupUrl(request, {
          check_email: "1",
          next: nextPath,
          mode: "signin",
        }),
        { status: 303 },
      );
    }

    const identity = authResult.identity;
    stage = "profile";
    const marketplaceUser = await upsertMarketplaceUser({
      authUserId: identity.authUserId,
      email: identity.email,
      preferredUsername: identity.preferredUsername,
      displayName: identity.name,
      firstName: identity.firstName,
      lastName: identity.lastName,
    });

    if (!marketplaceUser) {
      throw new Error("Could not create or update the marketplace user profile.");
    }

    stage = "session";
    const sessionCookieValue = await createUserSessionCookieValue({
      marketplaceUserId: marketplaceUser.id,
      authUserId: identity.authUserId,
      preferredUsername: identity.preferredUsername,
      email: identity.email,
      name: identity.name,
      expiresAt: identity.expiresAt,
    });
    const response = NextResponse.redirect(new URL(nextPath, appBaseUrl), { status: 303 });

    response.cookies.set({
      name: userSessionCookieName,
      value: sessionCookieValue,
      ...buildAuthCookieOptions(appBaseUrl, 60 * 60 * 8),
    });
    response.cookies.set({
      name: userLoginCookieName,
      value: "",
      ...buildAuthCookieOptions(appBaseUrl, 0),
    });

    return response;
  } catch (error) {
    // Log only an allowlisted category and generated ID, never provider payloads or PII.
    const correlationId = crypto.randomUUID();
    console.error("marketplace_auth_failed", { stage, correlationId });
    const errorCode = stage === "auth"
      ? mapUserAuthError(error, mode)
      : stage === "profile"
        ? "profile_failed"
        : stage === "session"
          ? "session_failed"
          : "auth_unavailable";
    return NextResponse.redirect(
      buildSignupUrl(request, {
        error: errorCode,
        next: nextPath,
        mode,
      }),
      { status: 303 },
    );
  }
}
