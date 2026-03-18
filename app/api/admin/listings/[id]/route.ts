import { NextResponse } from "next/server";
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
