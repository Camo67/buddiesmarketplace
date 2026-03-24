import { NextResponse } from "next/server";
import {
  getMarketplaceOrderByReference,
  markMarketplaceOrderPaymentFailed,
  markMarketplaceOrderPaid,
  recordMarketplacePaymentEvent,
} from "@/lib/orders-store";
import { verifyPaystackWebhookSignature } from "@/lib/paystack";

export const dynamic = "force-dynamic";

type PaystackWebhookEvent = {
  event?: string;
  data?: {
    id?: number | string;
    reference?: string;
    status?: string;
    amount?: number;
    currency?: string;
    paid_at?: string | null;
  };
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let event: PaystackWebhookEvent;

  try {
    event = JSON.parse(rawBody) as PaystackWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  const reference = event.data?.reference?.trim() || null;

  await recordMarketplacePaymentEvent({
    paymentProvider: "paystack",
    eventType: event.event ?? "unknown",
    reference,
    payload: event,
  });

  if (reference && event.event === "charge.success" && event.data?.id != null) {
    const order = await getMarketplaceOrderByReference(reference);

    if (
      order &&
      event.data.amount === order.amountSubunit &&
      event.data.currency === order.currency
    ) {
      await markMarketplaceOrderPaid({
        reference,
        providerTransactionId: String(event.data.id),
      });
    } else {
      await markMarketplaceOrderPaymentFailed(
        reference,
        "Webhook amount or currency did not match the expected order.",
      );
    }
  }

  if (reference && event.event === "charge.failed") {
    await markMarketplaceOrderPaymentFailed(reference, "Paystack marked the charge as failed.");
  }

  return NextResponse.json({ received: true });
}
