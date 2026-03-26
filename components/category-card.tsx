import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusPill } from "@/components/status-pill";
import type { Category } from "@/lib/marketplace-data";

export function CategoryCard({ category }: { category: Category }) {
  const Icon = category.icon;

  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group soft-card relative overflow-hidden rounded-[2rem] p-6 transition duration-300 hover:-translate-y-1"
    >
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${category.tone}`} />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            {category.count.toLocaleString()} listings
          </p>
          <h3 className="mt-2 break-words font-serif text-[1.7rem] font-bold tracking-[-0.04em] text-[var(--foreground)]">
            {category.name}
          </h3>
          {category.restrictionLabel ? (
            <StatusPill tone="accent" size="sm" className="mt-3">
              {category.restrictionLabel}
            </StatusPill>
          ) : null}
        </div>
        <div
          className={`rounded-[1.4rem] bg-gradient-to-br p-3.5 text-white shadow-[0_18px_40px_rgba(0,35,102,0.18)] ${category.tone}`}
        >
          <Icon size={24} />
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">{category.description}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {category.examples.map((example) => (
          <span
            key={example}
            className="rounded-full border border-[var(--line)] bg-[var(--background-alt)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]"
          >
            {example}
          </span>
        ))}
      </div>

      <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
        Explore category
        <ArrowRight size={16} className="transition duration-300 group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
