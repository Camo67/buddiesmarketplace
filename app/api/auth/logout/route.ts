import { NextResponse } from "next/server";
import { buildAuthCookieOptions, getRequestAppBaseUrl } from "@/lib/auth-runtime";
import {
  sanitizeUserRedirectPath,
  userLoginCookieName,
  userSessionCookieName,
} from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nextPath = sanitizeUserRedirectPath(url.searchParams.get("next")) || "/";
  const appBaseUrl = getRequestAppBaseUrl(request);
  const response = NextResponse.redirect(new URL(nextPath, appBaseUrl));

  response.cookies.set({
    name: userLoginCookieName,
    value: "",
    ...buildAuthCookieOptions(appBaseUrl, 0),
  });
  response.cookies.set({
    name: userSessionCookieName,
    value: "",
    ...buildAuthCookieOptions(appBaseUrl, 0),
  });

  return response;
}
