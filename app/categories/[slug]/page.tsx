import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { EmptyListingsState } from "@/components/empty-listings-state";
import { RecentAdCard } from "@/components/recent-ad-card";
import {
  buildCategories,
  categoryDefinitions,
  getCategoryBySlug,
} from "@/lib/marketplace-data";
import { getListingsByCategory, readPublicListings } from "@/lib/listings-store";

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return categoryDefinitions.map((category) => ({
    slug: category.slug,
  }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const allListings = await readPublicListings();
  const category = getCategoryBySlug(slug, allListings);

  if (!category) {
    return {
      title: "Category not found | Buddies Worldwide",
    };
  }

  return {
    title: `${category.name} | Buddies Worldwide`,
    description: `${category.name} listings across South Africa on Buddies Worldwide.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const allListings = await readPublicListings();
  const category = getCategoryBySlug(slug, allListings);

  if (!category) {
    notFound();
  }

  const categoryListings = await getListingsByCategory(slug, { publicOnly: true });
  const categories = buildCategories(allListings);

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

          <div className="mt-6 rounded-[2rem] bg-white/60 p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="section-kicker">{category.name}</p>
                <h1 className="mt-3 font-serif text-4xl leading-none md:text-5xl">
                  {category.name}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-soft)]">
                  {category.description}
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">
                  {category.count} live listings
                </div>
                {category.restrictionLabel ? (
                  <div className="rounded-full border border-[rgba(242,140,40,0.22)] bg-[rgba(242,140,40,0.08)] px-4 py-2 text-sm font-semibold text-[#c96c27]">
                    {category.restrictionLabel}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {category.examples.map((example) => (
                <span
                  key={example}
                  className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-sm"
                >
                  {example}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8">
            {categoryListings.length === 0 ? (
              <EmptyListingsState
                title={`No ${category.name.toLowerCase()} listings yet`}
                description={`This category route is live and ready, but there are no approved ${category.name.toLowerCase()} listings yet. Once moderators approve posts, this page will render real cards instead of an empty state.`}
                ctaHref={category.slug === "services" ? "/listings/new-service" : "/signup"}
                ctaLabel={
                  category.slug === "services"
                    ? "Create a service listing for review"
                    : "Create an account to post"
                }
              />
            ) : (
              <div className="grid gap-4">
                {categoryListings.map((listing) => (
                  <RecentAdCard
                    key={listing.id}
                    ad={{
                      title: listing.title,
                      price: listing.pricingLabel,
                      description: listing.description,
                      locationLabel: listing.location,
                      deliveryLabel: listing.deliveryLabel,
                      category:
                        categories.find((item) => item.slug === listing.categorySlug)?.name ??
                        "Listing",
                      subcategory: listing.serviceCategory,
                      href: `/listings/${listing.slug}`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
