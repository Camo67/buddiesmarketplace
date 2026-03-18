import { NextResponse } from "next/server";
import {
  adminLoginCookieName,
  adminSessionCookieName,
  exchangeKeycloakCodeForAdminSession,
  getAppBaseUrl,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function buildLoginRedirect(reason: string) {
  const loginUrl = new URL("/admin/login", getAppBaseUrl());
  loginUrl.searchParams.set("error", reason);

  return loginUrl;
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
    .find((part) => part.startsWith(`${adminLoginCookieName}=`))
    ?.slice(adminLoginCookieName.length + 1);

  if (error) {
    const response = NextResponse.redirect(buildLoginRedirect("login_cancelled"));
    response.cookies.set({
      name: adminLoginCookieName,
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
    return NextResponse.redirect(buildLoginRedirect("missing_callback"));
  }

  try {
    const { nextPath, sessionCookieValue } = await exchangeKeycloakCodeForAdminSession({
      code,
      state,
      loginToken,
    });
    const response = NextResponse.redirect(new URL(nextPath, getAppBaseUrl()));

    response.cookies.set({
      name: adminSessionCookieName,
      value: sessionCookieValue,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    response.cookies.set({
      name: adminLoginCookieName,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (callbackError) {
    const reason =
      callbackError instanceof Error &&
      callbackError.message.includes("required admin role")
        ? "missing_role"
        : "callback_failed";
    const response = NextResponse.redirect(buildLoginRedirect(reason));

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
}
