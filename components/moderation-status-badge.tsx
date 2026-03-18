import { listingStatusLabels, type ListingStatus } from "@/lib/moderation";

const statusStyles: Record<ListingStatus, string> = {
  pending_moderation:
    "border-[rgba(214,156,40,0.2)] bg-[rgba(214,156,40,0.08)] text-[#9a6915]",
  in_review:
    "border-[rgba(24,103,68,0.2)] bg-[rgba(24,103,68,0.08)] text-[#166444]",
  approved:
    "border-[rgba(46,139,87,0.2)] bg-[rgba(46,139,87,0.08)] text-[#217a4d]",
  needs_changes:
    "border-[rgba(242,140,40,0.2)] bg-[rgba(242,140,40,0.08)] text-[#b96a1e]",
  rejected:
    "border-[rgba(201,108,39,0.2)] bg-[rgba(201,108,39,0.08)] text-[#a05821]",
};

export function ModerationStatusBadge({ status }: { status: ListingStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusStyles[status]}`}
    >
      {listingStatusLabels[status]}
    </span>
  );
}
