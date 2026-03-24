import Link from "next/link";
import { cookies } from "next/headers";
import { AlertTriangle } from "lucide-react";
import { getMarketplaceOrderById } from "@/lib/orders-store";
import { formatCurrencyFromSubunit } from "@/lib/paystack";
import { readUserSession, userSessionCookieName } from "@/lib/user-auth";

type PaymentCancelledPageProps = {
  searchParams: Promise<{
    order?: string;
  }>;
};

export default async function PaymentCancelledPage({
  searchParams,
}: PaymentCancelledPageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const userSession = await readUserSession(cookieStore.get(userSessionCookieName)?.value);
  const order = params.order ? await getMarketplaceOrderById(params.order) : undefined;
  const canViewOrder = Boolean(
    order &&
      userSession &&
      order.buyerUserId === userSession.marketplaceUserId,
  );

  return (
    <main className="pb-16 pt-4">
      <section className="page-shell">
        <div className="glass-panel rounded-[2.4rem] px-5 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-3xl soft-card rounded-[2rem] p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(242,140,40,0.1)] px-4 py-2 text-sm font-semibold text-[#b96a1e]">
              <AlertTriangle size={16} />
              Checkout not completed
            </div>
            <h1 className="mt-4 font-serif text-4xl leading-none md:text-5xl">
              Payment was cancelled or not confirmed.
            </h1>
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
              No paid order was confirmed yet. You can return to the listing and try again when
              ready.
            </p>

            {canViewOrder && order ? (
              <div className="mt-6 rounded-[1.6rem] border border-[var(--line)] bg-white/75 p-5 text-sm leading-7 text-[var(--ink-soft)]">
                <p>
                  <span className="font-semibold text-[var(--foreground)]">Listing:</span>{" "}
                  {order.listingTitle}
                </p>
                <p>
                  <span className="font-semibold text-[var(--foreground)]">Reference:</span>{" "}
                  {order.reference}
                </p>
                <p>
                  <span className="font-semibold text-[var(--foreground)]">Buyer total:</span>{" "}
                  {formatCurrencyFromSubunit(order.amountSubunit, order.currency)}
                </p>
                <p>
                  <span className="font-semibold text-[var(--foreground)]">Status:</span>{" "}
                  {order.status}
                </p>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={canViewOrder && order ? `/listings/${order.listingSlug}` : "/listings"}
                className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-bold text-white"
              >
                Return to listing
              </Link>
              <Link
                href="/listings"
                className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold"
              >
                Browse other listings
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
