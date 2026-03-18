import { NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/admin-auth";
import {
  createUserSessionCookieValue,
  exchangeCodeForKeycloakIdentity,
  userLoginCookieName,
  userSessionCookieName,
} from "@/lib/user-auth";
import { upsertMarketplaceUser } from "@/lib/users-store";

export const dynamic = "force-dynamic";

function buildSignupRedirect(reason: string) {
  const signupUrl = new URL("/signup", getAppBaseUrl());
  signupUrl.searchParams.set("error", reason);

  return signupUrl;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieHeader = request.headers.get("cookie") ?? "";
  const loginToken = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${userLoginCookieName}=`))
    ?.slice(userLoginCookieName.length + 1);

  if (error) {
    const response = NextResponse.redirect(buildSignupRedirect("login_cancelled"));
    response.cookies.set({
      name: userLoginCookieName,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return response;
  }

  if (!code || !state) {
    return NextResponse.redirect(buildSignupRedirect("missing_callback"));
  }

  try {
    const identity = await exchangeCodeForKeycloakIdentity({
      code,
      state,
      loginToken,
    });
    const marketplaceUser = await upsertMarketplaceUser({
      keycloakSub: identity.keycloakSub,
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
      keycloakSub: identity.keycloakSub,
      preferredUsername: identity.preferredUsername,
      email: identity.email,
      name: identity.name,
      expiresAt: identity.expiresAt,
      idTokenHint: identity.idTokenHint,
    });
    const response = NextResponse.redirect(new URL(identity.nextPath, getAppBaseUrl()));

    response.cookies.set({
      name: userSessionCookieName,
      value: sessionCookieValue,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    response.cookies.set({
      name: userLoginCookieName,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch {
    const response = NextResponse.redirect(buildSignupRedirect("callback_failed"));

    response.cookies.set({
      name: userLoginCookieName,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    response.cookies.set({
      name: userSessionCookieName,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return response;
  }
}
