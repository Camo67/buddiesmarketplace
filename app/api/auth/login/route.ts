import { NextResponse } from "next/server";
import {
  createUserLoginRequest,
  sanitizeUserRedirectPath,
  userLoginCookieName,
} from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nextPath = sanitizeUserRedirectPath(url.searchParams.get("next"));
  const mode = url.searchParams.get("mode");

  try {
    const { authorizationUrl, loginToken } = await createUserLoginRequest({
      nextPath,
      prompt: mode === "register" ? "create" : undefined,
    });
    const response = NextResponse.redirect(authorizationUrl);

    response.cookies.set({
      name: userLoginCookieName,
      value: loginToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

    return response;
  } catch {
    const fallbackUrl = new URL("/signup", request.url);
    fallbackUrl.searchParams.set("error", "auth_unavailable");
    fallbackUrl.searchParams.set("next", nextPath);

    return NextResponse.redirect(fallbackUrl);
  }
}
