-- Migration: #26 - Database schema cleanup and optimization-- Migration: #26 - Database schema cleanup and optimization-- Migration: #26 - Database schema cleanup

-- Description: Drop archive tables, convert Discord IDs to BIGINT, standardize booleans, add indexes

-- Date: 2025-10-25-- Description: Standardize boolean fields and add performance indexes-- Description: Drop redundant tables and standardize naming to snake_case

-- Issue: https://github.com/Vulps22/project-encourage-reborn/issues/26

-- Date: 2025-10-25-- Date: 2025-10-25

-- =====================================================

-- DROP ARCHIVE TABLES-- Issue: https://github.com/Vulps22/project-encourage-reborn/issues/26-- Issue: https://github.com/Vulps22/project-encourage-reborn/issues/26

-- =====================================================

-- archive_dares and archive_truths are no longer needed



DROP TABLE IF EXISTS "archive_dares";-- =====================================================-- =====================================================

DROP TABLE IF EXISTS "archive_truths";

-- STANDARDIZE BOOLEAN FIELDS-- DROP REDUNDANT TABLES

-- =====================================================

-- CONVERT DISCORD IDS TO BIGINT-- =====================================================-- =====================================================

-- =====================================================

-- Convert all VARCHAR(20) Discord IDs to BIGINT for better performance-- Convert SMALLINT (0/1) fields to proper BOOLEAN type-- user_dares and user_truths are superseded by user_questions table

-- Note: String values like 'pre-v5', 'UNSET', 'PRE_5_7_0' must be handled

-- These tables are no longer used by the bot

-- users table

ALTER TABLE "core"."users"-- questions table

  ALTER COLUMN "id" TYPE BIGINT USING ("id"::BIGINT),

  ALTER COLUMN "ban_message_id" TYPE BIGINT USING (ALTER TABLE "core"."questions"DROP TABLE IF EXISTS user_dares;

    CASE WHEN "ban_message_id" IS NULL THEN NULL ELSE "ban_message_id"::BIGINT END

  );  ALTER COLUMN "is_approved" TYPE BOOLEAN USING ("is_approved"::SMALLINT::BOOLEAN),DROP TABLE IF EXISTS user_truths;



-- servers table  ALTER COLUMN "is_approved" SET DEFAULT FALSE,

ALTER TABLE "core"."servers"

  ALTER COLUMN "id" TYPE BIGINT USING ("id"::BIGINT),  ALTER COLUMN "is_banned" TYPE BOOLEAN USING ("is_banned"::SMALLINT::BOOLEAN),-- =====================================================

  ALTER COLUMN "owner" TYPE BIGINT USING ("owner"::BIGINT),

  ALTER COLUMN "level_up_channel" TYPE BIGINT USING (  ALTER COLUMN "is_banned" SET DEFAULT FALSE,-- STANDARDIZE NAMING TO SNAKE_CASE

    CASE WHEN "level_up_channel" = 'UNSET' THEN NULL ELSE "level_up_channel"::BIGINT END

  ),  ALTER COLUMN "is_deleted" TYPE BOOLEAN USING ("is_deleted"::SMALLINT::BOOLEAN),-- =====================================================

  ALTER COLUMN "announcement_channel" TYPE BIGINT USING (

    CASE WHEN "announcement_channel" = 'UNSET' THEN NULL ELSE "announcement_channel"::BIGINT END  ALTER COLUMN "is_deleted" SET DEFAULT FALSE;-- All camelCase columns renamed to snake_case per SQL convention

  ),

  ALTER COLUMN "message_id" TYPE BIGINT USING (

    CASE WHEN "message_id" IS NULL THEN NULL ELSE "message_id"::BIGINT END

  );-- servers table-- questions table



-- questions tableALTER TABLE "core"."servers"ALTER TABLE questions

ALTER TABLE "core"."questions"

  ALTER COLUMN "creator" TYPE BIGINT USING ("creator"::BIGINT),  ALTER COLUMN "is_entitled" TYPE BOOLEAN USING ("is_entitled"::SMALLINT::BOOLEAN),  CHANGE COLUMN isApproved is_approved TINYINT NOT NULL DEFAULT 0,

  ALTER COLUMN "approved_by" TYPE BIGINT USING (

    CASE WHEN "approved_by" = 'pre-v5-6' THEN NULL ELSE "approved_by"::BIGINT END  ALTER COLUMN "is_entitled" SET DEFAULT FALSE,  CHANGE COLUMN approvedBy approved_by VARCHAR(20) NOT NULL DEFAULT 'pre-v5-6',

  ),

  ALTER COLUMN "banned_by" TYPE BIGINT USING (  ALTER COLUMN "is_deleted" TYPE BOOLEAN USING ("is_deleted"::SMALLINT::BOOLEAN),  CHANGE COLUMN isBanned is_banned TINYINT NOT NULL DEFAULT 0,

    CASE WHEN "banned_by" IS NULL THEN NULL ELSE "banned_by"::BIGINT END

  ),  ALTER COLUMN "is_deleted" SET DEFAULT FALSE;  CHANGE COLUMN banReason ban_reason TEXT,

  ALTER COLUMN "server_id" TYPE BIGINT USING (

    CASE WHEN "server_id" = 'pre-v5' THEN NULL ELSE "server_id"::BIGINT END  CHANGE COLUMN bannedBy banned_by VARCHAR(20) DEFAULT NULL,

  ),

  ALTER COLUMN "message_id" TYPE BIGINT USING (-- user_questions table  CHANGE COLUMN serverId server_id VARCHAR(20) NOT NULL DEFAULT 'pre-v5',

    CASE WHEN "message_id" = 'pre-v5' OR "message_id" IS NULL THEN NULL ELSE "message_id"::BIGINT END

  );ALTER TABLE "core"."user_questions"  CHANGE COLUMN messageId message_id VARCHAR(20) DEFAULT 'pre-v5',



-- user_questions table  ALTER COLUMN "skipped" TYPE BOOLEAN USING ("skipped"::SMALLINT::BOOLEAN),  CHANGE COLUMN isDeleted is_deleted TINYINT NOT NULL DEFAULT 0;

ALTER TABLE "core"."user_questions"

  ALTER COLUMN "message_id" TYPE BIGINT USING ("message_id"::BIGINT),  ALTER COLUMN "skipped" SET DEFAULT FALSE;

  ALTER COLUMN "user_id" TYPE BIGINT USING ("user_id"::BIGINT),

  ALTER COLUMN "server_id" TYPE BIGINT USING ("server_id"::BIGINT),-- users table

  ALTER COLUMN "channel_id" TYPE BIGINT USING (

    CASE WHEN "channel_id" = 'PRE_5_7_0' THEN NULL ELSE "channel_id"::BIGINT END-- given_questions tableALTER TABLE users

  );

ALTER TABLE "core"."given_questions"  CHANGE COLUMN globalLevel global_level INT NOT NULL DEFAULT 0,

-- given_questions table

ALTER TABLE "core"."given_questions"  ALTER COLUMN "skipped" TYPE BOOLEAN USING ("skipped"::SMALLINT::BOOLEAN),  CHANGE COLUMN globalLevelXp global_level_xp INT NOT NULL DEFAULT 0,

  ALTER COLUMN "sender_id" TYPE BIGINT USING ("sender_id"::BIGINT),

  ALTER COLUMN "target_id" TYPE BIGINT USING ("target_id"::BIGINT),  ALTER COLUMN "skipped" SET DEFAULT FALSE;  CHANGE COLUMN rulesAccepted rules_accepted TINYINT(1) NOT NULL DEFAULT 0,

  ALTER COLUMN "server_id" TYPE BIGINT USING ("server_id"::BIGINT),

  ALTER COLUMN "message_id" TYPE BIGINT USING (  CHANGE COLUMN isBanned is_banned TINYINT(1) NOT NULL DEFAULT 0,

    CASE WHEN "message_id" IS NULL THEN NULL ELSE "message_id"::BIGINT END

  );-- entitlements table  CHANGE COLUMN banReason ban_reason LONGTEXT,



-- server_users tableALTER TABLE "premium"."entitlements"  CHANGE COLUMN voteCount vote_count INT NOT NULL DEFAULT 0,

ALTER TABLE "core"."server_users"

  ALTER COLUMN "user_id" TYPE BIGINT USING ("user_id"::BIGINT),  ALTER COLUMN "deleted" TYPE BOOLEAN USING ("deleted"::SMALLINT::BOOLEAN),  CHANGE COLUMN deleteDate delete_date DATETIME DEFAULT NULL;

  ALTER COLUMN "server_id" TYPE BIGINT USING ("server_id"::BIGINT);

  ALTER COLUMN "deleted" SET DEFAULT FALSE,

-- server_level_roles table

ALTER TABLE "core"."server_level_roles"  ALTER COLUMN "consumed" TYPE BOOLEAN USING ("consumed"::SMALLINT::BOOLEAN),-- servers table

  ALTER COLUMN "server_id" TYPE BIGINT USING ("server_id"::BIGINT),

  ALTER COLUMN "role_id" TYPE BIGINT USING ("role_id"::BIGINT);  ALTER COLUMN "consumed" SET DEFAULT FALSE;ALTER TABLE servers



-- user_vote table  CHANGE COLUMN hasAccepted has_accepted TINYINT(1) NOT NULL DEFAULT 0,

ALTER TABLE "core"."user_vote"

  ALTER COLUMN "message_id" TYPE BIGINT USING ("message_id"::BIGINT),-- =====================================================  CHANGE COLUMN isBanned is_banned TINYINT(1) NOT NULL DEFAULT 0,

  ALTER COLUMN "user_id" TYPE BIGINT USING ("user_id"::BIGINT);

-- ADD PERFORMANCE INDEXES  CHANGE COLUMN banReason ban_reason TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,

-- reports table

ALTER TABLE "moderation"."reports"-- =====================================================  CHANGE COLUMN isDeleted is_deleted TINYINT NOT NULL DEFAULT 0;

  ALTER COLUMN "moderator_id" TYPE BIGINT USING (

    CASE WHEN "moderator_id" IS NULL THEN NULL ELSE "moderator_id"::BIGINT END-- Add indexes for commonly queried columns to improve performance

  ),

  ALTER COLUMN "sender_id" TYPE BIGINT USING ("sender_id"::BIGINT),-- user_questions table

  ALTER COLUMN "offender_id" TYPE BIGINT USING ("offender_id"::BIGINT),

  ALTER COLUMN "server_id" TYPE BIGINT USING ("server_id"::BIGINT);-- questions table indexesALTER TABLE user_questions



-- entitlements tableCREATE INDEX IF NOT EXISTS "idx_type_approved" ON "core"."questions"("type", "is_approved", "is_banned");  CHANGE COLUMN messageId message_id VARCHAR(20) NOT NULL,

ALTER TABLE "premium"."entitlements"

  ALTER COLUMN "id" TYPE BIGINT USING ("id"::BIGINT),CREATE INDEX IF NOT EXISTS "idx_server" ON "core"."questions"("server_id");  CHANGE COLUMN userId user_id VARCHAR(20) NOT NULL,

  ALTER COLUMN "skuId" TYPE BIGINT USING ("skuId"::BIGINT),

  ALTER COLUMN "userId" TYPE BIGINT USING ("userId"::BIGINT),CREATE INDEX IF NOT EXISTS "idx_creator" ON "core"."questions"("creator");  CHANGE COLUMN questionId question_id INT NOT NULL,

  ALTER COLUMN "guildId" TYPE BIGINT USING (

    CASE WHEN "guildId" IS NULL THEN NULL ELSE "guildId"::BIGINT ENDCREATE INDEX IF NOT EXISTS "idx_created" ON "core"."questions"("created");  CHANGE COLUMN serverId server_id VARCHAR(20) NOT NULL,

  );

  CHANGE COLUMN channelId channel_id VARCHAR(20) NOT NULL DEFAULT 'PRE_5_7_0',

-- purchasables table

ALTER TABLE "premium"."purchasables"-- users table indexes  CHANGE COLUMN imageUrl image_url TEXT,

  ALTER COLUMN "application_id" TYPE BIGINT USING ("application_id"::BIGINT),

  ALTER COLUMN "sku_id" TYPE BIGINT USING ("sku_id"::BIGINT);CREATE INDEX IF NOT EXISTS "idx_level_xp" ON "core"."users"("global_level", "global_level_xp");  CHANGE COLUMN doneCount done_count INT NOT NULL DEFAULT 0,



-- adverts tableCREATE INDEX IF NOT EXISTS "idx_banned" ON "core"."users"("is_banned");  CHANGE COLUMN failedCount failed_count INT NOT NULL DEFAULT 0,

ALTER TABLE "premium"."adverts"

  ALTER COLUMN "serverId" TYPE BIGINT USING ("serverId"::BIGINT),  CHANGE COLUMN finalResult final_result VARCHAR(10) DEFAULT NULL;

  ALTER COLUMN "messageId" TYPE BIGINT USING ("messageId"::BIGINT);

-- servers table indexes

-- config table (many channel IDs)

ALTER TABLE "system"."config"CREATE INDEX IF NOT EXISTS "idx_owner" ON "core"."servers"("owner");-- given_questions table

  ALTER COLUMN "dares_log" TYPE BIGINT USING (

    CASE WHEN "dares_log" IS NULL THEN NULL ELSE "dares_log"::BIGINT ENDCREATE INDEX IF NOT EXISTS "idx_entitled" ON "core"."servers"("is_entitled");ALTER TABLE given_questions

  ),

  ALTER COLUMN "truths_log" TYPE BIGINT USING (CREATE INDEX IF NOT EXISTS "idx_deleted" ON "core"."servers"("is_deleted");  CHANGE COLUMN senderId sender_id VARCHAR(20) NOT NULL,

    CASE WHEN "truths_log" IS NULL THEN NULL ELSE "truths_log"::BIGINT END

  ),  CHANGE COLUMN targetId target_id VARCHAR(20) NOT NULL,

  ALTER COLUMN "servers_log" TYPE BIGINT USING (

    CASE WHEN "servers_log" IS NULL THEN NULL ELSE "servers_log"::BIGINT END-- user_questions table indexes  CHANGE COLUMN serverId server_id VARCHAR(20) NOT NULL,

  ),

  ALTER COLUMN "reports_log" TYPE BIGINT USING (CREATE INDEX IF NOT EXISTS "idx_user" ON "core"."user_questions"("user_id");  CHANGE COLUMN messageId message_id VARCHAR(20) DEFAULT NULL,

    CASE WHEN "reports_log" IS NULL THEN NULL ELSE "reports_log"::BIGINT END

  ),CREATE INDEX IF NOT EXISTS "idx_server" ON "core"."user_questions"("server_id");  CHANGE COLUMN doneCount done_count INT NOT NULL DEFAULT 0,

  ALTER COLUMN "banned_users_log" TYPE BIGINT USING (

    CASE WHEN "banned_users_log" IS NULL THEN NULL ELSE "banned_users_log"::BIGINT ENDCREATE INDEX IF NOT EXISTS "idx_question" ON "core"."user_questions"("question_id");  CHANGE COLUMN failCount fail_count INT NOT NULL DEFAULT 0,

  ),

  ALTER COLUMN "errors_log" TYPE BIGINT USING (CREATE INDEX IF NOT EXISTS "idx_created" ON "core"."user_questions"("datetime_created");  CHANGE COLUMN xpType xp_type VARCHAR(10) NOT NULL DEFAULT 'global';

    CASE WHEN "errors_log" IS NULL THEN NULL ELSE "errors_log"::BIGINT END

  ),CREATE INDEX IF NOT EXISTS "idx_type" ON "core"."user_questions"("type");

  ALTER COLUMN "advertChannel" TYPE BIGINT USING ("advertChannel"::BIGINT),

  ALTER COLUMN "client" TYPE BIGINT USING ("client"::BIGINT),CREATE INDEX IF NOT EXISTS "idx_final_result" ON "core"."user_questions"("final_result");-- reports table

  ALTER COLUMN "guildId" TYPE BIGINT USING ("guildId"::BIGINT),

  ALTER COLUMN "logs" TYPE BIGINT USING ("logs"::BIGINT),ALTER TABLE reports

  ALTER COLUMN "announcementChannelId" TYPE BIGINT USING (

    CASE WHEN "announcementChannelId" IS NULL THEN NULL ELSE "announcementChannelId"::BIGINT END-- given_questions table indexes  CHANGE COLUMN moderatorId moderator_id VARCHAR(20) DEFAULT NULL,

  ),

  ALTER COLUMN "updateChannelId" TYPE BIGINT USING (CREATE INDEX IF NOT EXISTS "idx_sender" ON "core"."given_questions"("sender_id");  CHANGE COLUMN banReason ban_reason TEXT,

    CASE WHEN "updateChannelId" IS NULL THEN NULL ELSE "updateChannelId"::BIGINT END

  );CREATE INDEX IF NOT EXISTS "idx_target" ON "core"."given_questions"("target_id");  CHANGE COLUMN senderId sender_id VARCHAR(20) NOT NULL,



-- =====================================================CREATE INDEX IF NOT EXISTS "idx_server" ON "core"."given_questions"("server_id");  CHANGE COLUMN offenderId offender_id VARCHAR(20) NOT NULL,

-- STANDARDIZE BOOLEAN FIELDS

-- =====================================================CREATE INDEX IF NOT EXISTS "idx_created" ON "core"."given_questions"("created");  CHANGE COLUMN serverId server_id VARCHAR(20) NOT NULL;

-- Convert SMALLINT (0/1) fields to proper BOOLEAN type



-- questions table-- reports table indexes

ALTER TABLE "core"."questions"CREATE INDEX IF NOT EXISTS "idx_status" ON "moderation"."reports"("status");

  ALTER COLUMN "is_approved" TYPE BOOLEAN USING ("is_approved"::SMALLINT::BOOLEAN),CREATE INDEX IF NOT EXISTS "idx_offender" ON "moderation"."reports"("offender_id");

  ALTER COLUMN "is_approved" SET DEFAULT FALSE,CREATE INDEX IF NOT EXISTS "idx_server" ON "moderation"."reports"("server_id");

  ALTER COLUMN "is_banned" TYPE BOOLEAN USING ("is_banned"::SMALLINT::BOOLEAN),CREATE INDEX IF NOT EXISTS "idx_created" ON "moderation"."reports"("created_at");

  ALTER COLUMN "is_banned" SET DEFAULT FALSE,
  ALTER COLUMN "is_deleted" TYPE BOOLEAN USING ("is_deleted"::SMALLINT::BOOLEAN),
  ALTER COLUMN "is_deleted" SET DEFAULT FALSE;

-- servers table
ALTER TABLE "core"."servers"
  ALTER COLUMN "is_entitled" TYPE BOOLEAN USING ("is_entitled"::SMALLINT::BOOLEAN),
  ALTER COLUMN "is_entitled" SET DEFAULT FALSE,
  ALTER COLUMN "is_deleted" TYPE BOOLEAN USING ("is_deleted"::SMALLINT::BOOLEAN),
  ALTER COLUMN "is_deleted" SET DEFAULT FALSE;

-- user_questions table
ALTER TABLE "core"."user_questions"
  ALTER COLUMN "skipped" TYPE BOOLEAN USING ("skipped"::SMALLINT::BOOLEAN),
  ALTER COLUMN "skipped" SET DEFAULT FALSE;

-- given_questions table
ALTER TABLE "core"."given_questions"
  ALTER COLUMN "skipped" TYPE BOOLEAN USING ("skipped"::SMALLINT::BOOLEAN),
  ALTER COLUMN "skipped" SET DEFAULT FALSE;

-- entitlements table
ALTER TABLE "premium"."entitlements"
  ALTER COLUMN "deleted" TYPE BOOLEAN USING ("deleted"::SMALLINT::BOOLEAN),
  ALTER COLUMN "deleted" SET DEFAULT FALSE,
  ALTER COLUMN "consumed" TYPE BOOLEAN USING ("consumed"::SMALLINT::BOOLEAN),
  ALTER COLUMN "consumed" SET DEFAULT FALSE;

-- =====================================================
-- ADD PERFORMANCE INDEXES
-- =====================================================
-- Add indexes for commonly queried columns to improve performance

-- questions table indexes
CREATE INDEX IF NOT EXISTS "idx_type_approved" ON "core"."questions"("type", "is_approved", "is_banned");
CREATE INDEX IF NOT EXISTS "idx_server" ON "core"."questions"("server_id");
CREATE INDEX IF NOT EXISTS "idx_creator" ON "core"."questions"("creator");
CREATE INDEX IF NOT EXISTS "idx_created" ON "core"."questions"("created");

-- users table indexes
CREATE INDEX IF NOT EXISTS "idx_level_xp" ON "core"."users"("global_level", "global_level_xp");
CREATE INDEX IF NOT EXISTS "idx_banned" ON "core"."users"("is_banned");

-- servers table indexes
CREATE INDEX IF NOT EXISTS "idx_owner" ON "core"."servers"("owner");
CREATE INDEX IF NOT EXISTS "idx_entitled" ON "core"."servers"("is_entitled");
CREATE INDEX IF NOT EXISTS "idx_deleted" ON "core"."servers"("is_deleted");

-- user_questions table indexes
CREATE INDEX IF NOT EXISTS "idx_user" ON "core"."user_questions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_server" ON "core"."user_questions"("server_id");
CREATE INDEX IF NOT EXISTS "idx_question" ON "core"."user_questions"("question_id");
CREATE INDEX IF NOT EXISTS "idx_created" ON "core"."user_questions"("datetime_created");
CREATE INDEX IF NOT EXISTS "idx_type" ON "core"."user_questions"("type");
CREATE INDEX IF NOT EXISTS "idx_final_result" ON "core"."user_questions"("final_result");

-- given_questions table indexes
CREATE INDEX IF NOT EXISTS "idx_sender" ON "core"."given_questions"("sender_id");
CREATE INDEX IF NOT EXISTS "idx_target" ON "core"."given_questions"("target_id");
CREATE INDEX IF NOT EXISTS "idx_server" ON "core"."given_questions"("server_id");
CREATE INDEX IF NOT EXISTS "idx_created" ON "core"."given_questions"("created");

-- reports table indexes
CREATE INDEX IF NOT EXISTS "idx_status" ON "moderation"."reports"("status");
CREATE INDEX IF NOT EXISTS "idx_offender" ON "moderation"."reports"("offender_id");
CREATE INDEX IF NOT EXISTS "idx_server" ON "moderation"."reports"("server_id");
CREATE INDEX IF NOT EXISTS "idx_created" ON "moderation"."reports"("created_at");
