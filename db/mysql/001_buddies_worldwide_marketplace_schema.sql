-- Buddies Worldwide
-- Canonical MySQL marketplace schema for the future Fastify service layer.
-- Date: 2026-03-26
--
-- Notes:
-- 1. Supabase Auth remains the source of truth for credentials and user identity.
-- 2. Legacy marketplace_* runtime tables are intentionally untouched by this file.
-- 3. Marketplace-owned entities use BIGINT UNSIGNED keys; direct user references use CHAR(36).
-- 4. Orders, shipments, and verifiable credentials are schema-only preparation in this phase.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL COMMENT 'Matches Supabase auth.users.id',
  email VARCHAR(255) NOT NULL,
  role ENUM('user', 'moderator', 'admin') NOT NULL DEFAULT 'user',
  account_status ENUM('active', 'restricted', 'suspended', 'deleted') NOT NULL DEFAULT 'active',
  email_precheck_signal_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_status_created (role, account_status, created_at),
  KEY idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id CHAR(36) NOT NULL,
  first_name VARCHAR(120) NULL,
  last_name VARCHAR(120) NULL,
  display_name VARCHAR(160) NULL,
  business_name VARCHAR(180) NULL,
  phone_number VARCHAR(32) NULL,
  avatar_url VARCHAR(2048) NULL,
  province VARCHAR(80) NULL,
  city VARCHAR(120) NULL,
  trust_level ENUM('unverified', 'email_checked', 'identity_submitted', 'verified', 'trusted_merchant') NOT NULL DEFAULT 'unverified',
  trust_score SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_fica_verified TINYINT(1) NOT NULL DEFAULT 0,
  fica_verified_at TIMESTAMP NULL DEFAULT NULL,
  did_uri VARCHAR(255) NULL,
  public_profile_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_profiles_user_id (user_id),
  KEY idx_profiles_phone_number (phone_number),
  KEY idx_profiles_trust_level_score (trust_level, trust_score),
  KEY idx_profiles_is_fica_verified (is_fica_verified),
  CONSTRAINT fk_profiles_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS verifiable_credentials (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id CHAR(36) NOT NULL,
  credential_type VARCHAR(120) NOT NULL,
  issuer_name VARCHAR(180) NOT NULL,
  issuer_did VARCHAR(255) NULL,
  subject_did VARCHAR(255) NULL,
  credential_reference VARCHAR(255) NOT NULL,
  credential_hash CHAR(64) NULL,
  status ENUM('pending', 'active', 'revoked', 'expired') NOT NULL DEFAULT 'pending',
  credential_metadata_json JSON NULL,
  issued_at TIMESTAMP NULL DEFAULT NULL,
  revoked_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_verifiable_credentials_user_status_issued (user_id, status, issued_at),
  KEY idx_verifiable_credentials_reference (credential_reference),
  CONSTRAINT fk_verifiable_credentials_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS verification_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id CHAR(36) NOT NULL,
  verification_type ENUM('identity_document', 'proof_of_address', 'liveness', 'business_registration', 'manual_review') NOT NULL DEFAULT 'identity_document',
  document_front_storage_key VARCHAR(255) NULL,
  document_front_url VARCHAR(2048) NULL,
  document_back_storage_key VARCHAR(255) NULL,
  document_back_url VARCHAR(2048) NULL,
  selfie_storage_key VARCHAR(255) NULL,
  selfie_url VARCHAR(2048) NULL,
  proof_of_address_storage_key VARCHAR(255) NULL,
  proof_of_address_url VARCHAR(2048) NULL,
  status ENUM('pending', 'under_review', 'approved', 'rejected', 'changes_requested') NOT NULL DEFAULT 'pending',
  reviewed_by_user_id CHAR(36) NULL,
  submission_notes TEXT NULL,
  review_notes TEXT NULL,
  provider_payload_json JSON NULL,
  risk_signals_json JSON NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_verification_requests_user_status (user_id, status),
  KEY idx_verification_requests_status_submitted (status, submitted_at),
  KEY idx_verification_requests_reviewer (reviewed_by_user_id),
  CONSTRAINT fk_verification_requests_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_verification_requests_reviewer
    FOREIGN KEY (reviewed_by_user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS listing_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  parent_id BIGINT UNSIGNED NULL,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(160) NOT NULL,
  description VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_listing_categories_slug (slug),
  KEY idx_listing_categories_parent_id (parent_id),
  KEY idx_listing_categories_active_sort (is_active, sort_order, name),
  CONSTRAINT fk_listing_categories_parent
    FOREIGN KEY (parent_id) REFERENCES listing_categories (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS listings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  seller_id CHAR(36) NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  slug VARCHAR(180) NOT NULL,
  listing_kind ENUM('product', 'service') NOT NULL DEFAULT 'product',
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price_amount DECIMAL(12,2) NULL,
  currency_code CHAR(3) NOT NULL DEFAULT 'ZAR',
  condition_grade ENUM('new', 'like_new', 'good', 'fair', 'salvage') NOT NULL DEFAULT 'good',
  province VARCHAR(80) NULL,
  city VARCHAR(120) NULL,
  delivery_method ENUM('collection', 'courier', 'paxi', 'pudo', 'bob_box', 'local_meetup') NOT NULL DEFAULT 'collection',
  status ENUM('draft', 'pending_review', 'active', 'reserved', 'sold', 'archived', 'rejected') NOT NULL DEFAULT 'draft',
  moderation_status ENUM('pending', 'in_review', 'approved', 'changes_requested', 'rejected') NOT NULL DEFAULT 'pending',
  moderation_notes TEXT NULL,
  turnstile_passed_at TIMESTAMP NULL DEFAULT NULL,
  bot_signal_json JSON NULL,
  published_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_listings_slug (slug),
  KEY idx_listings_seller_status_created (seller_id, status, created_at),
  KEY idx_listings_category_status_created (category_id, status, created_at),
  KEY idx_listings_status_published (status, published_at),
  KEY idx_listings_moderation_status_created (moderation_status, created_at),
  FULLTEXT KEY ftx_listings_title_description (title, description),
  CONSTRAINT fk_listings_seller
    FOREIGN KEY (seller_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_listings_category
    FOREIGN KEY (category_id) REFERENCES listing_categories (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS listing_images (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  listing_id BIGINT UNSIGNED NOT NULL,
  storage_key VARCHAR(255) NOT NULL,
  public_url VARCHAR(2048) NOT NULL,
  mime_type VARCHAR(120) NULL,
  file_size_bytes BIGINT UNSIGNED NULL,
  width_px INT UNSIGNED NULL,
  height_px INT UNSIGNED NULL,
  alt_text VARCHAR(255) NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_listing_images_listing_primary_sort (listing_id, is_primary, sort_order, id),
  CONSTRAINT fk_listing_images_listing
    FOREIGN KEY (listing_id) REFERENCES listings (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS favorites (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id CHAR(36) NOT NULL,
  listing_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_favorites_user_listing (user_id, listing_id),
  KEY idx_favorites_user_created (user_id, created_at),
  KEY idx_favorites_listing_created (listing_id, created_at),
  CONSTRAINT fk_favorites_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_favorites_listing
    FOREIGN KEY (listing_id) REFERENCES listings (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conversations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  listing_id BIGINT UNSIGNED NULL,
  buyer_id CHAR(36) NOT NULL,
  seller_id CHAR(36) NOT NULL,
  started_by_user_id CHAR(36) NULL,
  status ENUM('open', 'archived', 'blocked', 'closed') NOT NULL DEFAULT 'open',
  last_message_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_conversations_listing_buyer_seller (listing_id, buyer_id, seller_id),
  KEY idx_conversations_buyer_last_message (buyer_id, last_message_at),
  KEY idx_conversations_seller_last_message (seller_id, last_message_at),
  KEY idx_conversations_listing_status (listing_id, status),
  KEY idx_conversations_started_by_user (started_by_user_id),
  CONSTRAINT fk_conversations_listing
    FOREIGN KEY (listing_id) REFERENCES listings (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_conversations_buyer
    FOREIGN KEY (buyer_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_conversations_seller
    FOREIGN KEY (seller_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_conversations_started_by_user
    FOREIGN KEY (started_by_user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  conversation_id BIGINT UNSIGNED NOT NULL,
  sender_id CHAR(36) NOT NULL,
  message_type ENUM('text', 'image', 'offer', 'system') NOT NULL DEFAULT 'text',
  body_text TEXT NULL,
  attachment_storage_key VARCHAR(255) NULL,
  attachment_url VARCHAR(2048) NULL,
  moderation_status ENUM('visible', 'flagged', 'hidden', 'deleted') NOT NULL DEFAULT 'visible',
  message_metadata_json JSON NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_messages_conversation_sent (conversation_id, sent_at),
  KEY idx_messages_sender_sent (sender_id, sent_at),
  KEY idx_messages_moderation_status_sent (moderation_status, sent_at),
  CONSTRAINT fk_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender
    FOREIGN KEY (sender_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  reference VARCHAR(120) NOT NULL,
  listing_id BIGINT UNSIGNED NOT NULL,
  buyer_id CHAR(36) NOT NULL,
  seller_id CHAR(36) NOT NULL,
  agreed_price_amount DECIMAL(12,2) NOT NULL,
  currency_code CHAR(3) NOT NULL DEFAULT 'ZAR',
  delivery_method ENUM('collection', 'courier', 'paxi', 'pudo', 'bob_box', 'local_meetup') NOT NULL DEFAULT 'courier',
  status ENUM('initiated', 'awaiting_payment', 'funds_secured', 'shipped', 'delivered', 'completed', 'cancelled', 'disputed') NOT NULL DEFAULT 'initiated',
  payment_status ENUM('not_started', 'pending', 'secured', 'released', 'refunded') NOT NULL DEFAULT 'not_started',
  funds_secured_at TIMESTAMP NULL DEFAULT NULL,
  delivered_at TIMESTAMP NULL DEFAULT NULL,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_reference (reference),
  KEY idx_orders_listing_created (listing_id, created_at),
  KEY idx_orders_buyer_created (buyer_id, created_at),
  KEY idx_orders_seller_created (seller_id, created_at),
  KEY idx_orders_status_created (status, created_at),
  CONSTRAINT fk_orders_listing
    FOREIGN KEY (listing_id) REFERENCES listings (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_orders_buyer
    FOREIGN KEY (buyer_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_orders_seller
    FOREIGN KEY (seller_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shipments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  courier_name VARCHAR(120) NOT NULL,
  service_code VARCHAR(64) NULL,
  tracking_number VARCHAR(120) NULL,
  tracking_url VARCHAR(2048) NULL,
  status ENUM('pending', 'label_created', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'exception') NOT NULL DEFAULT 'pending',
  provider_payload_json JSON NULL,
  shipped_at TIMESTAMP NULL DEFAULT NULL,
  delivered_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_shipments_order_id (order_id),
  KEY idx_shipments_courier_tracking (courier_name, tracking_number),
  KEY idx_shipments_status_created (status, created_at),
  CONSTRAINT fk_shipments_order
    FOREIGN KEY (order_id) REFERENCES orders (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ratings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  reviewer_id CHAR(36) NOT NULL,
  reviewee_id CHAR(36) NOT NULL,
  score TINYINT UNSIGNED NOT NULL,
  comment TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ratings_order_reviewer (order_id, reviewer_id),
  KEY idx_ratings_reviewee_created (reviewee_id, created_at),
  CONSTRAINT fk_ratings_order
    FOREIGN KEY (order_id) REFERENCES orders (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_ratings_reviewer
    FOREIGN KEY (reviewer_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_ratings_reviewee
    FOREIGN KEY (reviewee_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  reporter_id CHAR(36) NOT NULL,
  reported_user_id CHAR(36) NULL,
  listing_id BIGINT UNSIGNED NULL,
  message_id BIGINT UNSIGNED NULL,
  order_id BIGINT UNSIGNED NULL,
  reason_code VARCHAR(80) NOT NULL,
  details TEXT NULL,
  status ENUM('open', 'triaged', 'resolved', 'rejected') NOT NULL DEFAULT 'open',
  assigned_moderator_id CHAR(36) NULL,
  resolution_notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_reports_status_created (status, created_at),
  KEY idx_reports_assigned_status (assigned_moderator_id, status),
  KEY idx_reports_reporter_created (reporter_id, created_at),
  KEY idx_reports_listing_id (listing_id),
  KEY idx_reports_message_id (message_id),
  KEY idx_reports_order_id (order_id),
  KEY idx_reports_reported_user_id (reported_user_id),
  CONSTRAINT fk_reports_reporter
    FOREIGN KEY (reporter_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_reports_reported_user
    FOREIGN KEY (reported_user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_reports_listing
    FOREIGN KEY (listing_id) REFERENCES listings (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_reports_message
    FOREIGN KEY (message_id) REFERENCES messages (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_reports_order
    FOREIGN KEY (order_id) REFERENCES orders (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_reports_assigned_moderator
    FOREIGN KEY (assigned_moderator_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_actions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_user_id CHAR(36) NOT NULL,
  target_type VARCHAR(64) NOT NULL,
  target_id VARCHAR(64) NOT NULL,
  action_type VARCHAR(64) NOT NULL,
  notes TEXT NULL,
  metadata_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_admin_actions_admin_created (admin_user_id, created_at),
  KEY idx_admin_actions_target_lookup (target_type, target_id, created_at),
  CONSTRAINT fk_admin_actions_admin_user
    FOREIGN KEY (admin_user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Operational notes:
-- 1. Marketplace-owned IDs are internal relational keys only; public APIs should continue to prefer slugs and references.
-- 2. A listing should only be publicly visible when moderation_status = 'approved' and status = 'active'.
-- 3. At least one reports target must be enforced in the API layer, not in this SQL file.
-- 4. This schema does not implement live payment capture, automated escrow, or direct Supabase data access.
