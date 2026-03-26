import { NextResponse } from "next/server";
import {
  getPublicCanonicalProfileById,
  isPublicProfileUserId,
} from "@/lib/canonical-public-profiles";

export const dynamic = "force-dynamic";

type ProfileRouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(_request: Request, context: ProfileRouteContext) {
  const { userId } = await context.params;

  if (!isPublicProfileUserId(userId)) {
    return NextResponse.json({ error: "User id must be a valid UUID." }, { status: 400 });
  }

  const profile = await getPublicCanonicalProfileById(userId, {
    refreshTrustScore: true,
  });

  if (!profile) {
    return NextResponse.json({ error: "Public profile not found." }, { status: 404 });
  }

  return NextResponse.json(
    { profile },
    {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
