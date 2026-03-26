import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  adminSessionCookieName,
  hasRequiredAdminRole,
  readAdminSession,
} from "@/lib/admin-auth";
import { updateMarketplaceUserVerification } from "@/lib/users-store";
import {
  isVerificationStatus,
  verificationStatusLabels,
} from "@/lib/user-verification";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const cookieStore = await cookies();
    const adminSession = await readAdminSession(cookieStore.get(adminSessionCookieName)?.value);

    if (!hasRequiredAdminRole(adminSession)) {
      return NextResponse.json(
        { error: "Admin sign-in is required before reviewing verification docs." },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = (await request.json()) as {
      status?: string;
      reviewNote?: string;
      reviewedBy?: string;
    };

    if (!body.status || !isVerificationStatus(body.status)) {
      return NextResponse.json({ error: "Choose a valid verification status." }, { status: 400 });
    }

    if (body.status === "unsubmitted") {
      return NextResponse.json(
        { error: `Use ${verificationStatusLabels.changes_requested} instead of resetting to unsubmitted.` },
        { status: 400 },
      );
    }

    const reviewedBy = body.reviewedBy ?? adminSession?.name ?? adminSession?.email ?? "Moderator";
    const user = await updateMarketplaceUserVerification(id, {
      status: body.status,
      reviewNote: body.reviewNote,
      reviewedBy,
    });

    if (!user) {
      return NextResponse.json({ error: "Marketplace user not found." }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update verification status.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
