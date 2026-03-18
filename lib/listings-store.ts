import { randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "@/lib/mysql";
import { isListingStatus, type ListingStatus } from "@/lib/moderation";
import {
  buildDeliveryLabel,
  isDeliveryMethod,
  isPaxiServiceWindow,
  type DeliveryMethod,
  type PaxiServiceWindow,
} from "@/lib/paxi";

export type ListingType = "service";
export type PricingMethod = "fixed" | "hourly" | "custom";

export type Listing = {
  id: string;
  slug: string;
  type: ListingType;
  ownerUserId: string | null;
  ownerDisplayName: string | null;
  categorySlug: string;
  serviceCategory: string;
  title: string;
  tagline: string;
  description: string;
  pricingMethod: PricingMethod;
  pricingLabel: string;
  location: string;
  deliveryMethod: DeliveryMethod;
  deliveryLabel: string;
  paxiServiceWindow: PaxiServiceWindow | null;
  contactLink: string;
  safetyNote: string;
  reviewStatus: ListingStatus;
  moderationNote: string | null;
  moderatedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type CreateServiceListingInput = {
  owner: {
    userId: string;
    displayName?: string | null;
  };
  category: string;
  title: string;
  tagline: string;
  description: string;
  pricing: {
    method: PricingMethod;
    label: string;
  };
  location: string;
  delivery: {
    method: DeliveryMethod;
    paxiServiceWindow?: PaxiServiceWindow | null;
  };
  contactLink: string;
};

export type UpdateListingModerationInput = {
  status: ListingStatus;
  moderationNote?: string;
  moderatedBy?: string;
};

type ListingRow = RowDataPacket & {
  id: string;
  slug: string;
  type: ListingType;
  owner_user_id: string | null;
  owner_display_name: string | null;
  category_slug: string;
  service_category: string;
  title: string;
  tagline: string;
  description: string;
  pricing_method: PricingMethod;
  pricing_label: string;
  location: string;
  delivery_method: DeliveryMethod;
  delivery_label: string;
  paxi_service_window: PaxiServiceWindow | null;
  contact_link: string;
  safety_note: string;
  review_status: ListingStatus;
  moderation_note: string | null;
  moderated_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

let listingsTableReady: Promise<void> | null = null;

async function ensureColumnExists(
  columnName: string,
  definition: string,
) {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SHOW COLUMNS FROM marketplace_listings LIKE ?",
    [columnName],
  );

  if (rows.length === 0) {
    await pool.execute(`ALTER TABLE marketplace_listings ADD COLUMN ${definition}`);
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeDateTime(value: string | null) {
  if (!value) {
    return null;
  }

  if (value.includes("T")) {
    return value;
  }

  return `${value.replace(" ", "T")}Z`;
}

function mapRowToListing(row: ListingRow): Listing {
  return {
    id: row.id,
    slug: row.slug,
    type: row.type,
    ownerUserId: row.owner_user_id,
    ownerDisplayName: row.owner_display_name,
    categorySlug: row.category_slug,
    serviceCategory: row.service_category,
    title: row.title,
    tagline: row.tagline,
    description: row.description,
    pricingMethod: row.pricing_method,
    pricingLabel: row.pricing_label,
    location: row.location,
    deliveryMethod: row.delivery_method,
    deliveryLabel: row.delivery_label,
    paxiServiceWindow: row.paxi_service_window,
    contactLink: row.contact_link,
    safetyNote: row.safety_note,
    reviewStatus: row.review_status,
    moderationNote: row.moderation_note,
    moderatedBy: row.moderated_by,
    reviewedAt: normalizeDateTime(row.reviewed_at),
    createdAt: normalizeDateTime(row.created_at) ?? new Date(0).toISOString(),
  };
}

async function ensureListingsTable() {
  if (!listingsTableReady) {
    listingsTableReady = (async () => {
      const pool = getMysqlPool();

      await pool.execute(`
        CREATE TABLE IF NOT EXISTS marketplace_listings (
          id CHAR(36) NOT NULL PRIMARY KEY,
          slug VARCHAR(120) NOT NULL UNIQUE,
          type VARCHAR(32) NOT NULL,
          owner_user_id CHAR(36) NULL,
          owner_display_name VARCHAR(255) NULL,
          category_slug VARCHAR(64) NOT NULL,
          service_category VARCHAR(120) NOT NULL,
          title VARCHAR(255) NOT NULL,
          tagline VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          pricing_method VARCHAR(32) NOT NULL,
          pricing_label VARCHAR(120) NOT NULL,
          location VARCHAR(255) NOT NULL,
          delivery_method VARCHAR(32) NOT NULL DEFAULT 'contact_only',
          delivery_label VARCHAR(255) NOT NULL DEFAULT 'Arrange directly with seller',
          paxi_service_window VARCHAR(32) NULL,
          contact_link VARCHAR(512) NOT NULL,
          safety_note TEXT NOT NULL,
          review_status VARCHAR(32) NOT NULL,
          moderation_note TEXT NULL,
          moderated_by VARCHAR(120) NULL,
          reviewed_at TIMESTAMP NULL DEFAULT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          KEY idx_marketplace_listings_category_created (category_slug, created_at),
          KEY idx_marketplace_listings_review_status_created (review_status, created_at),
          KEY idx_marketplace_listings_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await ensureColumnExists("owner_user_id", "owner_user_id CHAR(36) NULL");
      await ensureColumnExists(
        "owner_display_name",
        "owner_display_name VARCHAR(255) NULL",
      );
      await ensureColumnExists(
        "review_status",
        "review_status VARCHAR(32) NOT NULL DEFAULT 'approved'",
      );
      await ensureColumnExists("moderation_note", "moderation_note TEXT NULL");
      await ensureColumnExists("moderated_by", "moderated_by VARCHAR(120) NULL");
      await ensureColumnExists(
        "reviewed_at",
        "reviewed_at TIMESTAMP NULL DEFAULT NULL",
      );
      await ensureColumnExists(
        "delivery_method",
        "delivery_method VARCHAR(32) NOT NULL DEFAULT 'contact_only'",
      );
      await ensureColumnExists(
        "delivery_label",
        "delivery_label VARCHAR(255) NOT NULL DEFAULT 'Arrange directly with seller'",
      );
      await ensureColumnExists(
        "paxi_service_window",
        "paxi_service_window VARCHAR(32) NULL",
      );

      await pool.execute(
        "UPDATE marketplace_listings SET review_status = 'approved' WHERE review_status IS NULL OR review_status = ''",
      );
      await pool.execute(
        "UPDATE marketplace_listings SET delivery_label = 'Arrange directly with seller' WHERE delivery_label IS NULL OR delivery_label = ''",
      );
    })();
  }

  try {
    await listingsTableReady;
  } catch (error) {
    listingsTableReady = null;
    throw error;
  }
}

function validateServiceListingInput(input: CreateServiceListingInput) {
  const missingFields: string[] = [];

  if (!input.owner?.userId?.trim()) missingFields.push("owner.userId");
  if (!input.category?.trim()) missingFields.push("category");
  if (!input.title?.trim()) missingFields.push("title");
  if (!input.tagline?.trim()) missingFields.push("tagline");
  if (!input.description?.trim()) missingFields.push("description");
  if (!input.pricing?.method?.trim()) missingFields.push("pricing.method");
  if (!input.pricing?.label?.trim()) missingFields.push("pricing.label");
  if (!input.location?.trim()) missingFields.push("location");
  if (!input.delivery?.method?.trim()) missingFields.push("delivery.method");
  if (!input.contactLink?.trim()) missingFields.push("contactLink");

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  if (!isDeliveryMethod(input.delivery.method)) {
    throw new Error("Invalid delivery method.");
  }

  if (
    input.delivery.method === "paxi_nationwide" &&
    !input.delivery.paxiServiceWindow
  ) {
    throw new Error("Select a PAXI delivery speed before submitting.");
  }

  if (
    input.delivery.paxiServiceWindow &&
    !isPaxiServiceWindow(input.delivery.paxiServiceWindow)
  ) {
    throw new Error("Invalid PAXI delivery speed.");
  }
}

function validateModerationInput(input: UpdateListingModerationInput) {
  if (!isListingStatus(input.status)) {
    throw new Error("Invalid moderation status.");
  }
}

type ReadListingsOptions = {
  statuses?: ListingStatus[];
  categorySlug?: string;
  limit?: number;
};

function shouldFallbackToEmptyReadResult(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : null;

  if (message.includes("Missing MySQL connection settings")) {
    return true;
  }

  if (code && ["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "EHOSTUNREACH", "ENETUNREACH"].includes(code)) {
    return true;
  }

  return false;
}

function logReadFallback(error: unknown) {
  console.warn("Buddies marketplace data is unavailable for read-only rendering.", error);
}

async function withListingsReadFallback<T>(read: () => Promise<T>, fallbackValue: T) {
  try {
    return await read();
  } catch (error) {
    if (shouldFallbackToEmptyReadResult(error)) {
      logReadFallback(error);
      return fallbackValue;
    }

    throw error;
  }
}

async function queryListings(options: ReadListingsOptions = {}) {
  await ensureListingsTable();
  const pool = getMysqlPool();

  const whereParts: string[] = [];
  const params: Array<string | number> = [];

  if (options.statuses && options.statuses.length > 0) {
    whereParts.push(
      `review_status IN (${options.statuses.map(() => "?").join(", ")})`,
    );
    params.push(...options.statuses);
  }

  if (options.categorySlug) {
    whereParts.push("category_slug = ?");
    params.push(options.categorySlug);
  }

  const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";
  const limitClause = options.limit ? "LIMIT ?" : "";

  if (options.limit) {
    params.push(options.limit);
  }

  const [rows] = await pool.query<ListingRow[]>(
    `
      SELECT
        id,
        slug,
        type,
        owner_user_id,
        owner_display_name,
        category_slug,
        service_category,
        title,
        tagline,
        description,
        pricing_method,
        pricing_label,
        location,
        delivery_method,
        delivery_label,
        paxi_service_window,
        contact_link,
        safety_note,
        review_status,
        moderation_note,
        moderated_by,
        reviewed_at,
        created_at
      FROM marketplace_listings
      ${whereClause}
      ORDER BY created_at DESC
      ${limitClause}
    `,
    params,
  );

  return rows.map(mapRowToListing);
}

export async function readListings() {
  return withListingsReadFallback(() => queryListings(), []);
}

export async function readPublicListings(limit?: number) {
  return withListingsReadFallback(
    () =>
      queryListings({
        statuses: ["approved"],
        limit,
      }),
    [],
  );
}

export async function createServiceListing(input: CreateServiceListingInput) {
  validateServiceListingInput(input);
  await ensureListingsTable();

  const pool = getMysqlPool();
  const id = randomUUID();
  const slugBase = slugify(input.title) || "service-listing";
  const slug = `${slugBase}-${id.slice(0, 8)}`;
  const paxiServiceWindow =
    input.delivery.method === "paxi_nationwide"
      ? input.delivery.paxiServiceWindow ?? null
      : null;
  const deliveryLabel = buildDeliveryLabel(input.delivery.method, paxiServiceWindow);
  const safetyNote =
    input.delivery.method === "paxi_nationwide"
      ? "Confirm payment before dispatch, share the selected PAXI collection point only after the order is agreed, and keep parcel references in writing."
      : "Meet in a public place for in-person work, confirm payment terms clearly, and use traceable delivery or booking methods where possible.";

  await pool.execute(
    `
      INSERT INTO marketplace_listings (
        id,
        slug,
        type,
        owner_user_id,
        owner_display_name,
        category_slug,
        service_category,
        title,
        tagline,
        description,
        pricing_method,
        pricing_label,
        location,
        delivery_method,
        delivery_label,
        paxi_service_window,
        contact_link,
        safety_note,
        review_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      id,
      slug,
      "service",
      input.owner.userId.trim(),
      input.owner.displayName?.trim() || null,
      "services",
      input.category.trim(),
      input.title.trim(),
      input.tagline.trim(),
      input.description.trim(),
      input.pricing.method,
      input.pricing.label.trim(),
      input.location.trim(),
      input.delivery.method,
      deliveryLabel,
      paxiServiceWindow,
      input.contactLink.trim(),
      safetyNote,
      "pending_moderation",
    ],
  );

  const listing = await getListingBySlug(slug);

  if (!listing) {
    throw new Error("Listing was created but could not be read back from MySQL.");
  }

  return listing;
}

export async function updateListingModerationById(
  id: string,
  input: UpdateListingModerationInput,
) {
  validateModerationInput(input);
  await ensureListingsTable();
  const pool = getMysqlPool();

  const moderatedBy = input.moderatedBy?.trim() || "Local Moderator";
  const moderationNote = input.moderationNote?.trim() || null;

  const [result] = await pool.execute<ResultSetHeader>(
    `
      UPDATE marketplace_listings
      SET
        review_status = ?,
        moderation_note = ?,
        moderated_by = ?,
        reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [input.status, moderationNote, moderatedBy, id],
  );

  if (result.affectedRows === 0) {
    throw new Error("Listing not found.");
  }

  return getListingById(id);
}

export async function getListingById(id: string) {
  return withListingsReadFallback(async () => {
    await ensureListingsTable();
    const pool = getMysqlPool();
    const [rows] = await pool.query<ListingRow[]>(
      `
        SELECT
          id,
          slug,
          type,
          owner_user_id,
          owner_display_name,
          category_slug,
          service_category,
          title,
          tagline,
          description,
          pricing_method,
          pricing_label,
          location,
          delivery_method,
          delivery_label,
          paxi_service_window,
          contact_link,
          safety_note,
          review_status,
          moderation_note,
          moderated_by,
          reviewed_at,
          created_at
        FROM marketplace_listings
        WHERE id = ?
        LIMIT 1
      `,
      [id],
    );

    return rows[0] ? mapRowToListing(rows[0]) : undefined;
  }, undefined);
}

export async function getListingBySlug(slug: string) {
  return withListingsReadFallback(async () => {
    await ensureListingsTable();
    const pool = getMysqlPool();
    const [rows] = await pool.query<ListingRow[]>(
      `
        SELECT
          id,
          slug,
          type,
          owner_user_id,
          owner_display_name,
          category_slug,
          service_category,
          title,
          tagline,
          description,
          pricing_method,
          pricing_label,
          location,
          delivery_method,
          delivery_label,
          paxi_service_window,
          contact_link,
          safety_note,
          review_status,
          moderation_note,
          moderated_by,
          reviewed_at,
          created_at
        FROM marketplace_listings
        WHERE slug = ?
        LIMIT 1
      `,
      [slug],
    );

    return rows[0] ? mapRowToListing(rows[0]) : undefined;
  }, undefined);
}

export async function getListingsByCategory(
  slug: string,
  options?: { publicOnly?: boolean },
) {
  return withListingsReadFallback(
    () =>
      queryListings({
        categorySlug: slug,
        statuses: options?.publicOnly ? ["approved"] : undefined,
      }),
    [],
  );
}
