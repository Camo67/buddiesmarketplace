import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowRight,
  ChevronRight,
  FileText,
  MapPinned,
  Search,
  Shield,
  Sparkles,
} from "lucide-react";
import { CategoryCard } from "@/components/category-card";
import { EmptyListingsState } from "@/components/empty-listings-state";
import { RecentAdCard } from "@/components/recent-ad-card";
import {
  buildCategories,
  provinces,
  topCities,
  trustSignals,
} from "@/lib/marketplace-data";
import { readPublicListings } from "@/lib/listings-store";
import { BuddiesLogo } from "@/components/buddies-logo";
import { readUserSession, userSessionCookieName } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

const founderPitchCards = [
  {
    eyebrow: "Sign Up",
    title: "Real you, or no account.",
    body:
      "Upload your ID and proof of address, then let Buddies tie every post back to a real person instead of another throwaway profile.",
  },
  {
    eyebrow: "List It",
    title: "Post the item. Keep the trail.",
    body:
      "Phone, couch, service, spare part - add the photos, set the price, and keep the deal tied to a verified listing owner.",
  },
  {
    eyebrow: "Move It",
    title: "PAXI gives the deal national reach.",
    body:
      "Sell beyond your own city and use the PAXI network to plan pickup and parcel movement across thousands of South African collection points.",
  },
  {
    eyebrow: "Pay It",
    title: "What the buyer sees should be the amount they pay.",
    body:
      "Fixed-price secure checkout is now wired for eligible listings, while the rest of the marketplace still keeps pricing visible and upfront.",
  },
];

export default async function Home() {
  const cookieStore = await cookies();
  const userSession = await readUserSession(cookieStore.get(userSessionCookieName)?.value);
  const publicListings = await readPublicListings();
  const categories = buildCategories(publicListings);
  const recentListings = publicListings.slice(0, 12);
  const totalListings = publicListings.length;
  const signupHref = userSession ? "/listings/new-service" : "/signup";
  const howItWorksHref = "/how-it-works";

  return (
    <main className="pb-16 text-[var(--foreground)]">
      <header className="page-shell pt-4">
        <div className="glass-panel flex flex-col gap-4 rounded-[2rem] px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <p className="section-kicker">Buddies Worldwide</p>
            <h1 className="mt-2 font-serif text-2xl font-semibold tracking-tight md:text-3xl">
              Browse South Africa with more trust.
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/terms"
              className="rounded-full border border-[var(--line)] bg-white/70 px-4 py-2 font-medium"
            >
              Terms
            </Link>
            <Link
              href={signupHref}
              className="rounded-full border border-[var(--line)] bg-white/70 px-4 py-2 font-medium"
            >
              {userSession ? "Create Listing" : "Sign Up"}
            </Link>
            <Link
              href={howItWorksHref}
              className="rounded-full bg-[var(--foreground)] px-4 py-2 font-semibold text-white"
            >
              Start Selling
            </Link>
          </div>
        </div>
      </header>

      <section className="page-shell mt-6">
        <div className="hero-panel relative overflow-hidden rounded-[2.6rem] px-6 py-8 text-white md:px-10 md:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(242,140,40,0.34),transparent_28%),radial-gradient(circle_at_right,rgba(94,201,134,0.22),transparent_26%),linear-gradient(130deg,rgba(6,27,19,0.95),rgba(17,70,45,0.9))]" />
          <div className="absolute right-6 top-6 hidden h-44 w-44 rounded-full border border-white/10 bg-white/5 blur-2xl md:block" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_340px] lg:items-end">
            <div>
              <BuddiesLogo mode="dark" layout="inline" className="mb-5" />
              <p className="section-kicker text-[#ffc980]">
                Buddies Worldwide, built by Camo
              </p>
              <h2 className="mt-4 max-w-4xl font-serif text-5xl leading-[0.92] md:text-7xl">
                Real people. Real trades. Real trust.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/76 md:text-lg">
                I built Buddies Worldwide because scammers keep taking food off real people's
                tables. This version keeps the marketplace broad, but pushes harder on verified
                identities, visible listings, nationwide reach and a cleaner fraud trail.
              </p>

              <div className="mt-8 grid gap-3 rounded-[2rem] border border-white/10 bg-white/8 p-4 md:grid-cols-[minmax(0,1fr)_220px_190px_auto]">
                <label className="flex items-center gap-3 rounded-[1.3rem] bg-white/94 px-4 py-4 text-[var(--foreground)]">
                  <Search size={18} />
                  <input
                    aria-label="Search listings"
                    placeholder="Search cars, flats, services, tutors..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-500"
                  />
                </label>
                <div className="flex items-center gap-3 rounded-[1.3rem] bg-white/12 px-4 py-4 text-sm text-white/88">
                  <MapPinned size={18} />
                  South Africa
                </div>
                <div className="flex items-center gap-3 rounded-[1.3rem] bg-white/12 px-4 py-4 text-sm text-white/88">
                  <Sparkles size={18} />
                  All categories
                </div>
                <Link
                  href="/listings"
                  className="rounded-[1.3rem] bg-[var(--accent)] px-5 py-4 text-center text-sm font-bold text-[#10281d] transition hover:bg-[#ffb45f]"
                >
                  Browse now
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {["Johannesburg", "Cape Town", "Durban", "Pretoria", "Nationwide"].map(
                  (city) => (
                    <span
                      key={city}
                      className="rounded-full border border-white/18 bg-white/8 px-4 py-2 text-sm text-white/85"
                    >
                      {city}
                    </span>
                  ),
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/82">
                <span className="rounded-full border border-white/18 bg-white/8 px-4 py-2">
                  Sign-up requires terms acceptance
                </span>
                <span className="rounded-full border border-white/18 bg-white/8 px-4 py-2">
                  Personals is locked to verified 18+ users
                </span>
                <span className="rounded-full border border-white/18 bg-white/8 px-4 py-2">
                  Vehicles, jobs and services stay broadly open
                </span>
              </div>
            </div>

            <aside className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur md:p-6">
              <p className="section-kicker text-[#9fe1b8]">Trust Layer</p>
              <h3 className="mt-3 font-serif text-3xl leading-tight">
                Marketplace reach with a fraud-aware backbone.
              </h3>

              <div className="mt-5 space-y-3">
                {trustSignals.map((signal) => (
                  <div
                    key={signal}
                    className="flex items-start gap-3 rounded-[1.2rem] bg-black/18 px-4 py-3 text-sm text-white/86"
                  >
                    <Shield className="mt-0.5 shrink-0 text-[#9fe1b8]" size={16} />
                    <span>{signal}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[1.5rem] bg-white px-5 py-4 text-[var(--foreground)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                  Live scope
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight">
                  {totalListings.toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  live listings across South Africa categories
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="page-shell mt-8">
        <div className="glass-panel rounded-[2.2rem] p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
            <div>
              <p className="section-kicker">No Fluff</p>
              <h2 className="mt-3 font-serif text-4xl leading-none md:text-5xl">
                Here's how Buddies Worldwide works when you strip out the bullshit.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--ink-soft)]">
                Yo, it's your boy Camo - your local app dev. Buddies Worldwide is for people who
                are tired of scammers wasting time, stealing money and hiding behind fake profiles.
                The point is simple: make it easier to trade anywhere in South Africa without
                acting like fraud is just part of the game.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {founderPitchCards.map((card) => (
                  <div key={card.title} className="soft-card rounded-[1.6rem] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                      {card.eyebrow}
                    </p>
                    <h3 className="mt-2 text-lg font-bold">{card.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{card.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="dark-panel rounded-[2rem] p-6 text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(255,255,255,0.12)] px-3 py-2 text-sm font-semibold text-[#ffc980]">
                <FileText size={16} />
                Camo's take
              </div>
              <h3 className="mt-4 font-serif text-3xl leading-tight">
                Scammers? Fuck off.
              </h3>
              <div className="mt-5 space-y-3 text-sm leading-7 text-white/82">
                <div className="rounded-[1.2rem] border border-white/12 bg-white/8 px-4 py-3">
                  Report it, and the moderation trail stays tied to the listing, the account and
                  the identity details that came in during signup.
                </div>
                <div className="rounded-[1.2rem] border border-white/12 bg-white/8 px-4 py-3">
                  Fixed-price checkout now has a server-side payment trail for eligible listings
                  instead of relying on screenshots and stories.
                </div>
                <div className="rounded-[1.2rem] border border-white/12 bg-white/8 px-4 py-3">
                  The whole point is national reach without "sorry, Joburg only" energy.
                </div>
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#9fe1b8]">
                Buddies Worldwide. You in?
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={signupHref}
                  className="rounded-full bg-white px-5 py-3 text-sm font-bold text-[var(--foreground)]"
                >
                  {userSession ? "Create listing" : "Join now"}
                </Link>
                <Link
                  href={howItWorksHref}
                  className="rounded-full border border-white/22 px-5 py-3 text-sm font-semibold text-white/92"
                >
                  See how it works
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell mt-8">
        <div className="glass-panel rounded-[2.2rem] p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="section-kicker">Top Categories</p>
              <h2 className="mt-3 font-serif text-4xl leading-none md:text-5xl">
                The homepage should feel like a real classifieds market, not a startup brochure.
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--ink-soft)]">
                These sections mirror the browsing rhythm you described: category first, then
                city, then recent ads. It gives users an immediate sense of volume and locality.
              </p>
            </div>
            <Link
              href="/listings"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]"
            >
              Open all listings
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard key={category.slug} category={category} />
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div id="recent-ads" className="soft-card rounded-[2.2rem] p-6 md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-kicker">Recent Listings</p>
              <h2 className="mt-3 font-serif text-4xl leading-none md:text-5xl">
                Fresh listings will show up here
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[var(--ink-soft)]">
              This feed only shows moderator-approved listings from the live MySQL-backed
              marketplace. New submissions stay private until they pass review.
            </p>
          </div>

          <div className="mt-8">
            {recentListings.length === 0 ? (
                <EmptyListingsState
                  title="No recent listings yet"
                  description="The listing pages are real and ready, but there are no approved user-created posts yet. Once moderators approve listings, this section will show the latest ads automatically."
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
            <p className="section-kicker">Browse Regions</p>
            <h3 className="mt-3 font-serif text-3xl leading-tight">
              South Africa first, expansion ready later.
            </h3>
            <div className="mt-5 flex flex-wrap gap-2">
              {provinces.map((province) => (
                <span
                  key={province}
                  className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-2 text-sm font-medium"
                >
                  {province}
                </span>
              ))}
            </div>
          </div>

          <div className="soft-card rounded-[2rem] p-6">
            <p className="section-kicker">Top Cities</p>
            <div className="mt-4 space-y-3">
              {topCities.map((city) => (
                <div
                  key={city}
                  className="flex items-center justify-between rounded-[1.2rem] border border-[var(--line)] bg-white/65 px-4 py-3 text-sm font-medium"
                >
                  <span>{city}</span>
                  <ChevronRight size={16} className="text-[var(--muted)]" />
                </div>
              ))}
            </div>
          </div>

          <div className="dark-panel rounded-[2rem] p-6 text-white">
            <p className="section-kicker text-[#9fe1b8]">Seller Onboarding</p>
            <h3 className="mt-3 font-serif text-3xl leading-tight">
              One account can browse today and sell tomorrow.
            </h3>
            <p className="mt-4 text-sm leading-7 text-white/82">
              The homepage can keep the marketplace open while the backend progressively unlocks
              seller tools after verification, profile completion and trust checks.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={howItWorksHref}
                className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-bold text-[#123323]"
              >
                Start Selling
              </Link>
              <Link
                href="/admin/reviews"
                className="inline-flex rounded-full border border-white/22 px-5 py-3 text-sm font-semibold text-white/92"
              >
                Moderator review queue
              </Link>
            </div>
          </div>
        </aside>
      </section>

      <footer className="page-shell mt-8">
        <div className="glass-panel flex flex-col gap-4 rounded-[2rem] px-5 py-5 text-sm text-[var(--ink-soft)] md:flex-row md:items-center md:justify-between md:px-6">
          <p>
            Real people. Real trades. Real trust. Built to make scammers feel unwelcome from the
            first click.
          </p>
          <div className="flex flex-wrap gap-4 font-semibold text-[var(--foreground)]">
            <Link href={signupHref}>{userSession ? "Create Listing" : "Sign Up"}</Link>
            <Link href={howItWorksHref}>How It Works</Link>
            <Link href="/terms">Terms &amp; Conditions</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
