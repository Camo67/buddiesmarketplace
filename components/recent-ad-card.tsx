import Link from "next/link";
import { ArrowRight, MapPin, ShieldCheck, Truck } from "lucide-react";
import { StatusPill } from "@/components/status-pill";

type ListingPreview = {
  title: string;
  price: string;
  description: string;
  locationLabel: string;
  deliveryLabel?: string;
  category: string;
  subcategory: string;
  href?: string;
};

export function RecentAdCard({ ad }: { ad: ListingPreview }) {
  const content = (
    <article className="soft-card rounded-[1.9rem] p-5 transition duration-300 hover:-translate-y-1">
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px] md:items-start">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            {ad.category} / {ad.subcategory}
          </p>
          <h3 className="mt-2 break-words font-serif text-[1.65rem] font-bold tracking-[-0.04em] text-[var(--foreground)]">
            {ad.title}
          </h3>
          <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">{ad.description}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            <StatusPill tone="success" size="sm" icon={<ShieldCheck size={14} />}>
              Reviewed
            </StatusPill>
            <StatusPill tone="info" size="sm">
              South Africa listing
            </StatusPill>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--background-alt)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            Starting price
          </p>
          <p className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[var(--foreground)]">
            {ad.price}
          </p>

          <div className="mt-4 space-y-3 text-sm text-[var(--ink-soft)]">
            <span className="inline-flex items-center gap-2">
              <MapPin size={16} />
              {ad.locationLabel}
            </span>
            {ad.deliveryLabel ? (
              <span className="inline-flex items-center gap-2">
                <Truck size={16} />
                {ad.deliveryLabel}
              </span>
            ) : null}
          </div>

          <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
            View details
            <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </article>
  );

  if (ad.href) {
    return <Link href={ad.href}>{content}</Link>;
  }

  return content;
}
