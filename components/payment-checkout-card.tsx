"use client";

import { useState } from "react";
import Link from "next/link";

type PaymentCheckoutCardProps = {
  listingId: string;
  listingHref: string;
  listingTitle: string;
  formattedListingAmount: string;
  formattedFeeAmount: string;
  formattedBuyerTotal: string;
  isSignedIn: boolean;
};

export function PaymentCheckoutCard({
  listingId,
  listingHref,
  listingTitle,
  formattedListingAmount,
  formattedFeeAmount,
  formattedBuyerTotal,
  isSignedIn,
}: PaymentCheckoutCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ listingId }),
      });

      const data = (await response.json()) as {
        authorizationUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.authorizationUrl) {
        setError(data.error ?? "Could not start checkout right now.");
        return;
      }

      window.location.assign(data.authorizationUrl);
    } catch {
      setError("Could not reach secure checkout right now.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="soft-card rounded-[2rem] p-6">
      <p className="section-kicker">Secure Checkout</p>
      <h3 className="mt-3 font-serif text-3xl leading-tight">{formattedBuyerTotal}</h3>
      <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
        This fixed-price listing can be paid securely through Buddies checkout.
      </p>
      <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
        Payment is started for {listingTitle} and verified on the server before we mark it paid.
      </p>
      <div className="mt-4 rounded-[1.3rem] border border-[var(--line)] bg-white/75 px-4 py-4 text-sm leading-7 text-[var(--ink-soft)]">
        <p>
          <span className="font-semibold text-[var(--foreground)]">Listing price:</span>{" "}
          {formattedListingAmount}
        </p>
        <p>
          <span className="font-semibold text-[var(--foreground)]">Buddies admin fee:</span>{" "}
          {formattedFeeAmount}
        </p>
        <p>
          <span className="font-semibold text-[var(--foreground)]">Buyer total:</span>{" "}
          {formattedBuyerTotal}
        </p>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        {isSignedIn ? (
          <button
            type="button"
            onClick={handleCheckout}
            disabled={isLoading}
            className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Redirecting..." : "Pay Securely"}
          </button>
        ) : (
          <Link
            href={`/signup?next=${encodeURIComponent(listingHref)}`}
            className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-bold text-white"
          >
            Sign in to pay
          </Link>
        )}
        <span className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-3 text-sm font-medium text-[var(--foreground)]">
          R5 + 0.5% over R500
        </span>
      </div>
      {error ? (
        <div className="mt-4 rounded-[1.3rem] border border-[rgba(242,140,40,0.2)] bg-[rgba(242,140,40,0.08)] px-4 py-3 text-sm text-[var(--foreground)]">
          {error}
        </div>
      ) : null}
    </div>
  );
}
