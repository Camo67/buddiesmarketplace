import Link from "next/link";
import { MapPin, ShieldCheck, Truck } from "lucide-react";

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
    <article className="soft-card rounded-[1.8rem] p-5 transition duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            {ad.category} / {ad.subcategory}
          </p>
          <h3 className="mt-2 text-xl font-bold tracking-tight">{ad.title}</h3>
        </div>
        <div className="rounded-full bg-[rgba(46,139,87,0.12)] px-3 py-1 text-sm font-bold text-[var(--accent-2)]">
          {ad.price}
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-[var(--ink-soft)]">
        {ad.description}
      </p>

      <div className="mt-5 flex flex-wrap gap-3 text-sm text-[var(--ink-soft)]">
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
        <span className="inline-flex items-center gap-2">
          <ShieldCheck size={16} />
          Moderator approved
        </span>
      </div>
    </article>
  );

  if (ad.href) {
    return <Link href={ad.href}>{content}</Link>;
  }

  return content;
}
