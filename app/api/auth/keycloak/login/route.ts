import { NextResponse } from "next/server";
import {
  adminLoginCookieName,
  createKeycloakLoginRequest,
  isAdminProtectionConfigured,
  sanitizeAdminRedirectPath,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminProtectionConfigured()) {
    return NextResponse.redirect(new URL("/admin/login?configured=0", request.url));
  }

  const url = new URL(request.url);
  const nextPath = sanitizeAdminRedirectPath(url.searchParams.get("next"));

  try {
    const { authorizationUrl, loginToken } = await createKeycloakLoginRequest(nextPath);
    const response = NextResponse.redirect(authorizationUrl);

    response.cookies.set({
      name: adminLoginCookieName,
      value: loginToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

    return response;
  } catch {
    const fallbackUrl = new URL("/admin/login", request.url);
    fallbackUrl.searchParams.set("error", "auth_unavailable");

    return NextResponse.redirect(fallbackUrl);
  }
}
