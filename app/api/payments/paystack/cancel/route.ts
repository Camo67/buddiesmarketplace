import { NextResponse } from "next/server";
import { markMarketplaceOrderCancelled } from "@/lib/orders-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order")?.trim();
  const reference = url.searchParams.get("reference")?.trim();

  if (reference) {
    await markMarketplaceOrderCancelled(reference, "Checkout cancelled by customer.");
  }

  const redirectUrl = new URL("/payments/cancelled", request.url);

  if (orderId) {
    redirectUrl.searchParams.set("order", orderId);
  }

  return NextResponse.redirect(redirectUrl);
}

