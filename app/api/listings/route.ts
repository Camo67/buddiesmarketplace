import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  readBotProtectionFromBody,
  verifyBotProtectedRequest,
} from "@/lib/bot-protection";
import {
  createServiceListing,
  readPublicListings,
  type CreateServiceListingInput,
} from "@/lib/listings-store";
import { getMarketplaceUserById } from "@/lib/users-store";
import { readUserSession, userSessionCookieName } from "@/lib/user-auth";
import { canMarketplaceUserTrade } from "@/lib/user-verification";

export const dynamic = "force-dynamic";

export async function GET() {
  const listings = await readPublicListings();
  return NextResponse.json({ listings });
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userSession = await readUserSession(cookieStore.get(userSessionCookieName)?.value);

    if (!userSession) {
      return NextResponse.json({ error: "Sign in before creating a listing." }, { status: 401 });
    }

    const marketplaceUser = await getMarketplaceUserById(userSession.marketplaceUserId);

    if (!marketplaceUser || !canMarketplaceUserTrade(marketplaceUser.verificationStatus)) {
      return NextResponse.json(
        {
          error:
            "Submit and pass identity verification before creating a listing. Buddies requires reviewed docs for sellers.",
        },
        { status: 403 },
      );
    }

    const body = (await request.json()) as CreateServiceListingInput & {
      type?: string;
      botProtection?: Record<string, unknown>;
    };
    const botProtection = await verifyBotProtectedRequest({
      request,
      action: "create_listing",
      botProtection: readBotProtectionFromBody(body),
    });

    if (!botProtection.ok) {
      return NextResponse.json({ error: botProtection.message }, { status: 400 });
    }

    if (body.type !== "service") {
      return NextResponse.json(
        { error: "Only service listings are supported by this endpoint right now." },
        { status: 400 },
      );
    }

    const listing = await createServiceListing({
      owner: {
        userId: userSession.marketplaceUserId,
        displayName:
          marketplaceUser.displayName ??
          userSession.name ??
          userSession.preferredUsername ??
          userSession.email,
      },
      category: body.category,
      title: body.title,
      tagline: body.tagline,
      description: body.description,
      pricing: body.pricing,
      location: body.location,
      delivery: body.delivery,
      contactLink: body.contactLink,
    });

    return NextResponse.json({ listing }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create listing at this time.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
