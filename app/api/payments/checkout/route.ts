import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getRequestAppBaseUrl } from "@/lib/auth-runtime";
import {
  createMarketplaceOrder,
  createOrderReference,
  updateMarketplaceOrderCheckout,
} from "@/lib/orders-store";
import { initializePaystackTransaction, isPaystackConfigured } from "@/lib/paystack";
import { readUserSession, userSessionCookieName } from "@/lib/user-auth";
import { getListingById } from "@/lib/listings-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!isPaystackConfigured()) {
      return NextResponse.json(
        { error: "Payments are not configured yet." },
        { status: 503 },
      );
    }

    const cookieStore = await cookies();
    const userSession = await readUserSession(cookieStore.get(userSessionCookieName)?.value);

    if (!userSession) {
      return NextResponse.json({ error: "Sign in before starting checkout." }, { status: 401 });
    }

    if (!userSession.email) {
      return NextResponse.json(
        { error: "Your account needs an email address before payment can start." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as {
      listingId?: string;
    };
    const listingId = body.listingId?.trim();

    if (!listingId) {
      return NextResponse.json({ error: "Listing id is required." }, { status: 400 });
    }

    const listing = await getListingById(listingId);

    if (!listing || listing.reviewStatus !== "approved") {
      return NextResponse.json({ error: "Listing is not available for checkout." }, { status: 404 });
    }

    if (listing.ownerUserId && listing.ownerUserId === userSession.marketplaceUserId) {
      return NextResponse.json({ error: "You cannot pay your own listing." }, { status: 400 });
    }

    if (listing.pricingMethod !== "fixed" || !listing.checkoutAmountSubunit || !listing.checkoutCurrency) {
      return NextResponse.json(
        { error: "This listing is not enabled for fixed-price checkout yet." },
        { status: 400 },
      );
    }

    const reference = createOrderReference();
    const order = await createMarketplaceOrder({
      listingId: listing.id,
      buyerUserId: userSession.marketplaceUserId,
      reference,
      amountSubunit: listing.checkoutAmountSubunit,
      currency: listing.checkoutCurrency,
    });

    if (!order) {
      throw new Error("Order could not be created.");
    }

    const appBaseUrl = getRequestAppBaseUrl(request);
    const callbackUrl = new URL(
      `/api/payments/paystack/callback?order=${encodeURIComponent(order.id)}`,
      appBaseUrl,
    ).toString();
    const cancelUrl = new URL(
      `/api/payments/paystack/cancel?order=${encodeURIComponent(order.id)}&reference=${encodeURIComponent(order.reference)}`,
      appBaseUrl,
    ).toString();

    const transaction = await initializePaystackTransaction({
      amountSubunit: order.amountSubunit,
      email: userSession.email,
      reference: order.reference,
      currency: order.currency,
      callbackUrl,
      cancelUrl,
      metadata: {
        orderId: order.id,
        listingId: order.listingId,
        listingSlug: order.listingSlug,
        buyerUserId: order.buyerUserId,
      },
    });

    await updateMarketplaceOrderCheckout(order.id, {
      accessCode: transaction.accessCode,
      authorizationUrl: transaction.authorizationUrl,
    });

    return NextResponse.json(
      {
        authorizationUrl: transaction.authorizationUrl,
        orderId: order.id,
        reference: order.reference,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start secure checkout right now.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
