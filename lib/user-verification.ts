export const verificationStatuses = [
  "unsubmitted",
  "submitted",
  "verified",
  "changes_requested",
] as const;

export type VerificationStatus = (typeof verificationStatuses)[number];

export const verificationStatusLabels: Record<VerificationStatus, string> = {
  unsubmitted: "Docs not submitted",
  submitted: "Waiting for review",
  verified: "Verified for trading",
  changes_requested: "Needs resubmission",
};

export function isVerificationStatus(value: string): value is VerificationStatus {
  return verificationStatuses.includes(value as VerificationStatus);
}

export function canMarketplaceUserTrade(status: VerificationStatus | null | undefined) {
  return status === "verified";
}
