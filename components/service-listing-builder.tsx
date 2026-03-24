"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Shield, Sparkles } from "lucide-react";
import {
  buildDeliveryLabel,
  paxiOfficialLinks,
  paxiServiceWindows,
  type DeliveryMethod,
  type PaxiServiceWindow,
} from "@/lib/paxi";

type CreatedListing = {
  slug: string;
  title: string;
};

const serviceCategories = [
  "Engineering & Design",
  "Repairs & Maintenance",
  "Tutoring & Lessons",
  "Beauty & Wellness",
  "Transport & Delivery",
  "Business Support",
  "Creative Services",
  "Home Services",
  "Events & Entertainment",
  "Other Services",
];

const pricingMethods = ["Fixed", "Hourly", "Custom"] as const;
const deliveryOptions = [
  {
    value: "contact_only" as const,
    label: "Arrange directly",
  },
  {
    value: "local_meetup" as const,
    label: "Local meetup / collection",
  },
  {
    value: "paxi_nationwide" as const,
    label: "Nationwide via PAXI",
  },
] as const;

type PricingMethod = (typeof pricingMethods)[number];

function parseAmountToSubunit(value: string) {
  const normalized = value.replace(/,/g, ".").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed * 100);
}

export function ServiceListingBuilder() {
  const router = useRouter();
  const [category, setCategory] = useState("Engineering & Design");
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [pricingMethod, setPricingMethod] = useState<PricingMethod>("Fixed");
  const [pricingValue, setPricingValue] = useState("");
  const [secureCheckoutEnabled, setSecureCheckoutEnabled] = useState(true);
  const [checkoutAmount, setCheckoutAmount] = useState("");
  const [location, setLocation] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("contact_only");
  const [paxiServiceWindow, setPaxiServiceWindow] = useState<PaxiServiceWindow>("3-5 business days");
  const [contactLink, setContactLink] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [createdListing, setCreatedListing] = useState<CreatedListing | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  const totalFields = deliveryMethod === "paxi_nationwide" ? 9 : 8;
  const completedFields = [
    category,
    title.trim(),
    tagline.trim(),
    description.trim(),
    pricingMethod,
    pricingValue.trim(),
    location.trim(),
    deliveryMethod,
    deliveryMethod === "paxi_nationwide" ? paxiServiceWindow : "not-needed",
    contactLink.trim(),
  ].filter(Boolean).length;

  const checkoutAmountSubunit =
    pricingMethod === "Fixed" && secureCheckoutEnabled
      ? parseAmountToSubunit(checkoutAmount)
      : null;
  const isReady =
    title.trim().length > 0 &&
    tagline.trim().length > 0 &&
    description.trim().length > 0 &&
    pricingValue.trim().length > 0 &&
    (pricingMethod !== "Fixed" || !secureCheckoutEnabled || checkoutAmountSubunit != null) &&
    location.trim().length > 0 &&
    (deliveryMethod !== "paxi_nationwide" || Boolean(paxiServiceWindow)) &&
    contactLink.trim().length > 0;

  const pricingLabel = useMemo(() => {
    if (!pricingValue.trim()) {
      return pricingMethod;
    }

    if (pricingMethod === "Hourly") {
      return `Hourly (${pricingValue})`;
    }

    if (pricingMethod === "Fixed") {
      return `Fixed (${pricingValue})`;
    }

    return `Custom (${pricingValue})`;
  }, [pricingMethod, pricingValue]);

  const deliveryLabel = useMemo(
    () =>
      buildDeliveryLabel(
        deliveryMethod,
        deliveryMethod === "paxi_nationwide" ? paxiServiceWindow : null,
      ),
    [deliveryMethod, paxiServiceWindow],
  );

  const safetyNote =
    deliveryMethod === "paxi_nationwide"
      ? "Safety Note: Confirm payment before dispatch, agree the order clearly, and use PAXI point references in writing."
      : "Safety Note: Meet in a public place for in-person work, confirm payment terms clearly, and use traceable delivery or booking methods where possible.";

  const moderatorNote = "Listing submitted for moderator review before publishing.";

  const apiPayload = {
    type: "service",
    category,
    title,
    tagline,
    description,
    pricing: {
      method: pricingMethod.toLowerCase(),
      label: pricingValue,
      checkoutAmountSubunit,
      currency: checkoutAmountSubunit != null ? "ZAR" : null,
    },
    location,
    delivery: {
      method: deliveryMethod,
      paxiServiceWindow: deliveryMethod === "paxi_nationwide" ? paxiServiceWindow : null,
    },
    contactLink,
    safetyNote,
    reviewStatus: "pending_moderation",
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    setCreatedListing(null);

    if (!isReady) {
      setSubmitError(
        "Please complete all required fields before publishing, including the secure checkout amount if enabled.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiPayload),
      });

      const data = (await response.json()) as {
        error?: string;
        listing?: CreatedListing;
      };

      if (!response.ok || !data.listing) {
        setSubmitError(data.error ?? "Something went wrong while creating the listing.");
        return;
      }

      setCreatedListing(data.listing);
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setSubmitError("Could not reach the listings API. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_420px]">
      <div className="soft-card rounded-[2rem] p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-kicker">Service Listing Builder</p>
            <h2 className="mt-3 font-serif text-4xl leading-none md:text-5xl">
              Create a service listing the Buddies way.
            </h2>
          </div>
          <div className="rounded-full bg-[rgba(46,139,87,0.1)] px-3 py-2 text-sm font-semibold text-[var(--accent-2)]">
            {completedFields}/{totalFields} complete
          </div>
        </div>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">
          For every service listing we collect the category, title, tagline, description, pricing,
          location, delivery method and booking contact, then format it neatly and mark it for
          moderator review.
        </p>

        <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-medium">
            Category of service
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-[1.1rem] border border-[var(--line)] bg-white/85 px-4 py-3 outline-none"
            >
              {serviceCategories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Pricing method
            <select
              value={pricingMethod}
              onChange={(event) => {
                const nextMethod = event.target.value as PricingMethod;
                setPricingMethod(nextMethod);

                if (nextMethod !== "Fixed") {
                  setSecureCheckoutEnabled(false);
                }

                if (nextMethod === "Fixed" && !checkoutAmount.trim()) {
                  setSecureCheckoutEnabled(true);
                }
              }}
              className="rounded-[1.1rem] border border-[var(--line)] bg-white/85 px-4 py-3 outline-none"
            >
              {pricingMethods.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium md:col-span-2">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="rounded-[1.1rem] border border-[var(--line)] bg-white/85 px-4 py-3 outline-none"
              placeholder="Rapid 3D Printing and CAD Design"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium md:col-span-2">
            Short tagline
            <input
              value={tagline}
              onChange={(event) => setTagline(event.target.value)}
              className="rounded-[1.1rem] border border-[var(--line)] bg-white/85 px-4 py-3 outline-none"
              placeholder="Prototypes, custom parts and fast turnaround"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium md:col-span-2">
            Detailed description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-40 rounded-[1.1rem] border border-[var(--line)] bg-white/85 px-4 py-3 outline-none"
              placeholder="I provide custom 3D printing, prototyping and CAD design services using FDM and resin printers..."
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Price label
            <input
              value={pricingValue}
              onChange={(event) => setPricingValue(event.target.value)}
              className="rounded-[1.1rem] border border-[var(--line)] bg-white/85 px-4 py-3 outline-none"
              placeholder="R250/hr or From R500"
            />
          </label>

          {pricingMethod === "Fixed" ? (
            <div className="grid gap-3 rounded-[1.2rem] border border-[rgba(46,139,87,0.16)] bg-[rgba(46,139,87,0.06)] px-4 py-4 text-sm text-[var(--foreground)]">
              <label className="inline-flex items-center gap-3 font-medium">
                <input
                  type="checkbox"
                  checked={secureCheckoutEnabled}
                  onChange={(event) => setSecureCheckoutEnabled(event.target.checked)}
                />
                Enable Buddies secure checkout for this fixed-price listing
              </label>
              {secureCheckoutEnabled ? (
                <label className="grid gap-2 text-sm font-medium">
                  Secure checkout amount (ZAR)
                  <input
                    value={checkoutAmount}
                    onChange={(event) => setCheckoutAmount(event.target.value)}
                    className="rounded-[1.1rem] border border-[var(--line)] bg-white/85 px-4 py-3 outline-none"
                    inputMode="decimal"
                    placeholder="500.00"
                  />
                </label>
              ) : (
                <p className="leading-7 text-[var(--ink-soft)]">
                  Buyers will still see the listing, but payment stays manual through your agreed
                  contact flow.
                </p>
              )}
            </div>
          ) : null}

          <label className="grid gap-2 text-sm font-medium">
            Location or availability
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="rounded-[1.1rem] border border-[var(--line)] bg-white/85 px-4 py-3 outline-none"
              placeholder="Cape Town, ZA or Nationwide remote"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Delivery or fulfilment
            <select
              value={deliveryMethod}
              onChange={(event) => setDeliveryMethod(event.target.value as DeliveryMethod)}
              className="rounded-[1.1rem] border border-[var(--line)] bg-white/85 px-4 py-3 outline-none"
            >
              {deliveryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {deliveryMethod === "paxi_nationwide" ? (
            <label className="grid gap-2 text-sm font-medium">
              PAXI delivery speed
              <select
                value={paxiServiceWindow}
                onChange={(event) =>
                  setPaxiServiceWindow(event.target.value as PaxiServiceWindow)
                }
                className="rounded-[1.1rem] border border-[var(--line)] bg-white/85 px-4 py-3 outline-none"
              >
                {paxiServiceWindows.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {deliveryMethod === "paxi_nationwide" ? (
            <div className="md:col-span-2 rounded-[1.4rem] border border-[rgba(46,139,87,0.16)] bg-[rgba(46,139,87,0.06)] px-4 py-4 text-sm leading-7 text-[var(--ink-soft)]">
              <p className="font-semibold text-[var(--accent-2)]">
                PAXI is now part of the listing flow.
              </p>
              <p className="mt-2">
                Buddies can show PAXI as a nationwide delivery option now, while the exact pickup
                point can be chosen later between buyer and seller.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link href="/paxi/points" className="font-semibold text-[var(--accent)]">
                  View PAXI points
                </Link>
                <Link href="/paxi" className="font-semibold text-[var(--accent)]">
                  Open PAXI tools
                </Link>
                <Link href={paxiOfficialLinks.business} className="font-semibold text-[var(--accent)]">
                  Official business tools
                </Link>
              </div>
            </div>
          ) : null}

          <label className="grid gap-2 text-sm font-medium md:col-span-2">
            Contact or booking link
            <input
              value={contactLink}
              onChange={(event) => setContactLink(event.target.value)}
              className="rounded-[1.1rem] border border-[var(--line)] bg-white/85 px-4 py-3 outline-none"
              placeholder="https://your-portfolio-or-booking-link"
            />
          </label>
          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit listing to API"}
            </button>
            <span className="text-sm text-[var(--ink-soft)]">
              This now posts to `POST /api/listings` and can read PAXI config from `GET /api/paxi`.
            </span>
          </div>
          {submitError ? (
            <div className="md:col-span-2 rounded-[1.4rem] border border-[rgba(242,140,40,0.2)] bg-[rgba(242,140,40,0.08)] px-4 py-3 text-sm text-[var(--foreground)]">
              {submitError}
            </div>
          ) : null}
          {createdListing ? (
            <div className="md:col-span-2 rounded-[1.4rem] border border-[rgba(46,139,87,0.18)] bg-[rgba(46,139,87,0.08)] px-4 py-4 text-sm text-[var(--foreground)]">
              <p className="font-semibold text-[var(--accent-2)]">
                Listing submitted for moderator review.
              </p>
              <p className="mt-2 text-[var(--ink-soft)]">
                {createdListing.title} is now stored successfully. It will stay off the public
                marketplace until a moderator approves it.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  href={`/admin/reviews/${createdListing.slug}`}
                  className="font-semibold text-[var(--accent)]"
                >
                  Open moderator detail
                </Link>
                <Link href="/admin/reviews" className="font-semibold text-[var(--accent)]">
                  Open moderator queue
                </Link>
                <Link href="/listings" className="font-semibold text-[var(--accent)]">
                  View public listings
                </Link>
              </div>
            </div>
          ) : null}
        </form>
      </div>

      <div className="space-y-6">
        <div className="dark-panel rounded-[2rem] p-6 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-[#ffc980]">
            <Sparkles size={16} />
            Preview
          </div>
          <h3 className="mt-4 font-serif text-3xl leading-tight">
            {title.trim() || "Your service listing preview"}
          </h3>
          <p className="mt-2 text-sm uppercase tracking-[0.18em] text-white/66">
            {tagline.trim() || "Short tagline appears here"}
          </p>

          <div className="mt-6 space-y-4 rounded-[1.6rem] border border-white/10 bg-white/6 p-5 text-sm leading-7 text-white/84">
            <p>
              <span className="font-semibold text-white">Category:</span>{" "}
              {category || "Select a category"}
            </p>
            <p>
              <span className="font-semibold text-white">Description:</span>{" "}
              {description.trim() || "Your detailed description will appear here."}
            </p>
            <p>
              <span className="font-semibold text-white">Pricing:</span>{" "}
              {pricingLabel}
            </p>
            {checkoutAmountSubunit != null ? (
              <p>
                <span className="font-semibold text-white">Secure checkout:</span> Enabled at R
                {(checkoutAmountSubunit / 100).toFixed(2)}
              </p>
            ) : null}
            <p>
              <span className="font-semibold text-white">Location:</span>{" "}
              {location.trim() || "Add a location or availability"}
            </p>
            <p>
              <span className="font-semibold text-white">Delivery:</span> {deliveryLabel}
            </p>
            <p>
              <span className="font-semibold text-white">Contact:</span>{" "}
              {contactLink.trim() || "Add a booking or contact link"}
            </p>
            <p>
              <span className="font-semibold text-white">Safety Note:</span>{" "}
              {safetyNote.replace("Safety Note: ", "")}
            </p>
          </div>

          <div className="mt-5 rounded-[1.4rem] bg-white px-4 py-4 text-sm text-[var(--foreground)]">
            <div className="inline-flex items-center gap-2 font-semibold text-[var(--accent-2)]">
              <CheckCircle2 size={16} />
              {isReady
                ? "Listing ready for publishing via API."
                : "Complete the remaining fields to prepare the listing."}
            </div>
            <p className="mt-2 leading-6 text-[var(--ink-soft)]">{moderatorNote}</p>
          </div>
        </div>

        <div className="soft-card rounded-[2rem] p-6">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
            <Shield size={16} />
            API payload preview
          </div>
          <pre className="mt-4 overflow-x-auto rounded-[1.4rem] bg-[#0b2118] p-4 text-xs leading-6 text-[#eef8f1]">
            {JSON.stringify(apiPayload, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
