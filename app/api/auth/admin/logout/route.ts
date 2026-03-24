import { NextResponse } from "next/server";
import { buildAuthCookieOptions, getRequestAppBaseUrl } from "@/lib/auth-runtime";
import {
  adminLoginCookieName,
  adminSessionCookieName,
  sanitizeAdminRedirectPath,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const appBaseUrl = getRequestAppBaseUrl(request);
  const nextPath = sanitizeAdminRedirectPath(
    url.searchParams.get("next") ?? "/admin/login?logged_out=1",
  );
  const response = NextResponse.redirect(new URL(nextPath, appBaseUrl));

  response.cookies.set({
    name: adminLoginCookieName,
    value: "",
    ...buildAuthCookieOptions(appBaseUrl, 0),
  });
  response.cookies.set({
    name: adminSessionCookieName,
    value: "",
    ...buildAuthCookieOptions(appBaseUrl, 0),
  });

  return response;
}
