import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, Globe, MapPin, ShieldAlert } from "lucide-react";
import { AdminReviewActions } from "@/components/admin-review-actions";
import { AdminSessionPanel } from "@/components/admin-session-panel";
import { ModerationStatusBadge } from "@/components/moderation-status-badge";
import {
  adminSessionCookieName,
  hasRequiredAdminRole,
  readAdminSession,
} from "@/lib/admin-auth";
import { getListingBySlug } from "@/lib/listings-store";

type AdminReviewDetailPageProps = {
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

export async function generateMetadata({
  params,
}: AdminReviewDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);

  if (!listing) {
    return {
      title: "Review not found | Buddies Worldwide",
    };
  }

  return {
    title: `Review ${listing.title} | Buddies Worldwide`,
    description: `Moderator review screen for ${listing.title}.`,
  };
}

export default async function AdminReviewDetailPage({
  params,
}: AdminReviewDetailPageProps) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const session = await readAdminSession(cookieStore.get(adminSessionCookieName)?.value);

  if (!hasRequiredAdminRole(session)) {
    redirect(`/admin/login?next=${encodeURIComponent(`/admin/reviews/${slug}`)}`);
  }

  const listing = await getListingBySlug(slug);

  if (!listing) {
    notFound();
  }

  const publicVisibility =
    listing.reviewStatus === "approved"
      ? "This listing is visible on public marketplace pages and the public listings API."
      : "This listing is currently hidden from public marketplace pages until it is approved.";

  return (
    <main className="pb-16 pt-4">
      <section className="page-shell">
        <div className="glass-panel rounded-[2.4rem] px-5 py-6 md:px-8 md:py-8">
          <Link
            href="/admin/reviews"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink-soft)]"
          >
            <ChevronLeft size={16} />
            Back to moderator queue
          </Link>

          <div className="mt-6 rounded-[1.8rem] border border-[rgba(198,145,37,0.22)] bg-[rgba(198,145,37,0.08)] px-5 py-4 text-sm leading-7 text-[var(--foreground)]">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-1 shrink-0 text-[#9a6915]" size={18} />
              <div>
                <p className="font-semibold text-[#9a6915]">Protected review route</p>
                <p className="mt-1 text-[var(--ink-soft)]">
                  This moderation screen now sits behind Supabase sign-in plus required admin
                  access. Decisions made here still update the marketplace data directly.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              {session ? <AdminSessionPanel session={session} /> : null}

              <div className="soft-card rounded-[2rem] p-6 md:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="section-kicker">Moderator Review</p>
                    <h1 className="mt-3 font-serif text-4xl leading-none md:text-5xl">
                      {listing.title}
                    </h1>
                    <p className="mt-3 text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
                      {listing.tagline}
                    </p>
                  </div>
                  <ModerationStatusBadge status={listing.reviewStatus} />
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-[var(--line)] bg-white/75 px-5 py-4 text-sm leading-7 text-[var(--ink-soft)]">
                  {publicVisibility}
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
                    <span className="font-semibold text-[var(--foreground)]">Delivery:</span>{" "}
                    {listing.deliveryLabel}
                  </p>
                  <p>
                    <span className="font-semibold text-[var(--foreground)]">Safety note:</span>{" "}
                    {listing.safetyNote}
                  </p>
                </div>
              </div>

              <div className="soft-card rounded-[2rem] p-6">
                <p className="section-kicker">Submission Facts</p>
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
                    Submitted: {formatDate(listing.createdAt)}
                  </div>
                  <div className="rounded-[1.2rem] border border-[var(--line)] bg-white/75 px-4 py-3">
                    Reviewed: {formatDate(listing.reviewedAt)}
                  </div>
                  <div className="rounded-[1.2rem] border border-[var(--line)] bg-white/75 px-4 py-3">
                    Moderator: {listing.moderatedBy ?? "Awaiting assignment"}
                  </div>
                  {listing.deliveryMethod === "paxi_nationwide" ? (
                    <div className="rounded-[1.2rem] border border-[rgba(46,139,87,0.16)] bg-[rgba(46,139,87,0.06)] px-4 py-3 text-sm leading-7 text-[var(--ink-soft)]">
                      <p className="font-semibold text-[var(--accent-2)]">
                        PAXI shipping detail
                      </p>
                      <p className="mt-2">
                        Speed: {listing.paxiServiceWindow ?? "Not set"}
                      </p>
                      <Link
                        href="/paxi/points"
                        className="mt-2 inline-flex font-semibold text-[var(--accent)]"
                      >
                        View PAXI points
                      </Link>
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {listing.reviewStatus === "approved" ? (
                    <Link
                      href={`/listings/${listing.slug}`}
                      className="text-sm font-semibold text-[var(--accent)]"
                    >
                      Open public listing detail
                    </Link>
                  ) : (
                    <span className="text-sm text-[var(--ink-soft)]">
                      Public listing detail stays hidden until approval.
                    </span>
                  )}
                  <Link href="/listings" className="text-sm font-semibold text-[var(--accent)]">
                    Open public listings
                  </Link>
                </div>
              </div>

              {listing.moderationNote ? (
                <div className="soft-card rounded-[2rem] p-6">
                  <p className="section-kicker">Current Moderation Note</p>
                  <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
                    {listing.moderationNote}
                  </p>
                </div>
              ) : null}
            </div>

            <aside className="space-y-6">
              <AdminReviewActions
                listingId={listing.id}
                currentStatus={listing.reviewStatus}
                currentNote={listing.moderationNote}
                currentModerator={listing.moderatedBy}
              />

              <div className="dark-panel rounded-[2rem] p-6 text-white">
                <p className="section-kicker text-[#ffc980]">Visibility Rules</p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-white/82">
                  <p>`Pending moderation` and `In review` stay hidden from public routes.</p>
                  <p>`Needs changes` keeps the listing off the live marketplace until fixed.</p>
                  <p>`Approved` makes the listing appear on the homepage, listings page and API.</p>
                  <p>`Rejected` keeps the record in MySQL for audit history but out of public view.</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
