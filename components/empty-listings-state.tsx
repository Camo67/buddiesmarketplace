import Link from "next/link";
import { Inbox, PlusCircle } from "lucide-react";

type EmptyListingsStateProps = {
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
};

export function EmptyListingsState({
  title,
  description,
  ctaHref = "/signup",
  ctaLabel = "Post the first listing",
}: EmptyListingsStateProps) {
  return (
    <div className="soft-card rounded-[2rem] p-8 text-center md:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(46,139,87,0.1)] text-[var(--accent-2)]">
        <Inbox size={28} />
      </div>
      <h3 className="mt-5 font-serif text-3xl leading-tight">{title}</h3>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-soft)]">
        {description}
      </p>
      <Link
        href={ctaHref}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-bold text-white"
      >
        <PlusCircle size={16} />
        {ctaLabel}
      </Link>
    </div>
  );
}
