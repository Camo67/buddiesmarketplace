import { NextResponse } from "next/server";
import {
  getMarketplaceOrderById,
  getMarketplaceOrderByReference,
  markMarketplaceOrderPaymentFailed,
  markMarketplaceOrderPaid,
  recordMarketplacePaymentEvent,
} from "@/lib/orders-store";
import { verifyPaystackTransaction } from "@/lib/paystack";

export const dynamic = "force-dynamic";

function buildRedirect(path: string, params: Record<string, string | undefined>) {
  const url = new URL(path, "http://placeholder.local");

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return `${url.pathname}${url.search}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order")?.trim();
  const reference =
    url.searchParams.get("reference")?.trim() ??
    url.searchParams.get("trxref")?.trim();

  if (!reference) {
    if (orderId) {
      return NextResponse.redirect(
        new URL(buildRedirect("/payments/cancelled", { order: orderId }), request.url),
      );
    }

    return NextResponse.redirect(new URL("/payments/cancelled", request.url));
  }

  const order = await getMarketplaceOrderByReference(reference);

  if (!order) {
    return NextResponse.redirect(new URL("/payments/cancelled", request.url));
  }

  try {
    const transaction = await verifyPaystackTransaction(reference);

    await recordMarketplacePaymentEvent({
      paymentProvider: "paystack",
      eventType: "callback.verify",
      reference,
      payload: transaction,
    });

    if (
      transaction.status === "success" &&
      transaction.amountSubunit === order.amountSubunit &&
      transaction.currency === order.currency
    ) {
      await markMarketplaceOrderPaid({
        reference,
        providerTransactionId: transaction.id,
      });

      return NextResponse.redirect(
        new URL(buildRedirect("/payments/success", { order: order.id }), request.url),
      );
    }

    await markMarketplaceOrderPaymentFailed(
      reference,
      `Verification returned status ${transaction.status}.`,
    );
  } catch (error) {
    await markMarketplaceOrderPaymentFailed(
      reference,
      error instanceof Error ? error.message : "Payment verification failed.",
    );
  }

  const fallbackOrder = orderId ? await getMarketplaceOrderById(orderId) : order;

  return NextResponse.redirect(
    new URL(
      buildRedirect("/payments/cancelled", { order: fallbackOrder?.id ?? order.id }),
      request.url,
    ),
  );
}
