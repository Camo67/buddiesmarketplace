import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowRight,
  BriefcaseBusiness,
  Cpu,
  FileCheck2,
  MapPinned,
  Shield,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { BuddiesLogo } from "@/components/buddies-logo";
import { CategoryCard } from "@/components/category-card";
import { EmptyListingsState } from "@/components/empty-listings-state";
import { RecentAdCard } from "@/components/recent-ad-card";
import { StatusPill } from "@/components/status-pill";
import {
  buildCategories,
  provinces,
  topCities,
  trustSignals,
} from "@/lib/marketplace-data";
import { readPublicListings } from "@/lib/listings-store";
import { getMarketplaceUserById } from "@/lib/users-store";
import { readUserSession, userSessionCookieName } from "@/lib/user-auth";
import { canMarketplaceUserTrade } from "@/lib/user-verification";

export const dynamic = "force-dynamic";

const personaCards = [
  {
    icon: BriefcaseBusiness,
    title: "The Survivalist Entrepreneur",
    body:
      "Moves fast, sells to grow income, and needs simple trust tools that do not slow down a working day.",
  },
  {
    icon: Shield,
    title: "The Security-Driven Suburbanite",
    body:
      "Will trade online when the process feels verifiable, predictable, and physically safer than informal meetups.",
  },
  {
    icon: Sparkles,
    title: "The Sustainable Fashionista",
    body:
      "Cares about authenticity and convenience, and responds to clean discovery flows with visible confidence markers.",
  },
  {
    icon: Cpu,
    title: "The High-End Tech Trader",
    body:
      "Needs stronger reassurance around identity, condition, and logistics before trusting a higher-value exchange.",
  },
];

const trustSteps = [
  {
    eyebrow: "1. Account",
    title: "Create a marketplace identity",
    body:
      "Email-based onboarding stays fast so browsing can start immediately, while higher-risk actions remain gated.",
  },
  {
    eyebrow: "2. Verify",
    title: "Submit identity and address documents",
    body:
      "Buddies turns a generic profile into a reviewable trade identity before posting or buyer-side trust actions unlock.",
  },
  {
    eyebrow: "3. Review",
    title: "Moderator review builds practical trust",
    body:
      "Listings and verification packages are checked before public trading visibility increases across the marketplace.",
  },
  {
    eyebrow: "4. Move",
    title: "Coordinate courier-first handover",
    body:
      "Nationwide logistics tools support safer deal flow without forcing users into risky ad-hoc meeting patterns.",
  },
];

export default async function Home() {
  const cookieStore = await cookies();
  const userSession = await readUserSession(cookieStore.get(userSessionCookieName)?.value);
  const currentUser = userSession
    ? await getMarketplaceUserById(userSession.marketplaceUserId)
    : null;
  const publicListings = await readPublicListings();
  const categories = buildCategories(publicListings);
  const recentListings = publicListings.slice(0, 6);
  const totalListings = publicListings.length;
  const primaryHref = userSession
    ? canMarketplaceUserTrade(currentUser?.verificationStatus)
      ? "/listings/new-service"
      : "/verify?next=/listings/new-service"
    : "/signup?next=/verify";

  return (
    <main className="page-safe-bottom pt-4 text-[var(--foreground)]">
      <section className="page-shell">
        <div className="hero-panel relative overflow-hidden rounded-[2.4rem] px-5 py-6 text-white sm:px-7 md:px-10 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(0,127,255,0.14),transparent_28%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_350px] lg:items-end">
            <div>
              <BuddiesLogo mode="dark" layout="inline" className="mb-6" />
              <div className="flex flex-wrap gap-2">
                <StatusPill tone="info" className="border-white/12 bg-white/10 text-white">
                  South Africa-first trust
                </StatusPill>
                <StatusPill tone="accent" className="border-white/12 bg-white/10 text-white">
                  Verified trading gates
                </StatusPill>
                <StatusPill tone="success" className="border-white/12 bg-white/10 text-white">
                  Courier-ready workflows
                </StatusPill>
              </div>

              <h1 className="mt-6 max-w-4xl font-serif text-4xl leading-[0.96] tracking-[-0.05em] sm:text-5xl md:text-7xl">
                Trusted marketplace access for South Africa&apos;s formal and informal economy.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/82 md:text-lg">
                Buddies Worldwide is designed to make peer-to-peer and small-business trade feel
                practical, clear, and safer. Verified identities, visible moderation, and
                logistics-aware handover patterns help users trade with more confidence.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={primaryHref}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(255,127,80,0.22)]"
                >
                  {userSession
                    ? canMarketplaceUserTrade(currentUser?.verificationStatus)
                      ? "Post a verified listing"
                      : "Complete verification"
                    : "Start with verification"}
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/listings"
                  className="inline-flex min-h-11 items-center rounded-full border border-white/16 bg-white/10 px-6 py-3 text-sm font-semibold text-white"
                >
                  Browse listings
                </Link>
              </div>
            </div>

            <aside className="rounded-[2rem] border border-white/12 bg-white/10 p-5 backdrop-blur md:p-6">
              <p className="section-kicker text-[#b9d9ff]">Trust Snapshot</p>
              <h2 className="mt-3 font-serif text-3xl leading-tight tracking-[-0.04em] text-white">
                Practical trust beats marketplace guesswork.
              </h2>

              <div className="mt-6 space-y-3">
                {trustSignals.map((signal) => (
                  <div
                    key={signal}
                    className="rounded-[1.25rem] border border-white/10 bg-[rgba(255,255,255,0.08)] px-4 py-3 text-sm leading-6 text-white/84"
                  >
                    {signal}
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.4rem] bg-white px-4 py-4 text-[var(--foreground)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    Live inventory
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-[-0.04em]">
                    {totalListings.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-[1.4rem] bg-white/10 px-4 py-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/64">
                    Core regions
                  </p>
                  <p className="mt-2 text-xl font-semibold">9 provinces</p>
                  <p className="mt-1 text-sm text-white/72">Built around South Africa first.</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="page-shell mt-8">
        <div className="bento-grid">
          <div className="soft-card rounded-[2rem] p-6">
            <p className="section-kicker">Audience Fit</p>
            <h2 className="mt-3 font-serif text-3xl leading-none tracking-[-0.04em]">
              Built for real market behavior.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
              From township side hustles to higher-value suburban trades, the interface is
              designed to reduce hesitation without hiding the safety layers.
            </p>
          </div>
          <div className="soft-card rounded-[2rem] p-6">
            <p className="section-kicker">Nationwide Reach</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
              Courier-first logistics
            </h3>
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
              Buddies supports discovery and trust, while PAXI-ready flows make national handover
              feel more structured than informal direct arrangements.
            </p>
          </div>
          <div className="soft-card rounded-[2rem] p-6">
            <p className="section-kicker">Moderation</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
              Visible review states
            </h3>
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
              Listings become public only after review, making trust cues part of the browsing
              experience rather than an afterthought.
            </p>
          </div>
          <div className="soft-card rounded-[2rem] p-6">
            <p className="section-kicker">Confidence</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
              Safer trading expectations
            </h3>
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
              Buyers and sellers get clearer expectations around identity, delivery, and review so
              the whole flow feels more predictable.
            </p>
          </div>
        </div>
      </section>

      <section className="page-shell mt-8">
        <div className="glass-panel rounded-[2.3rem] p-6 md:p-8">
          <div className="max-w-3xl">
            <p className="section-kicker">Audience Personas</p>
            <h2 className="mt-3 font-serif text-3xl leading-none tracking-[-0.04em] sm:text-4xl md:text-5xl">
              One marketplace, four trust mindsets.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
              Buddies Worldwide bridges affordability, convenience, and security expectations
              instead of forcing one user type to fit another.
            </p>
          </div>

          <div className="trust-grid mt-8">
            {personaCards.map((persona) => {
              const Icon = persona.icon;

              return (
                <article key={persona.title} className="soft-card rounded-[1.7rem] p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] bg-[var(--background-alt)] text-[var(--trust)]">
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-5 font-serif text-2xl leading-tight tracking-[-0.04em] text-[var(--foreground)]">
                    {persona.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{persona.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="trust-system" className="page-shell mt-8">
        <div className="glass-panel rounded-[2.3rem] p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div>
              <p className="section-kicker">How Trust Works</p>
              <h2 className="mt-3 font-serif text-3xl leading-none tracking-[-0.04em] sm:text-4xl md:text-5xl">
                A calmer path from sign-up to nationwide trade.
              </h2>
              <div className="trust-grid mt-8">
                {trustSteps.map((step) => (
                  <article key={step.title} className="soft-card rounded-[1.7rem] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--trust)]">
                      {step.eyebrow}
                    </p>
                    <h3 className="mt-3 font-serif text-2xl leading-tight tracking-[-0.04em] text-[var(--foreground)]">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{step.body}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="dark-panel rounded-[2rem] p-6 text-white">
              <StatusPill tone="success" className="border-white/12 bg-white/10 text-white">
                Courier-first reassurance
              </StatusPill>
              <h3 className="mt-4 font-serif text-3xl leading-tight tracking-[-0.04em]">
                Trust should survive the handover, not disappear at checkout.
              </h3>
              <p className="mt-4 text-sm leading-7 text-white/78">
                This phase focuses on verified identities, moderated listings, and structured
                logistics cues. It deliberately avoids promising live escrow or wallet flows before
                the product roadmap reaches that stage.
              </p>

              <div className="mt-6 space-y-3">
                <div className="rounded-[1.4rem] border border-white/12 bg-white/10 px-4 py-3">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                    <FileCheck2 size={16} />
                    Identity review before higher-trust actions
                  </div>
                </div>
                <div className="rounded-[1.4rem] border border-white/12 bg-white/10 px-4 py-3">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                    <Truck size={16} />
                    Courier and collection cues built into listing flow
                  </div>
                </div>
                <div className="rounded-[1.4rem] border border-white/12 bg-white/10 px-4 py-3">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                    <ShieldCheck size={16} />
                    Visible moderation backing public marketplace pages
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/verify"
                  className="inline-flex min-h-11 items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
                >
                  Open verification
                </Link>
                <Link
                  href="/paxi"
                  className="inline-flex min-h-11 items-center rounded-full border border-white/18 px-5 py-3 text-sm font-semibold text-white"
                >
                  See logistics tools
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="page-shell mt-8">
        <div className="glass-panel rounded-[2.3rem] p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="section-kicker">Browse Categories</p>
              <h2 className="mt-3 font-serif text-3xl leading-none tracking-[-0.04em] sm:text-4xl md:text-5xl">
                Bento-style browsing that feels stable on mobile and desktop.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
                Category-first discovery helps users quickly orient themselves without the chaos of
                unstructured classifieds pages.
              </p>
            </div>
            <Link
              href="/listings"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]"
            >
              Explore all listings
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-8 bento-grid">
            {categories.map((category) => (
              <CategoryCard key={category.slug} category={category} />
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="soft-card rounded-[2.2rem] p-6 md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-kicker">Recent Listings</p>
              <h2 className="mt-3 font-serif text-3xl leading-none tracking-[-0.04em] sm:text-4xl">
                Recently approved listings
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[var(--ink-soft)]">
              Public inventory only shows listings that have cleared moderation, making trust cues
              part of discovery from the first scroll.
            </p>
          </div>

          <div className="mt-8">
            {recentListings.length === 0 ? (
              <EmptyListingsState
                title="No approved listings yet"
                description="The marketplace shell is ready for trust-led browsing. Approved inventory will appear here automatically as moderation decisions are made."
                ctaHref={primaryHref}
                ctaLabel={userSession ? "Open your next step" : "Create your account"}
              />
            ) : (
              <div className="grid gap-4">
                {recentListings.map((listing) => (
                  <RecentAdCard
                    key={listing.id}
                    ad={{
                      title: listing.title,
                      price: listing.pricingLabel,
                      description: listing.description,
                      locationLabel: listing.location,
                      deliveryLabel: listing.deliveryLabel,
                      category:
                        categories.find((category) => category.slug === listing.categorySlug)
                          ?.name ?? "Listing",
                      subcategory: listing.serviceCategory,
                      href: `/listings/${listing.slug}`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="soft-card rounded-[2rem] p-6">
            <p className="section-kicker">Coverage</p>
            <h3 className="mt-3 font-serif text-3xl leading-tight tracking-[-0.04em]">
              South Africa first, scale-ready after that.
            </h3>
            <div className="mt-5 flex flex-wrap gap-2">
              {provinces.map((province) => (
                <span
                  key={province}
                  className="rounded-full border border-[var(--line)] bg-[var(--background-alt)] px-3 py-2 text-sm font-medium"
                >
                  {province}
                </span>
              ))}
            </div>
          </div>

          <div className="soft-card rounded-[2rem] p-6">
            <p className="section-kicker">Top Cities</p>
            <div className="mt-4 space-y-3">
              {topCities.slice(0, 8).map((city) => (
                <div
                  key={city}
                  className="flex items-center justify-between rounded-[1.2rem] border border-[var(--line)] bg-[var(--background-alt)] px-4 py-3 text-sm font-medium"
                >
                  <span>{city}</span>
                  <MapPinned size={16} className="text-[var(--trust)]" />
                </div>
              ))}
            </div>
          </div>

          <div className="dark-panel rounded-[2rem] p-6 text-white">
            <p className="section-kicker text-[#b9d9ff]">Logistics Confidence</p>
            <h3 className="mt-3 font-serif text-3xl leading-tight tracking-[-0.04em]">
              Safer delivery starts with clearer expectations.
            </h3>
            <p className="mt-4 text-sm leading-7 text-white/78">
              The Phase 1 experience focuses on identity, moderation, and logistics cues that make
              remote trading feel more deliberate and less improvised.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/paxi"
                className="inline-flex min-h-11 items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
              >
                Open logistics hub
              </Link>
              <Link
                href={primaryHref}
                className="inline-flex min-h-11 items-center rounded-full border border-white/18 px-5 py-3 text-sm font-semibold text-white"
              >
                Continue onboarding
              </Link>
            </div>
          </div>
        </aside>
      </section>

      <footer className="page-shell mt-8 pb-6">
        <div className="glass-panel flex flex-col gap-4 rounded-[2rem] px-5 py-5 text-sm text-[var(--ink-soft)] md:flex-row md:items-center md:justify-between md:px-6">
          <p>
            Buddies Worldwide brings verified trust, calmer browsing, and logistics-aware trade to
            South Africa&apos;s everyday marketplace economy.
          </p>
          <div className="flex flex-wrap gap-4 font-semibold text-[var(--foreground)]">
            <Link href={primaryHref}>{userSession ? "Continue" : "Create account"}</Link>
            <Link href="/listings">Browse listings</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/data-deletion">Data Deletion</Link>
            <Link href="/terms">Terms &amp; Conditions</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
