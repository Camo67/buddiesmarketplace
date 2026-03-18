import Link from "next/link";
import type { Category } from "@/lib/marketplace-data";

export function CategoryCard({ category }: { category: Category }) {
  const Icon = category.icon;

  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group soft-card relative overflow-hidden rounded-[2rem] p-5 transition duration-300 hover:-translate-y-1"
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${category.tone}`}
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            {category.count.toLocaleString()} listings
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight">{category.name}</h3>
          {category.restrictionLabel ? (
            <span className="mt-3 inline-flex rounded-full border border-[rgba(242,140,40,0.22)] bg-[rgba(242,140,40,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#c96c27]">
              {category.restrictionLabel}
            </span>
          ) : null}
        </div>
        <div
          className={`rounded-2xl bg-gradient-to-br p-3 text-white shadow-lg ${category.tone}`}
        >
          <Icon size={24} />
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-[var(--ink-soft)]">
        {category.description}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {category.examples.map((example) => (
          <span
            key={example}
            className="rounded-full border border-[var(--line)] bg-white/70 px-3 py-1 text-xs font-medium text-[var(--foreground)]"
          >
            {example}
          </span>
        ))}
      </div>
    </Link>
  );
}
