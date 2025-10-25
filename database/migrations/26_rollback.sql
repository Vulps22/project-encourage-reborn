-- Migration Rollback: #26 - Database schema cleanup and optimization
-- Description: Revert all changes - recreate archive tables, convert BIGINT to VARCHAR, revert booleans, drop indexes
-- Date: 2025-10-25
-- Issue: https://github.com/Vulps22/project-encourage-reborn/issues/26
-- WARNING: Archive tables will be recreated EMPTY - no data migration is performed
-- WARNING: Converting BIGINT to VARCHAR may lose special placeholder values

-- =====================================================
-- DROP PERFORMANCE INDEXES
-- =====================================================
-- Remove indexes in reverse order of creation

-- reports table indexes
DROP INDEX IF EXISTS "moderation"."idx_created";
DROP INDEX IF EXISTS "moderation"."idx_server";
DROP INDEX IF EXISTS "moderation"."idx_offender";
DROP INDEX IF EXISTS "moderation"."idx_status";

-- given_questions table indexes
DROP INDEX IF EXISTS "core"."idx_created";
DROP INDEX IF EXISTS "core"."idx_server";
DROP INDEX IF EXISTS "core"."idx_target";
DROP INDEX IF EXISTS "core"."idx_sender";

-- user_questions table indexes
DROP INDEX IF EXISTS "core"."idx_final_result";
DROP INDEX IF EXISTS "core"."idx_type";
DROP INDEX IF EXISTS "core"."idx_created";
DROP INDEX IF EXISTS "core"."idx_question";
DROP INDEX IF EXISTS "core"."idx_server";
DROP INDEX IF EXISTS "core"."idx_user";

-- servers table indexes
DROP INDEX IF EXISTS "core"."idx_deleted";
DROP INDEX IF EXISTS "core"."idx_entitled";
DROP INDEX IF EXISTS "core"."idx_owner";

-- users table indexes
DROP INDEX IF EXISTS "core"."idx_banned";
DROP INDEX IF EXISTS "core"."idx_level_xp";

-- questions table indexes
DROP INDEX IF EXISTS "core"."idx_created";
DROP INDEX IF EXISTS "core"."idx_creator";
DROP INDEX IF EXISTS "core"."idx_server";
DROP INDEX IF EXISTS "core"."idx_type_approved";

-- =====================================================
-- REVERT BOOLEAN FIELDS TO SMALLINT
-- =====================================================
-- Convert BOOLEAN fields back to SMALLINT (0/1)

-- entitlements table
ALTER TABLE "premium"."entitlements"
  ALTER COLUMN "consumed" TYPE SMALLINT USING ("consumed"::INTEGER::SMALLINT),
  ALTER COLUMN "consumed" SET DEFAULT 0,
  ALTER COLUMN "deleted" TYPE SMALLINT USING ("deleted"::INTEGER::SMALLINT),
  ALTER COLUMN "deleted" SET DEFAULT 0;

-- given_questions table
ALTER TABLE "core"."given_questions"
  ALTER COLUMN "skipped" TYPE SMALLINT USING ("skipped"::INTEGER::SMALLINT),
  ALTER COLUMN "skipped" SET DEFAULT 0;

-- user_questions table
ALTER TABLE "core"."user_questions"
  ALTER COLUMN "skipped" TYPE SMALLINT USING ("skipped"::INTEGER::SMALLINT),
  ALTER COLUMN "skipped" SET DEFAULT 0;

-- servers table
ALTER TABLE "core"."servers"
  ALTER COLUMN "is_deleted" TYPE SMALLINT USING ("is_deleted"::INTEGER::SMALLINT),
  ALTER COLUMN "is_deleted" SET DEFAULT 0,
  ALTER COLUMN "is_entitled" TYPE SMALLINT USING ("is_entitled"::INTEGER::SMALLINT),
  ALTER COLUMN "is_entitled" SET DEFAULT 0;

-- questions table
ALTER TABLE "core"."questions"
  ALTER COLUMN "is_deleted" TYPE SMALLINT USING ("is_deleted"::INTEGER::SMALLINT),
  ALTER COLUMN "is_deleted" SET DEFAULT 0,
  ALTER COLUMN "is_banned" TYPE SMALLINT USING ("is_banned"::INTEGER::SMALLINT),
  ALTER COLUMN "is_banned" SET DEFAULT 0,
  ALTER COLUMN "is_approved" TYPE SMALLINT USING ("is_approved"::INTEGER::SMALLINT),
  ALTER COLUMN "is_approved" SET DEFAULT 0;

-- =====================================================
-- REVERT DISCORD IDS FROM BIGINT TO VARCHAR(20)
-- =====================================================
-- Convert all BIGINT Discord IDs back to VARCHAR(20)
-- WARNING: Special placeholder values cannot be restored

-- config table (many channel IDs)
ALTER TABLE "system"."config"
  ALTER COLUMN "updateChannelId" TYPE VARCHAR(20) USING ("updateChannelId"::TEXT),
  ALTER COLUMN "announcementChannelId" TYPE VARCHAR(20) USING ("announcementChannelId"::TEXT),
  ALTER COLUMN "logs" TYPE VARCHAR(20) USING ("logs"::TEXT),
  ALTER COLUMN "guildId" TYPE VARCHAR(20) USING ("guildId"::TEXT),
  ALTER COLUMN "guildId" SET DEFAULT '1079206786021732412',
  ALTER COLUMN "client" TYPE VARCHAR(20) USING ("client"::TEXT),
  ALTER COLUMN "advertChannel" TYPE VARCHAR(20) USING ("advertChannel"::TEXT),
  ALTER COLUMN "errors_log" TYPE VARCHAR(20) USING ("errors_log"::TEXT),
  ALTER COLUMN "banned_users_log" TYPE VARCHAR(20) USING ("banned_users_log"::TEXT),
  ALTER COLUMN "reports_log" TYPE VARCHAR(20) USING ("reports_log"::TEXT),
  ALTER COLUMN "servers_log" TYPE VARCHAR(20) USING ("servers_log"::TEXT),
  ALTER COLUMN "truths_log" TYPE VARCHAR(20) USING ("truths_log"::TEXT),
  ALTER COLUMN "dares_log" TYPE VARCHAR(20) USING ("dares_log"::TEXT);

-- adverts table
ALTER TABLE "premium"."adverts"
  ALTER COLUMN "messageId" TYPE VARCHAR(20) USING ("messageId"::TEXT),
  ALTER COLUMN "serverId" TYPE VARCHAR(20) USING ("serverId"::TEXT);

-- purchasables table
ALTER TABLE "premium"."purchasables"
  ALTER COLUMN "sku_id" TYPE VARCHAR(20) USING ("sku_id"::TEXT),
  ALTER COLUMN "application_id" TYPE VARCHAR(20) USING ("application_id"::TEXT);

-- entitlements table
ALTER TABLE "premium"."entitlements"
  ALTER COLUMN "guildId" TYPE VARCHAR(20) USING ("guildId"::TEXT),
  ALTER COLUMN "userId" TYPE VARCHAR(20) USING ("userId"::TEXT),
  ALTER COLUMN "skuId" TYPE VARCHAR(20) USING ("skuId"::TEXT),
  ALTER COLUMN "id" TYPE VARCHAR(20) USING ("id"::TEXT);

-- reports table
ALTER TABLE "moderation"."reports"
  ALTER COLUMN "server_id" TYPE VARCHAR(20) USING ("server_id"::TEXT),
  ALTER COLUMN "offender_id" TYPE VARCHAR(20) USING ("offender_id"::TEXT),
  ALTER COLUMN "sender_id" TYPE VARCHAR(20) USING ("sender_id"::TEXT),
  ALTER COLUMN "moderator_id" TYPE VARCHAR(20) USING ("moderator_id"::TEXT);

-- user_vote table
ALTER TABLE "core"."user_vote"
  ALTER COLUMN "user_id" TYPE VARCHAR(20) USING ("user_id"::TEXT),
  ALTER COLUMN "message_id" TYPE VARCHAR(20) USING ("message_id"::TEXT);

-- server_level_roles table
ALTER TABLE "core"."server_level_roles"
  ALTER COLUMN "role_id" TYPE VARCHAR(20) USING ("role_id"::TEXT),
  ALTER COLUMN "server_id" TYPE VARCHAR(20) USING ("server_id"::TEXT);

-- server_users table
ALTER TABLE "core"."server_users"
  ALTER COLUMN "server_id" TYPE VARCHAR(20) USING ("server_id"::TEXT),
  ALTER COLUMN "user_id" TYPE VARCHAR(20) USING ("user_id"::TEXT);

-- given_questions table
ALTER TABLE "core"."given_questions"
  ALTER COLUMN "message_id" TYPE VARCHAR(20) USING ("message_id"::TEXT),
  ALTER COLUMN "server_id" TYPE VARCHAR(20) USING ("server_id"::TEXT),
  ALTER COLUMN "target_id" TYPE VARCHAR(20) USING ("target_id"::TEXT),
  ALTER COLUMN "sender_id" TYPE VARCHAR(20) USING ("sender_id"::TEXT);

-- user_questions table
ALTER TABLE "core"."user_questions"
  ALTER COLUMN "channel_id" TYPE VARCHAR(20) USING (
    CASE WHEN "channel_id" IS NULL THEN 'PRE_5_7_0' ELSE "channel_id"::TEXT END
  ),
  ALTER COLUMN "channel_id" SET DEFAULT 'PRE_5_7_0',
  ALTER COLUMN "server_id" TYPE VARCHAR(20) USING ("server_id"::TEXT),
  ALTER COLUMN "user_id" TYPE VARCHAR(20) USING ("user_id"::TEXT),
  ALTER COLUMN "message_id" TYPE VARCHAR(20) USING ("message_id"::TEXT);

-- questions table
ALTER TABLE "core"."questions"
  ALTER COLUMN "message_id" TYPE VARCHAR(20) USING (
    CASE WHEN "message_id" IS NULL THEN 'pre-v5' ELSE "message_id"::TEXT END
  ),
  ALTER COLUMN "message_id" SET DEFAULT 'pre-v5',
  ALTER COLUMN "server_id" TYPE VARCHAR(20) USING (
    CASE WHEN "server_id" IS NULL THEN 'pre-v5' ELSE "server_id"::TEXT END
  ),
  ALTER COLUMN "server_id" SET DEFAULT 'pre-v5',
  ALTER COLUMN "banned_by" TYPE VARCHAR(20) USING ("banned_by"::TEXT),
  ALTER COLUMN "approved_by" TYPE VARCHAR(20) USING (
    CASE WHEN "approved_by" IS NULL THEN 'pre-v5-6' ELSE "approved_by"::TEXT END
  ),
  ALTER COLUMN "approved_by" SET DEFAULT 'pre-v5-6',
  ALTER COLUMN "creator" TYPE VARCHAR(20) USING ("creator"::TEXT);

-- servers table
ALTER TABLE "core"."servers"
  ALTER COLUMN "message_id" TYPE VARCHAR(20) USING ("message_id"::TEXT),
  ALTER COLUMN "announcement_channel" TYPE VARCHAR(20) USING (
    CASE WHEN "announcement_channel" IS NULL THEN 'UNSET' ELSE "announcement_channel"::TEXT END
  ),
  ALTER COLUMN "announcement_channel" SET DEFAULT 'UNSET',
  ALTER COLUMN "level_up_channel" TYPE VARCHAR(20) USING (
    CASE WHEN "level_up_channel" IS NULL THEN 'UNSET' ELSE "level_up_channel"::TEXT END
  ),
  ALTER COLUMN "level_up_channel" SET DEFAULT 'UNSET',
  ALTER COLUMN "owner" TYPE VARCHAR(20) USING ("owner"::TEXT),
  ALTER COLUMN "id" TYPE VARCHAR(20) USING ("id"::TEXT);

-- users table
ALTER TABLE "core"."users"
  ALTER COLUMN "ban_message_id" TYPE VARCHAR(20) USING ("ban_message_id"::TEXT),
  ALTER COLUMN "id" TYPE VARCHAR(20) USING ("id"::TEXT);

-- =====================================================
-- RECREATE ARCHIVE TABLES (EMPTY)
-- =====================================================
-- WARNING: These tables are DEPRECATED and should not be used

CREATE TABLE IF NOT EXISTS "archive_dares" (
  "id" SERIAL,
  "question" TEXT NOT NULL,
  "creator" VARCHAR(20) NOT NULL,
  "isApproved" BOOLEAN NOT NULL DEFAULT FALSE,
  "isBanned" BOOLEAN NOT NULL DEFAULT FALSE,
  "banReason" TEXT,
  "created" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "serverId" VARCHAR(20) NOT NULL DEFAULT 'pre-v5',
  "messageId" VARCHAR(20) DEFAULT 'pre-v5',
  PRIMARY KEY ("id")
);

COMMENT ON TABLE "archive_dares" IS 'DEPRECATED: Delete me';

CREATE TABLE IF NOT EXISTS "archive_truths" (
  "id" SERIAL,
  "question" TEXT NOT NULL,
  "creator" VARCHAR(20) DEFAULT NULL,
  "isApproved" BOOLEAN NOT NULL DEFAULT FALSE,
  "isBanned" BOOLEAN NOT NULL DEFAULT FALSE,
  "banReason" TEXT,
  "created" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "serverId" VARCHAR(20) NOT NULL DEFAULT 'pre-v5',
  "messageId" VARCHAR(45) DEFAULT 'pre-v5',
  PRIMARY KEY ("id")
);

COMMENT ON TABLE "archive_truths" IS 'DEPRECATED: Delete me';
