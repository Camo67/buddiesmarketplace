export const listingStatuses = [
  "pending_moderation",
  "in_review",
  "approved",
  "needs_changes",
  "rejected",
] as const;

export type ListingStatus = (typeof listingStatuses)[number];

export const listingStatusLabels: Record<ListingStatus, string> = {
  pending_moderation: "Pending moderation",
  in_review: "In review",
  approved: "Approved",
  needs_changes: "Needs changes",
  rejected: "Rejected",
};

export const reviewQueueStatuses: ListingStatus[] = [
  "pending_moderation",
  "in_review",
  "needs_changes",
  "approved",
  "rejected",
];

export function isListingStatus(value: string): value is ListingStatus {
  return listingStatuses.includes(value as ListingStatus);
}
