import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight, ShieldCheck, Truck } from "lucide-react";
import { EmptyListingsState } from "@/components/empty-listings-state";
import { MobileActionBar } from "@/components/mobile-action-bar";
import { RecentAdCard } from "@/components/recent-ad-card";
import { StatusPill } from "@/components/status-pill";
import { buildCategories, provinces } from "@/lib/marketplace-data";
import { readPublicListings } from "@/lib/listings-store";
import { getMarketplaceUserById } from "@/lib/users-store";
import { readUserSession, userSessionCookieName } from "@/lib/user-auth";
import { canMarketplaceUserTrade } from "@/lib/user-verification";

export const dynamic = "force-dynamic";

export default async function ListingsPage() {
  const cookieStore = await cookies();
  const userSession = await readUserSession(cookieStore.get(userSessionCookieName)?.value);
  const currentUser = userSession
    ? await getMarketplaceUserById(userSession.marketplaceUserId)
    : null;
  const listings = await readPublicListings();
  const categories = buildCategories(listings);
  const postHref = userSession
    ? canMarketplaceUserTrade(currentUser?.verificationStatus)
      ? "/listings/new-service"
      : "/verify?next=/listings/new-service"
    : "/signup?next=/listings/new-service";

  return (
    <main className="page-safe-bottom pt-4">
      <section className="page-shell">
        <div className="glass-panel rounded-[2.4rem] px-5 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="section-kicker">Browse Listings</p>
              <h1 className="mt-3 font-serif text-4xl leading-none tracking-[-0.05em] md:text-6xl">
                A calmer marketplace view for verified trade.
              </h1>
              <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)] md:text-base">
                Public browsing stays open, while visible review states and logistics cues help
                buyers read confidence into each listing before they commit to the next step.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={postHref}
                className="inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(255,127,80,0.22)]"
              >
                {userSession ? "Continue to sell" : "Create account to sell"}
              </Link>
              <Link
                href="/verify"
                className="inline-flex min-h-11 items-center rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
              >
                Verification status
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <div className="soft-card rounded-[1.8rem] p-5">
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone="success" icon={<ShieldCheck size={14} />}>
                    Reviewed public listings
                  </StatusPill>
                  <StatusPill tone="info" icon={<Truck size={14} />}>
                    Courier-aware trade flow
                  </StatusPill>
                  <StatusPill tone="neutral">South Africa-wide browsing</StatusPill>
                </div>

                <div id="browse-categories" className="mt-5 flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/categories/${category.slug}`}
                      className="rounded-full border border-[var(--line)] bg-[var(--background-alt)] px-4 py-2 text-sm font-medium text-[var(--foreground)]"
                    >
                      {category.name}
                      {category.count > 0 ? ` (${category.count})` : ""}
                    </Link>
                  ))}
                </div>
              </div>

              <div id="trusted-listings">
                {listings.length === 0 ? (
                  <EmptyListingsState
                    title="No reviewed listings are live yet"
                    description="The trust-led browse experience is ready. Once moderators approve inventory, this page will fill automatically with public listings."
                    ctaHref={postHref}
                    ctaLabel={userSession ? "Continue onboarding" : "Create account"}
                  />
                ) : (
                  <div className="grid gap-4">
                    {listings.map((listing) => (
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
                <p className="section-kicker">Browse Cues</p>
                <h2 className="mt-3 font-serif text-3xl leading-tight tracking-[-0.04em]">
                  What trust looks like on this page.
                </h2>
                <div className="mt-5 space-y-3 text-sm leading-7 text-[var(--ink-soft)]">
                  <div className="rounded-[1.3rem] border border-[var(--line)] bg-[var(--background-alt)] px-4 py-3">
                    Only moderator-approved inventory is visible publicly.
                  </div>
                  <div className="rounded-[1.3rem] border border-[var(--line)] bg-[var(--background-alt)] px-4 py-3">
                    Delivery and location details sit beside every listing for faster risk reading.
                  </div>
                  <div className="rounded-[1.3rem] border border-[var(--line)] bg-[var(--background-alt)] px-4 py-3">
                    Selling still routes through sign-in and verification before posting tools open.
                  </div>
                </div>
              </div>

              <div className="soft-card rounded-[2rem] p-6">
                <p className="section-kicker">Provinces</p>
                <div className="mt-4 flex flex-wrap gap-2">
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

              <div className="dark-panel rounded-[2rem] p-6 text-white">
                <p className="section-kicker text-[#b9d9ff]">Ready To Sell</p>
                <h3 className="mt-3 font-serif text-3xl leading-tight tracking-[-0.04em]">
                  Use trust as the first conversion tool.
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/78">
                  Buddies Worldwide keeps browse friction low and trust friction deliberate, so
                  higher-risk actions feel more intentional from the start.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={postHref}
                    className="inline-flex min-h-11 items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
                  >
                    Open seller flow
                  </Link>
                  <Link
                    href="/paxi"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/18 px-5 py-3 text-sm font-semibold text-white"
                  >
                    Logistics tools
                    <ArrowRight size={16} />
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
            href: "/listings#browse-categories",
            label: "Browse",
            kind: "secondary",
          },
          {
            href: postHref,
            label: userSession ? "Post Listing" : "Start Selling",
            kind: "primary",
          },
        ]}
      />
    </main>
  );
}
