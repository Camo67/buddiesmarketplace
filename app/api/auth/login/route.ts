import { NextResponse } from "next/server";
import { buildAuthCookieOptions, getRequestAppBaseUrl } from "@/lib/auth-runtime";
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
  const appBaseUrl = getRequestAppBaseUrl(request);
  const formData = await request.formData();
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
    );
  }

  try {
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
      );
    }

    const identity = authResult.identity;
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

    const sessionCookieValue = await createUserSessionCookieValue({
      marketplaceUserId: marketplaceUser.id,
      authUserId: identity.authUserId,
      preferredUsername: identity.preferredUsername,
      email: identity.email,
      name: identity.name,
      expiresAt: identity.expiresAt,
    });
    const response = NextResponse.redirect(new URL(nextPath, appBaseUrl));

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
    return NextResponse.redirect(
      buildSignupUrl(request, {
        error: mapUserAuthError(error, mode),
        next: nextPath,
        mode,
      }),
    );
  }
}
