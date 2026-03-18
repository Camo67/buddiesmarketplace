import Link from "next/link";
import { cookies } from "next/headers";
import { ChevronRight, Search } from "lucide-react";
import { EmptyListingsState } from "@/components/empty-listings-state";
import { RecentAdCard } from "@/components/recent-ad-card";
import { buildCategories, provinces } from "@/lib/marketplace-data";
import { readPublicListings } from "@/lib/listings-store";
import { readUserSession, userSessionCookieName } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export default async function ListingsPage() {
  const cookieStore = await cookies();
  const userSession = await readUserSession(cookieStore.get(userSessionCookieName)?.value);
  const listings = await readPublicListings();
  const categories = buildCategories(listings);

  return (
    <main className="pb-16 pt-4">
      <section className="page-shell">
        <div className="glass-panel rounded-[2.4rem] px-5 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-kicker">Listings</p>
              <h1 className="mt-3 font-serif text-4xl leading-none md:text-5xl">
                All Listings
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-soft)]">
                This is the live marketplace route. It reads approved listings from MySQL, while
                newly submitted ads stay hidden until moderation is complete.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/listings/new-service"
                className="text-sm font-semibold text-[var(--accent)]"
              >
                Create a service listing
              </Link>
              <Link href="/admin/reviews" className="text-sm font-semibold text-[var(--accent)]">
                Moderator review queue
              </Link>
              <Link href="/paxi" className="text-sm font-semibold text-[var(--accent)]">
                PAXI tools
              </Link>
              <Link
                href={userSession ? "/listings/new-service" : "/signup?next=/listings/new-service"}
                className="text-sm font-semibold text-[var(--accent)]"
              >
                {userSession ? "Create a service listing" : "Create an account to post"}
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-3 rounded-[2rem] border border-[var(--line)] bg-white/50 p-4 md:grid-cols-[minmax(0,1fr)_220px_auto]">
            <label className="flex items-center gap-3 rounded-[1.2rem] bg-white px-4 py-4">
              <Search size={18} />
              <input
                aria-label="Search all listings"
                placeholder="Search vehicles, homes, jobs and services..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>
            <div className="rounded-[1.2rem] bg-white px-4 py-4 text-sm text-[var(--ink-soft)]">
              South Africa / All provinces
            </div>
            <div className="rounded-[1.2rem] bg-white px-4 py-4 text-sm text-[var(--ink-soft)]">
              All categories
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              {listings.length === 0 ? (
                <EmptyListingsState
                  title="No approved listings yet"
                  description="The marketplace routes are live, but no listings have been approved for public display yet. Once moderators approve posts, this page will show search results, sorting, pagination and category filtering."
                  ctaHref="/listings/new-service"
                  ctaLabel="Create a listing for review"
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

            <aside className="space-y-6">
              <div className="soft-card rounded-[2rem] p-6">
                <p className="section-kicker">Browse Categories</p>
                <div className="mt-4 space-y-3">
                  {categories.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/categories/${category.slug}`}
                      className="flex items-center justify-between rounded-[1.2rem] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm font-medium"
                    >
                      <span>
                        {category.name} ({category.count})
                      </span>
                      <ChevronRight size={16} className="text-[var(--muted)]" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="soft-card rounded-[2rem] p-6">
                <p className="section-kicker">Provinces</p>
                <div className="mt-4 flex flex-wrap gap-2">
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
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
