import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  ChevronLeft,
  MapPin,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import { MobileActionBar } from "@/components/mobile-action-bar";
import { StatusPill } from "@/components/status-pill";
import {
  getPublicCanonicalProfileById,
  isPublicProfileUserId,
} from "@/lib/canonical-public-profiles";

type PublicProfilePageProps = {
  params: Promise<{
    userId: string;
  }>;
  searchParams: Promise<{
    returnTo?: string;
  }>;
};

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function buildInitials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "BW";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function safeReturnPath(value: string | undefined) {
  return value && value.startsWith("/") ? value : null;
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: PublicProfilePageProps) {
  const [{ userId }, { returnTo }] = await Promise.all([params, searchParams]);

  if (!isPublicProfileUserId(userId)) {
    notFound();
  }

  const profile = await getPublicCanonicalProfileById(userId, {
    refreshTrustScore: true,
  });

  if (!profile) {
    notFound();
  }

  const returnHref = safeReturnPath(returnTo);
  const averageRatingLabel =
    profile.stats.averageRating != null ? profile.stats.averageRating.toFixed(1) : "No ratings yet";

  return (
    <main className="page-safe-bottom pt-4">
      <section className="page-shell">
        <div className="glass-panel rounded-[2.4rem] px-5 py-6 md:px-8 md:py-8">
          <Link
            href={returnHref ?? "/listings"}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink-soft)]"
          >
            <ChevronLeft size={16} />
            {returnHref ? "Back to listing" : "Back to listings"}
          </Link>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
            <div className="space-y-6">
              <div className="hero-panel relative overflow-hidden rounded-[2.2rem] px-6 py-7 text-white md:px-8 md:py-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,127,80,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(46,139,87,0.18),transparent_30%)]" />
                <div className="relative">
                  <div className="flex flex-wrap gap-2">
                    <StatusPill tone="accent" className="border-white/16 bg-white/10 text-white">
                      Public seller profile
                    </StatusPill>
                    <StatusPill tone="success" className="border-white/16 bg-white/10 text-white">
                      {profile.trustBand.label}
                    </StatusPill>
                    {profile.isFicaVerified ? (
                      <StatusPill
                        tone="success"
                        className="border-white/16 bg-white/10 text-white"
                      >
                        FICA reviewed
                      </StatusPill>
                    ) : null}
                  </div>

                  <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={`${profile.displayName} avatar`}
                        className="h-20 w-20 rounded-[1.6rem] border border-white/14 object-cover shadow-[0_20px_40px_rgba(0,0,0,0.18)]"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-[1.6rem] border border-white/14 bg-white/10 text-2xl font-black shadow-[0_20px_40px_rgba(0,0,0,0.18)]">
                        {buildInitials(profile.displayName)}
                      </div>
                    )}

                    <div>
                      <p className="section-kicker text-[#b9d9ff]">Trust Profile</p>
                      <h1 className="mt-3 font-serif text-4xl leading-none tracking-[-0.05em] md:text-6xl">
                        {profile.displayName}
                      </h1>
                      <p className="mt-4 max-w-3xl text-sm leading-7 text-white/82 md:text-base">
                        {profile.summary}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="trust-grid">
                <div className="soft-card rounded-[1.9rem] p-5">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--trust)]">
                    <ShieldCheck size={16} />
                    Trust score
                  </div>
                  <p className="mt-4 text-5xl font-black tracking-[-0.05em] text-[var(--foreground)]">
                    {profile.trustScore}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                    {profile.trustBand.summary}
                  </p>
                </div>

                <div className="soft-card rounded-[1.9rem] p-5">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--trust)]">
                    <MapPin size={16} />
                    Location
                  </div>
                  <p className="mt-4 text-2xl font-bold tracking-[-0.04em] text-[var(--foreground)]">
                    {profile.locationLabel}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                    Member since {formatDate(profile.memberSince)}
                  </p>
                </div>

                <div className="soft-card rounded-[1.9rem] p-5">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--success)]">
                    <Truck size={16} />
                    Courier-verified seller deliveries
                  </div>
                  <p className="mt-4 text-2xl font-bold tracking-[-0.04em] text-[var(--foreground)]">
                    {profile.stats.verifiedSellerDeliveriesCount}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                    Completed seller orders: {profile.stats.sellerCompletedOrdersCount}
                  </p>
                </div>

                <div className="soft-card rounded-[1.9rem] p-5">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
                    <Star size={16} />
                    Community feedback
                  </div>
                  <p className="mt-4 text-2xl font-bold tracking-[-0.04em] text-[var(--foreground)]">
                    {averageRatingLabel}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                    {profile.stats.ratingCount} rating{profile.stats.ratingCount === 1 ? "" : "s"} on
                    record
                  </p>
                </div>
              </div>

              <div className="soft-card rounded-[2rem] p-6">
                <p className="section-kicker">Why This Score Exists</p>
                <h2 className="mt-3 font-serif text-3xl leading-tight tracking-[-0.04em]">
                  Transparent trust signals, not hidden reputation math.
                </h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {profile.trustBreakdown.items.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--background-alt)] px-5 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-[var(--foreground)]">
                            {item.label}
                          </p>
                          <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                            {item.description}
                          </p>
                        </div>
                        <div className="rounded-full bg-white px-3 py-2 text-sm font-bold text-[var(--foreground)]">
                          {item.points}/{item.maxPoints}
                        </div>
                      </div>
                      <p className="mt-3 text-sm font-medium text-[var(--muted)]">{item.detail}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="soft-card rounded-[2rem] p-6">
                <p className="section-kicker">Public Signals</p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--ink-soft)]">
                  <div className="rounded-[1.2rem] border border-[var(--line)] bg-[var(--background-alt)] px-4 py-3">
                    Approved listings: {profile.stats.approvedListingsCount}
                  </div>
                  <div className="rounded-[1.2rem] border border-[var(--line)] bg-[var(--background-alt)] px-4 py-3">
                    Active credentials: {profile.stats.activeCredentialsCount}
                  </div>
                  <div className="rounded-[1.2rem] border border-[var(--line)] bg-[var(--background-alt)] px-4 py-3">
                    Completed trades:{" "}
                    {profile.stats.sellerCompletedOrdersCount + profile.stats.buyerCompletedOrdersCount}
                  </div>
                </div>
              </div>

              <div className="dark-panel rounded-[2rem] p-6 text-white">
                <p className="section-kicker text-[#ffc980]">Trust Policy</p>
                <h3 className="mt-3 font-serif text-3xl leading-tight tracking-[-0.04em]">
                  Trust grows from verified identity and delivered trade history.
                </h3>
                <div className="mt-5 space-y-3 text-sm leading-7 text-white/80">
                  <p>
                    Buddies stores only safe public profile fields here. Email addresses, phone
                    numbers, and internal moderation notes stay private.
                  </p>
                  <p>
                    Scores update from canonical completed orders and delivered shipments. True
                    escrow-release weighting stays out of scope until the payments milestone lands.
                  </p>
                  <p>
                    Direct messaging will connect here once conversations move onto the canonical
                    profile and order graph.
                  </p>
                </div>
              </div>

              <div className="soft-card rounded-[2rem] p-6">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
                  <BadgeCheck size={16} />
                  Useful next step
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                  Use the seller profile as a trust checkpoint, then return to the listing to review
                  delivery details and payment guards before you commit.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={returnHref ?? "/listings"}
                    className="inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(255,127,80,0.22)]"
                  >
                    {returnHref ? "Back to listing" : "Browse listings"}
                  </Link>
                  <Link
                    href="/verify"
                    className="inline-flex min-h-11 items-center rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
                  >
                    Trust requirements
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <MobileActionBar
        actions={[
          {
            href: returnHref ?? "/listings",
            label: returnHref ? "Back to listing" : "Browse",
            kind: "secondary",
          },
          {
            href: "/verify",
            label: "Trust Rules",
            kind: "primary",
          },
        ]}
      />
    </main>
  );
}
