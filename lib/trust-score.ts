export type TrustLevel =
  | "unverified"
  | "email_checked"
  | "identity_submitted"
  | "verified"
  | "trusted_merchant"
  | null
  | undefined;

export type TrustScoreRuleId =
  | "identity_verification"
  | "fica_review"
  | "courier_confirmed_deliveries"
  | "completed_trade_history"
  | "verifiable_credentials"
  | "community_ratings";

export type TrustScoreRule = {
  id: TrustScoreRuleId;
  label: string;
  maxPoints: number;
  description: string;
};

export type TrustScoreInput = {
  trustLevel: TrustLevel;
  isFicaVerified: boolean;
  sellerCompletedOrdersCount: number;
  buyerCompletedOrdersCount: number;
  verifiedSellerDeliveriesCount: number;
  activeCredentialsCount: number;
  ratingCount: number;
  averageRating: number | null;
};

export type TrustScoreBreakdownItem = {
  id: TrustScoreRuleId;
  label: string;
  points: number;
  maxPoints: number;
  description: string;
  detail: string;
};

export type TrustScoreBand = {
  id: "new_profile" | "building_trust" | "trusted" | "highly_trusted";
  label: string;
  summary: string;
};

export type TrustScoreBreakdown = {
  score: number;
  band: TrustScoreBand;
  items: TrustScoreBreakdownItem[];
};

export const trustScoreRules: TrustScoreRule[] = [
  {
    id: "identity_verification",
    label: "Identity verification",
    maxPoints: 45,
    description: "Document review and verification status form the base trust score.",
  },
  {
    id: "fica_review",
    label: "FICA review",
    maxPoints: 12,
    description: "Extra points are awarded once higher-assurance identity checks are complete.",
  },
  {
    id: "courier_confirmed_deliveries",
    label: "Courier-confirmed deliveries",
    maxPoints: 24,
    description: "Delivered seller orders increase trust only when logistics records confirm handover.",
  },
  {
    id: "completed_trade_history",
    label: "Completed trade history",
    maxPoints: 12,
    description: "Finished orders count as proof that both sides complete transactions reliably.",
  },
  {
    id: "verifiable_credentials",
    label: "Verifiable credentials",
    maxPoints: 8,
    description: "Active credentials and attestations add portable trust signals over time.",
  },
  {
    id: "community_ratings",
    label: "Community ratings",
    maxPoints: 12,
    description: "Repeat positive feedback improves the score once enough ratings exist.",
  },
];

const trustLevelPoints: Record<Exclude<TrustLevel, null | undefined>, number> = {
  unverified: 0,
  email_checked: 10,
  identity_submitted: 20,
  verified: 35,
  trusted_merchant: 45,
};

const trustBands: TrustScoreBand[] = [
  {
    id: "highly_trusted",
    label: "Highly trusted",
    summary: "Strong verification and completed trade signals are present.",
  },
  {
    id: "trusted",
    label: "Trusted",
    summary: "This profile shows clear proof of identity and dependable trading history.",
  },
  {
    id: "building_trust",
    label: "Building trust",
    summary: "Core onboarding is in place, with room for more completed deliveries and ratings.",
  },
  {
    id: "new_profile",
    label: "New profile",
    summary: "Identity and completed trade signals are still being established.",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function pluralize(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function describeTrustLevel(level: TrustLevel) {
  switch (level) {
    case "email_checked":
      return "Email confirmed";
    case "identity_submitted":
      return "Identity submitted";
    case "verified":
      return "Verified for trading";
    case "trusted_merchant":
      return "Trusted merchant";
    case "unverified":
    default:
      return "Not verified yet";
  }
}

function pointsFromRatings(averageRating: number | null, ratingCount: number) {
  if (averageRating == null || ratingCount < 2) {
    return 0;
  }

  if (averageRating >= 4.8) {
    return 12;
  }

  if (averageRating >= 4.5) {
    return 10;
  }

  if (averageRating >= 4.0) {
    return 8;
  }

  if (averageRating >= 3.5) {
    return 6;
  }

  return 4;
}

function getTrustBand(score: number) {
  if (score >= 80) {
    return trustBands[0];
  }

  if (score >= 60) {
    return trustBands[1];
  }

  if (score >= 35) {
    return trustBands[2];
  }

  return trustBands[3];
}

export function calculateTrustScore(input: TrustScoreInput): TrustScoreBreakdown {
  const normalizedTrustLevel = input.trustLevel ?? "unverified";
  const completedTradeCount = input.sellerCompletedOrdersCount + input.buyerCompletedOrdersCount;
  const ratingDetail =
    input.averageRating != null
      ? `${input.averageRating.toFixed(1)} average across ${pluralize(input.ratingCount, "rating")}`
      : "Not enough ratings yet";

  const items: TrustScoreBreakdownItem[] = trustScoreRules.map((rule) => {
    switch (rule.id) {
      case "identity_verification":
        return {
          ...rule,
          points: trustLevelPoints[normalizedTrustLevel],
          detail: describeTrustLevel(normalizedTrustLevel),
        };
      case "fica_review":
        return {
          ...rule,
          points: input.isFicaVerified ? 12 : 0,
          detail: input.isFicaVerified ? "FICA review completed" : "FICA review pending",
        };
      case "courier_confirmed_deliveries":
        return {
          ...rule,
          points: clamp(input.verifiedSellerDeliveriesCount * 6, 0, rule.maxPoints),
          detail: `${pluralize(input.verifiedSellerDeliveriesCount, "verified seller delivery")} recorded`,
        };
      case "completed_trade_history":
        return {
          ...rule,
          points: clamp(completedTradeCount * 3, 0, rule.maxPoints),
          detail: `${pluralize(completedTradeCount, "completed trade")} recorded`,
        };
      case "verifiable_credentials":
        return {
          ...rule,
          points: clamp(input.activeCredentialsCount * 4, 0, rule.maxPoints),
          detail: `${pluralize(input.activeCredentialsCount, "active credential")} on file`,
        };
      case "community_ratings":
        return {
          ...rule,
          points: pointsFromRatings(input.averageRating, input.ratingCount),
          detail: ratingDetail,
        };
    }
  });

  const score = clamp(
    items.reduce((total, item) => total + item.points, 0),
    0,
    100,
  );

  return {
    score,
    band: getTrustBand(score),
    items,
  };
}
