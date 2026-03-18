import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Globe, MapPin, ShieldCheck } from "lucide-react";
import { ModerationStatusBadge } from "@/components/moderation-status-badge";
import { getListingBySlug } from "@/lib/listings-store";
import { listingStatusLabels } from "@/lib/moderation";

type ListingDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) {
    return "Not reviewed yet";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);

  if (!listing || listing.reviewStatus !== "approved") {
    notFound();
  }

  return (
    <main className="pb-16 pt-4">
      <section className="page-shell">
        <div className="glass-panel rounded-[2.4rem] px-5 py-6 md:px-8 md:py-8">
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink-soft)]"
          >
            <ChevronLeft size={16} />
            Back to all listings
          </Link>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="soft-card rounded-[2rem] p-6 md:p-8">
              <p className="section-kicker">Service Listing</p>
              <h1 className="mt-3 font-serif text-4xl leading-none md:text-5xl">
                {listing.title}
              </h1>
              <p className="mt-3 text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
                {listing.tagline}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <ModerationStatusBadge status={listing.reviewStatus} />
                <span className="text-sm text-[var(--ink-soft)]">
                  {listingStatusLabels[listing.reviewStatus]}
                </span>
              </div>

              <div className="mt-8 space-y-5 text-sm leading-7 text-[var(--ink-soft)]">
                <p>
                  <span className="font-semibold text-[var(--foreground)]">Category:</span>{" "}
                  Services / {listing.serviceCategory}
                </p>
                <p>
                  <span className="font-semibold text-[var(--foreground)]">Seller:</span>{" "}
                  {listing.ownerDisplayName ?? "Marketplace member"}
                </p>
                <p>
                  <span className="font-semibold text-[var(--foreground)]">Description:</span>{" "}
                  {listing.description}
                </p>
                <p>
                  <span className="font-semibold text-[var(--foreground)]">Pricing:</span>{" "}
                  {listing.pricingMethod} / {listing.pricingLabel}
                </p>
                <p>
                  <span className="font-semibold text-[var(--foreground)]">Location:</span>{" "}
                  {listing.location}
                </p>
                <p>
                  <span className="font-semibold text-[var(--foreground)]">Delivery:</span>{" "}
                  {listing.deliveryLabel}
                </p>
                <p>
                  <span className="font-semibold text-[var(--foreground)]">Contact:</span>{" "}
                  {listing.contactLink}
                </p>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="dark-panel rounded-[2rem] p-6 text-white">
                <p className="section-kicker text-[#ffc980]">Review Status</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
                  <ShieldCheck size={16} />
                  {listingStatusLabels[listing.reviewStatus]}
                </div>
                <p className="mt-4 text-sm leading-7 text-white/82">
                  This listing is live on the public marketplace and in the public listings API.
                </p>
                {listing.moderationNote ? (
                  <div className="mt-4 rounded-[1.3rem] border border-white/12 bg-white/8 px-4 py-4 text-sm leading-7 text-white/82">
                    <p className="font-semibold text-white">Moderator note</p>
                    <p className="mt-2">{listing.moderationNote}</p>
                  </div>
                ) : null}
                <div className="mt-4 text-sm leading-7 text-white/72">
                  <p>
                    Reviewed by: {listing.moderatedBy ?? "Awaiting assignment"}
                  </p>
                  <p>Reviewed at: {formatDate(listing.reviewedAt)}</p>
                </div>
                <p className="mt-4 text-sm leading-7 text-white/82">{listing.safetyNote}</p>
              </div>

              <div className="soft-card rounded-[2rem] p-6">
                <p className="section-kicker">Quick Facts</p>
                <div className="mt-4 space-y-3 text-sm text-[var(--ink-soft)]">
                  <div className="flex items-center gap-3 rounded-[1.2rem] border border-[var(--line)] bg-white/75 px-4 py-3">
                    <MapPin size={16} />
                    {listing.location}
                  </div>
                  <div className="flex items-center gap-3 rounded-[1.2rem] border border-[var(--line)] bg-white/75 px-4 py-3">
                    <Globe size={16} />
                    {listing.contactLink}
                  </div>
                  <div className="rounded-[1.2rem] border border-[var(--line)] bg-white/75 px-4 py-3">
                    Delivery: {listing.deliveryLabel}
                  </div>
                  {listing.deliveryMethod === "paxi_nationwide" ? (
                    <div className="rounded-[1.2rem] border border-[rgba(46,139,87,0.16)] bg-[rgba(46,139,87,0.06)] px-4 py-3 text-sm leading-7 text-[var(--ink-soft)]">
                      <p className="font-semibold text-[var(--accent-2)]">
                        PAXI nationwide delivery enabled
                      </p>
                      <p className="mt-2">
                        Delivery speed: {listing.paxiServiceWindow ?? "Set during moderation"}
                      </p>
                      <Link
                        href="/paxi/points"
                        className="mt-2 inline-flex font-semibold text-[var(--accent)]"
                      >
                        Browse PAXI points
                      </Link>
                    </div>
                  ) : null}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/admin/reviews"
                    className="text-sm font-semibold text-[var(--accent)]"
                  >
                    Open moderator queue
                  </Link>
                  <Link
                    href={`/admin/reviews/${listing.slug}`}
                    className="text-sm font-semibold text-[var(--accent)]"
                  >
                    Review this listing
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
