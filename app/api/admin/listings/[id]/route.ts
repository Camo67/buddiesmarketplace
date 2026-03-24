import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  adminSessionCookieName,
  hasRequiredAdminRole,
  isAdminProtectionConfigured,
  readAdminSession,
} from "@/lib/admin-auth";
import {
  updateListingModerationById,
  type UpdateListingModerationInput,
} from "@/lib/listings-store";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    if (!isAdminProtectionConfigured()) {
      return NextResponse.json(
        { error: "Admin review access is not configured. Set the Supabase auth env vars first." },
        { status: 503 },
      );
    }

    const cookieStore = await cookies();
    const session = await readAdminSession(cookieStore.get(adminSessionCookieName)?.value);

    if (!hasRequiredAdminRole(session)) {
      return NextResponse.json({ error: "Admin login required." }, { status: 401 });
    }

    const { id } = await context.params;
    const body = (await request.json()) as UpdateListingModerationInput;
    const listing = await updateListingModerationById(id, body);

    return NextResponse.json({ listing });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update moderation status.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
