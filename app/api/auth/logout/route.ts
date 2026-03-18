import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createKeycloakLogoutUrl, getAppBaseUrl } from "@/lib/admin-auth";
import {
  readUserSession,
  sanitizeUserRedirectPath,
  userLoginCookieName,
  userSessionCookieName,
} from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nextPath = sanitizeUserRedirectPath(url.searchParams.get("next")) || "/";
  const cookieStore = await cookies();
  const userSession = await readUserSession(cookieStore.get(userSessionCookieName)?.value);
  const redirectTarget = await createKeycloakLogoutUrl({
    nextPath,
    idTokenHint: userSession?.idTokenHint ?? null,
  }).catch(() => new URL(nextPath, getAppBaseUrl()).toString());
  const response = NextResponse.redirect(redirectTarget);

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
