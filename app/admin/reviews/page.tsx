import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ChevronRight, ClipboardCheck, ShieldAlert } from "lucide-react";
import { AdminSessionPanel } from "@/components/admin-session-panel";
import { EmptyListingsState } from "@/components/empty-listings-state";
import { ModerationStatusBadge } from "@/components/moderation-status-badge";
import { adminSessionCookieName, readAdminSession } from "@/lib/admin-auth";
import { listingStatusLabels, listingStatuses } from "@/lib/moderation";
import { readListings, type Listing } from "@/lib/listings-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Moderator Review | Buddies Worldwide",
  description: "Internal moderation queue and listing review screens for Buddies Worldwide.",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function ListingQueueCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/admin/reviews/${listing.slug}`}
      className="soft-card block rounded-[1.8rem] p-5 transition duration-300 hover:-translate-y-1"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            {listing.categorySlug} / {listing.serviceCategory}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">{listing.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{listing.tagline}</p>
        </div>
        <ModerationStatusBadge status={listing.reviewStatus} />
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-sm text-[var(--ink-soft)]">
        <span>{listing.location}</span>
        <span>Submitted {formatDate(listing.createdAt)}</span>
        <span>{listing.pricingLabel}</span>
        <span>{listing.deliveryLabel}</span>
      </div>

      {listing.moderationNote ? (
        <p className="mt-4 rounded-[1.2rem] border border-[var(--line)] bg-white/70 px-4 py-3 text-sm leading-6 text-[var(--ink-soft)]">
          {listing.moderationNote}
        </p>
      ) : null}

      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
        Review listing
        <ChevronRight size={16} />
      </div>
    </Link>
  );
}

export default async function AdminReviewsPage() {
  const cookieStore = await cookies();
  const session = await readAdminSession(cookieStore.get(adminSessionCookieName)?.value);
  const listings = await readListings();
  const counts = listingStatuses.reduce<Record<string, number>>((accumulator, status) => {
    accumulator[status] = listings.filter((listing) => listing.reviewStatus === status).length;
    return accumulator;
  }, {});

  const queueListings = listings.filter((listing) =>
    ["pending_moderation", "in_review", "needs_changes"].includes(listing.reviewStatus),
  );
  const decisionListings = listings.filter((listing) =>
    ["approved", "rejected"].includes(listing.reviewStatus),
  );

  return (
    <main className="pb-16 pt-4">
      <section className="page-shell">
        <div className="glass-panel rounded-[2.4rem] px-5 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-kicker">Admin Review</p>
              <h1 className="mt-3 font-serif text-4xl leading-none md:text-5xl">
                Moderator queue and status changes
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">
                This internal screen sits directly on top of the MySQL listings table. Moderators
                can review submissions, move them through the queue and decide what becomes public.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/listings" className="text-sm font-semibold text-[var(--accent)]">
                View public marketplace
              </Link>
              <Link
                href="/listings/new-service"
                className="text-sm font-semibold text-[var(--accent)]"
              >
                Create a test listing
              </Link>
            </div>
          </div>

          <div className="mt-8 rounded-[1.8rem] border border-[rgba(198,145,37,0.22)] bg-[rgba(198,145,37,0.08)] px-5 py-4 text-sm leading-7 text-[var(--foreground)]">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-1 shrink-0 text-[#9a6915]" size={18} />
              <div>
                <p className="font-semibold text-[#9a6915]">Protected admin notice</p>
                <p className="mt-1 text-[var(--ink-soft)]">
                  This review area now requires Keycloak login plus the configured admin role before
                  moderators can review or change listing status.
                </p>
              </div>
            </div>
          </div>

          {session ? (
            <div className="mt-6">
              <AdminSessionPanel session={session} />
            </div>
          ) : null}

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {listingStatuses.map((status) => (
              <div key={status} className="soft-card rounded-[1.7rem] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  {listingStatusLabels[status]}
                </p>
                <p className="mt-3 text-4xl font-bold tracking-tight">
                  {(counts[status] ?? 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <section className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="section-kicker">Needs Attention</p>
                  <h2 className="mt-3 font-serif text-3xl leading-none md:text-4xl">
                    Queue items waiting for moderator action
                  </h2>
                </div>
                <div className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">
                  {queueListings.length} active
                </div>
              </div>

              {queueListings.length === 0 ? (
                <EmptyListingsState
                  title="Nothing in the active moderation queue"
                  description="New submissions will land here as pending moderation. Approvals, rejections and requested changes will start shaping the public marketplace from this screen."
                  ctaHref="/listings/new-service"
                  ctaLabel="Create a test listing"
                />
              ) : (
                <div className="grid gap-4">
                  {queueListings.map((listing) => (
                    <ListingQueueCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="section-kicker">Recent Decisions</p>
                  <h2 className="mt-3 font-serif text-3xl leading-none md:text-4xl">
                    Approved and rejected items
                  </h2>
                </div>
                <ClipboardCheck className="text-[var(--accent)]" size={20} />
              </div>

              {decisionListings.length === 0 ? (
                <div className="soft-card rounded-[1.8rem] p-6 text-sm leading-7 text-[var(--ink-soft)]">
                  No moderator decisions have been recorded yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {decisionListings.map((listing) => (
                    <ListingQueueCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
