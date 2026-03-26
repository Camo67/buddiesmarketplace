import Link from "next/link";
import { Inbox, PlusCircle } from "lucide-react";
import { StatusPill } from "@/components/status-pill";

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
      <StatusPill tone="info" className="mx-auto">
        Trust-led marketplace
      </StatusPill>
      <div className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(0,127,255,0.08)] text-[var(--trust)]">
        <Inbox size={28} />
      </div>
      <h3 className="mt-5 font-serif text-3xl leading-tight tracking-[-0.04em]">{title}</h3>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-soft)]">
        {description}
      </p>
      <Link
        href={ctaHref}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(255,127,80,0.22)]"
      >
        <PlusCircle size={16} />
        {ctaLabel}
      </Link>
    </div>
  );
}
