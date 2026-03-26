import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "./mysql";
import {
  calculateTrustScore,
  type TrustLevel,
  type TrustScoreBreakdown,
} from "./trust-score";

type PublicProfileBaseRow = RowDataPacket & {
  user_id: string;
  email: string;
  role: string;
  account_status: string;
  user_created_at: string;
  profile_id: number | null;
  display_name: string | null;
  business_name: string | null;
  avatar_url: string | null;
  province: string | null;
  city: string | null;
  trust_level: string | null;
  trust_score: number | null;
  is_fica_verified: number | null;
  profile_created_at: string | null;
  profile_updated_at: string | null;
};

type PublicProfileStatsRow = RowDataPacket & {
  approved_listings_count: number;
  seller_completed_orders_count: number;
  buyer_completed_orders_count: number;
  verified_seller_deliveries_count: number;
  active_credentials_count: number;
  rating_count: number;
  average_rating: number | string | null;
};

export type PublicUserProfile = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
  province: string | null;
  locationLabel: string;
  memberSince: string;
  trustLevel: string;
  trustScore: number;
  trustBand: TrustScoreBreakdown["band"];
  isFicaVerified: boolean;
  summary: string;
  stats: {
    approvedListingsCount: number;
    sellerCompletedOrdersCount: number;
    buyerCompletedOrdersCount: number;
    verifiedSellerDeliveriesCount: number;
    activeCredentialsCount: number;
    ratingCount: number;
    averageRating: number | null;
  };
  trustBreakdown: TrustScoreBreakdown;
};

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeDateTime(value: string | Date | null) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
}

function numberValue(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function nullableNumberValue(value: number | string | null | undefined) {
  if (value == null) {
    return null;
  }

  const parsed = numberValue(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatLocationLabel(city: string | null, province: string | null) {
  const parts = [stringValue(city), stringValue(province)].filter(Boolean);

  if (parts.length === 0) {
    return "South Africa";
  }

  return parts.join(", ");
}

function normalizeTrustLevel(value: string | null): Exclude<TrustLevel, null | undefined> {
  switch (value) {
    case "email_checked":
    case "identity_submitted":
    case "verified":
    case "trusted_merchant":
    case "unverified":
      return value;
    default:
      return "unverified";
  }
}

function buildPublicSummary(profile: {
  displayName: string;
  verifiedSellerDeliveriesCount: number;
  approvedListingsCount: number;
  band: TrustScoreBreakdown["band"];
}) {
  const listingSummary =
    profile.approvedListingsCount > 0
      ? `${profile.approvedListingsCount} approved marketplace listing${profile.approvedListingsCount === 1 ? "" : "s"}`
      : "No approved public listings yet";
  const deliverySummary =
    profile.verifiedSellerDeliveriesCount > 0
      ? `${profile.verifiedSellerDeliveriesCount} courier-confirmed seller deliver${profile.verifiedSellerDeliveriesCount === 1 ? "y" : "ies"} recorded`
      : "Courier-confirmed deliveries will appear here once trading starts";

  return `${profile.displayName} is ${profile.band.label.toLowerCase()}. ${listingSummary}. ${deliverySummary}.`;
}

export function isPublicProfileUserId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function loadPublicProfileBase(connection: PoolConnection, userId: string) {
  const [rows] = await connection.query<PublicProfileBaseRow[]>(
    `
      SELECT
        u.id AS user_id,
        u.email,
        u.role,
        u.account_status,
        u.created_at AS user_created_at,
        p.id AS profile_id,
        p.display_name,
        p.business_name,
        p.avatar_url,
        p.province,
        p.city,
        p.trust_level,
        p.trust_score,
        p.is_fica_verified,
        p.created_at AS profile_created_at,
        p.updated_at AS profile_updated_at
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = ?
      LIMIT 1
    `,
    [userId],
  );

  return rows[0] ?? null;
}

async function loadPublicProfileStats(connection: PoolConnection, userId: string) {
  const [rows] = await connection.query<PublicProfileStatsRow[]>(
    `
      SELECT
        (
          SELECT COUNT(*)
          FROM listings l
          WHERE l.seller_id = ?
            AND l.moderation_status = 'approved'
            AND l.status IN ('active', 'reserved', 'sold')
        ) AS approved_listings_count,
        (
          SELECT COUNT(*)
          FROM orders o
          INNER JOIN shipments s ON s.order_id = o.id
          WHERE o.seller_id = ?
            AND o.status = 'completed'
            AND s.status = 'delivered'
        ) AS seller_completed_orders_count,
        (
          SELECT COUNT(*)
          FROM orders o
          INNER JOIN shipments s ON s.order_id = o.id
          WHERE o.buyer_id = ?
            AND o.status = 'completed'
            AND s.status = 'delivered'
        ) AS buyer_completed_orders_count,
        (
          SELECT COUNT(*)
          FROM orders o
          INNER JOIN shipments s ON s.order_id = o.id
          WHERE o.seller_id = ?
            AND o.status IN ('delivered', 'completed')
            AND s.status = 'delivered'
        ) AS verified_seller_deliveries_count,
        (
          SELECT COUNT(*)
          FROM verifiable_credentials vc
          WHERE vc.user_id = ?
            AND vc.status = 'active'
        ) AS active_credentials_count,
        (
          SELECT COUNT(*)
          FROM ratings r
          WHERE r.reviewee_id = ?
        ) AS rating_count,
        (
          SELECT AVG(r.score)
          FROM ratings r
          WHERE r.reviewee_id = ?
        ) AS average_rating
    `,
    [userId, userId, userId, userId, userId, userId, userId],
  );

  return rows[0];
}

export async function getPublicCanonicalProfileById(
  userId: string,
  options: {
    refreshTrustScore?: boolean;
  } = {},
): Promise<PublicUserProfile | null> {
  const connection = await getMysqlPool().getConnection();

  try {
    const base = await loadPublicProfileBase(connection, userId);

    if (!base) {
      return null;
    }

    const stats = await loadPublicProfileStats(connection, userId);
    const displayName =
      stringValue(base.business_name) ??
      stringValue(base.display_name) ??
      "Buddies marketplace member";
    const trustBreakdown = calculateTrustScore({
      trustLevel: normalizeTrustLevel(base.trust_level),
      isFicaVerified: Boolean(base.is_fica_verified),
      sellerCompletedOrdersCount: numberValue(stats.seller_completed_orders_count),
      buyerCompletedOrdersCount: numberValue(stats.buyer_completed_orders_count),
      verifiedSellerDeliveriesCount: numberValue(stats.verified_seller_deliveries_count),
      activeCredentialsCount: numberValue(stats.active_credentials_count),
      ratingCount: numberValue(stats.rating_count),
      averageRating: nullableNumberValue(stats.average_rating),
    });

    if (options.refreshTrustScore !== false && base.profile_id != null) {
      await connection.execute(
        `
          UPDATE profiles
          SET trust_score = ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `,
        [trustBreakdown.score, userId],
      );
    }

    const profile: PublicUserProfile = {
      userId: base.user_id,
      displayName,
      avatarUrl: stringValue(base.avatar_url),
      city: stringValue(base.city),
      province: stringValue(base.province),
      locationLabel: formatLocationLabel(stringValue(base.city), stringValue(base.province)),
      memberSince:
        normalizeDateTime(base.profile_created_at ?? base.user_created_at) ??
        new Date(0).toISOString(),
      trustLevel: String(normalizeTrustLevel(base.trust_level)),
      trustScore: trustBreakdown.score,
      trustBand: trustBreakdown.band,
      isFicaVerified: Boolean(base.is_fica_verified),
      summary: buildPublicSummary({
        displayName,
        approvedListingsCount: numberValue(stats.approved_listings_count),
        verifiedSellerDeliveriesCount: numberValue(stats.verified_seller_deliveries_count),
        band: trustBreakdown.band,
      }),
      stats: {
        approvedListingsCount: numberValue(stats.approved_listings_count),
        sellerCompletedOrdersCount: numberValue(stats.seller_completed_orders_count),
        buyerCompletedOrdersCount: numberValue(stats.buyer_completed_orders_count),
        verifiedSellerDeliveriesCount: numberValue(stats.verified_seller_deliveries_count),
        activeCredentialsCount: numberValue(stats.active_credentials_count),
        ratingCount: numberValue(stats.rating_count),
        averageRating: nullableNumberValue(stats.average_rating),
      },
      trustBreakdown,
    };

    return profile;
  } finally {
    connection.release();
  }
}
