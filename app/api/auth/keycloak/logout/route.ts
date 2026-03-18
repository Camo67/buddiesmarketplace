import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  adminLoginCookieName,
  adminSessionCookieName,
  createKeycloakLogoutUrl,
  getAppBaseUrl,
  readAdminSession,
  sanitizeAdminRedirectPath,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nextPath = sanitizeAdminRedirectPath(
    url.searchParams.get("next") ?? "/admin/login?logged_out=1",
  );
  const cookieStore = await cookies();
  const adminSession = await readAdminSession(cookieStore.get(adminSessionCookieName)?.value);
  const redirectTarget = await createKeycloakLogoutUrl({
    nextPath,
    idTokenHint: adminSession?.idTokenHint ?? null,
  }).catch(() => new URL(nextPath, getAppBaseUrl()).toString());
  const response = NextResponse.redirect(redirectTarget);

  response.cookies.set({
    name: adminLoginCookieName,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set({
    name: adminSessionCookieName,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
