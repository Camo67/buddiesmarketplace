import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  adminSessionCookieName,
  hasRequiredAdminRole,
  isAdminProtectionConfigured,
  readAdminSession,
} from "@/lib/admin-auth";

function isLoginRoute(pathname: string) {
  return pathname === "/admin/login";
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isLoginRoute(pathname)) {
    return NextResponse.next();
  }

  if (!isAdminProtectionConfigured()) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json(
        { error: "Admin review access is not configured. Set Keycloak admin auth env vars first." },
        { status: 503 },
      );
    }

    return NextResponse.redirect(new URL("/admin/login?configured=0", request.url));
  }

  const sessionValue = request.cookies.get(adminSessionCookieName)?.value;
  const session = await readAdminSession(sessionValue);
  const hasAccess = hasRequiredAdminRole(session);

  if (hasAccess) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
