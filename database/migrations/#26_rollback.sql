-- Migration Rollback: #26 - Database schema cleanup and optimization
-- Description: Revert all changes - recreate archive tables, convert BIGINT to VARCHAR, revert booleans, drop indexes
-- Date: 2025-10-25
-- Issue: https://github.com/Vulps22/project-encourage-reborn/issues/26
-- WARNING: Archive tables will be recreated EMPTY - no data migration is performed
-- WARNING: Converting BIGINT to VARCHAR may lose special placeholder values

-- =====================================================
-- PHASE 1: DROP PERFORMANCE INDEXES
-- =====================================================
-- Remove indexes using their full unique names

-- reports table indexes
DROP INDEX IF EXISTS moderation.idx_reports_created;
DROP INDEX IF EXISTS moderation.idx_reports_server;
DROP INDEX IF EXISTS moderation.idx_reports_offender;
DROP INDEX IF EXISTS moderation.idx_reports_status;

-- given_questions table indexes
DROP INDEX IF EXISTS core.idx_given_questions_created;
DROP INDEX IF EXISTS core.idx_given_questions_server;
DROP INDEX IF EXISTS core.idx_given_questions_target;
DROP INDEX IF EXISTS core.idx_given_questions_sender;

-- user_questions table indexes
DROP INDEX IF EXISTS core.idx_user_questions_final_result;
DROP INDEX IF EXISTS core.idx_user_questions_type;
DROP INDEX IF EXISTS core.idx_user_questions_created;
DROP INDEX IF EXISTS core.idx_user_questions_question;
DROP INDEX IF EXISTS core.idx_user_questions_server;
DROP INDEX IF EXISTS core.idx_user_questions_user;

-- servers table indexes
DROP INDEX IF EXISTS core.idx_servers_deleted;
DROP INDEX IF EXISTS core.idx_servers_entitled;
DROP INDEX IF EXISTS core.idx_servers_owner;

-- users table indexes
DROP INDEX IF EXISTS core.idx_users_banned;
DROP INDEX IF EXISTS core.idx_users_level_xp;

-- questions table indexes
DROP INDEX IF EXISTS core.idx_questions_created;
DROP INDEX IF EXISTS core.idx_questions_creator;
DROP INDEX IF EXISTS core.idx_questions_server;
DROP INDEX IF EXISTS core.idx_questions_type_approved;

-- =====================================================
-- PHASE 2: REVERT BOOLEAN FIELDS TO SMALLINT
-- =====================================================
-- Convert BOOLEAN fields back to SMALLINT (0/1)

-- entitlements table
ALTER TABLE premium.entitlements
  ALTER COLUMN consumed TYPE SMALLINT USING (consumed::INTEGER::SMALLINT),
  ALTER COLUMN consumed SET DEFAULT 0,
  ALTER COLUMN deleted TYPE SMALLINT USING (deleted::INTEGER::SMALLINT),
  ALTER COLUMN deleted SET DEFAULT 0;

-- given_questions table
ALTER TABLE core.given_questions
  ALTER COLUMN skipped TYPE SMALLINT USING (skipped::INTEGER::SMALLINT),
  ALTER COLUMN skipped SET DEFAULT 0;

-- user_questions table
ALTER TABLE core.user_questions
  ALTER COLUMN skipped TYPE SMALLINT USING (skipped::INTEGER::SMALLINT),
  ALTER COLUMN skipped SET DEFAULT 0;

-- servers table
ALTER TABLE core.servers
  ALTER COLUMN is_deleted TYPE SMALLINT USING (is_deleted::INTEGER::SMALLINT),
  ALTER COLUMN is_deleted SET DEFAULT 0,
  ALTER COLUMN is_entitled TYPE SMALLINT USING (is_entitled::INTEGER::SMALLINT),
  ALTER COLUMN is_entitled SET DEFAULT 0;

-- questions table
ALTER TABLE core.questions
  ALTER COLUMN is_deleted TYPE SMALLINT USING (is_deleted::INTEGER::SMALLINT),
  ALTER COLUMN is_deleted SET DEFAULT 0,
  ALTER COLUMN is_banned TYPE SMALLINT USING (is_banned::INTEGER::SMALLINT),
  ALTER COLUMN is_banned SET DEFAULT 0,
  ALTER COLUMN is_approved TYPE SMALLINT USING (is_approved::INTEGER::SMALLINT),
  ALTER COLUMN is_approved SET DEFAULT 0;

-- =====================================================
-- PHASE 3: REVERT DISCORD IDS FROM BIGINT TO VARCHAR(20)
-- =====================================================
-- Convert all BIGINT Discord IDs back to VARCHAR(20)

-- config table
ALTER TABLE system.config
  ALTER COLUMN update_channel_id TYPE VARCHAR(20) USING (update_channel_id::TEXT),
  ALTER COLUMN announcement_channel_id TYPE VARCHAR(20) USING (announcement_channel_id::TEXT),
  ALTER COLUMN logs TYPE VARCHAR(20) USING (logs::TEXT),
  ALTER COLUMN guild_id TYPE VARCHAR(20) USING (guild_id::TEXT),
  ALTER COLUMN guild_id SET DEFAULT '1079206786021732412',
  ALTER COLUMN client TYPE VARCHAR(20) USING (client::TEXT),
  ALTER COLUMN advert_channel TYPE VARCHAR(20) USING (advert_channel::TEXT),
  ALTER COLUMN errors_log TYPE VARCHAR(20) USING (errors_log::TEXT),
  ALTER COLUMN banned_users_log TYPE VARCHAR(20) USING (banned_users_log::TEXT),
  ALTER COLUMN reports_log TYPE VARCHAR(20) USING (reports_log::TEXT),
  ALTER COLUMN servers_log TYPE VARCHAR(20) USING (servers_log::TEXT),
  ALTER COLUMN truths_log TYPE VARCHAR(20) USING (truths_log::TEXT),
  ALTER COLUMN dares_log TYPE VARCHAR(20) USING (dares_log::TEXT);

-- adverts table
ALTER TABLE premium.adverts
  ALTER COLUMN message_id TYPE VARCHAR(20) USING (message_id::TEXT),
  ALTER COLUMN server_id TYPE VARCHAR(20) USING (server_id::TEXT);

-- purchasables table
ALTER TABLE premium.purchasables
  ALTER COLUMN sku_id TYPE VARCHAR(20) USING (sku_id::TEXT),
  ALTER COLUMN application_id TYPE VARCHAR(20) USING (application_id::TEXT);

-- entitlements table
ALTER TABLE premium.entitlements
  ALTER COLUMN guild_id TYPE VARCHAR(20) USING (guild_id::TEXT),
  ALTER COLUMN user_id TYPE VARCHAR(20) USING (user_id::TEXT),
  ALTER COLUMN sku_id TYPE VARCHAR(20) USING (sku_id::TEXT),
  ALTER COLUMN id TYPE VARCHAR(20) USING (id::TEXT);

-- reports table
ALTER TABLE moderation.reports
  ALTER COLUMN server_id TYPE VARCHAR(20) USING (server_id::TEXT),
  ALTER COLUMN offender_id TYPE VARCHAR(20) USING (offender_id::TEXT),
  ALTER COLUMN sender_id TYPE VARCHAR(20) USING (sender_id::TEXT),
  ALTER COLUMN moderator_id TYPE VARCHAR(20) USING (moderator_id::TEXT);

-- user_vote table
ALTER TABLE core.user_vote
  ALTER COLUMN user_id TYPE VARCHAR(20) USING (user_id::TEXT),
  ALTER COLUMN message_id TYPE VARCHAR(20) USING (message_id::TEXT);

-- server_level_roles table
ALTER TABLE core.server_level_roles
  ALTER COLUMN role_id TYPE VARCHAR(20) USING (role_id::TEXT),
  ALTER COLUMN server_id TYPE VARCHAR(20) USING (server_id::TEXT);

-- server_users table
ALTER TABLE core.server_users
  ALTER COLUMN server_id TYPE VARCHAR(20) USING (server_id::TEXT),
  ALTER COLUMN user_id TYPE VARCHAR(20) USING (user_id::TEXT);

-- given_questions table
ALTER TABLE core.given_questions
  ALTER COLUMN message_id TYPE VARCHAR(20) USING (message_id::TEXT),
  ALTER COLUMN server_id TYPE VARCHAR(20) USING (server_id::TEXT),
  ALTER COLUMN target_id TYPE VARCHAR(20) USING (target_id::TEXT),
  ALTER COLUMN sender_id TYPE VARCHAR(20) USING (sender_id::TEXT);

-- user_questions table
ALTER TABLE core.user_questions
  ALTER COLUMN channel_id TYPE VARCHAR(20) USING (
    CASE WHEN channel_id IS NULL THEN 'PRE_5_7_0' ELSE channel_id::TEXT END
  ),
  ALTER COLUMN channel_id SET DEFAULT 'PRE_5_7_0',
  ALTER COLUMN server_id TYPE VARCHAR(20) USING (server_id::TEXT),
  ALTER COLUMN user_id TYPE VARCHAR(20) USING (user_id::TEXT),
  ALTER COLUMN message_id TYPE VARCHAR(20) USING (message_id::TEXT);

-- questions table
ALTER TABLE core.questions
  ALTER COLUMN message_id TYPE VARCHAR(20) USING (
    CASE WHEN message_id IS NULL THEN 'pre-v5' ELSE message_id::TEXT END
  ),
  ALTER COLUMN message_id SET DEFAULT 'pre-v5',
  ALTER COLUMN server_id TYPE VARCHAR(20) USING (
    CASE WHEN server_id IS NULL THEN 'pre-v5' ELSE server_id::TEXT END
  ),
  ALTER COLUMN server_id SET DEFAULT 'pre-v5',
  ALTER COLUMN banned_by TYPE VARCHAR(20) USING (banned_by::TEXT),
  ALTER COLUMN approved_by TYPE VARCHAR(20) USING (
    CASE WHEN approved_by IS NULL THEN 'pre-v5-6' ELSE approved_by::TEXT END
  ),
  ALTER COLUMN approved_by SET DEFAULT 'pre-v5-6',
  ALTER COLUMN creator TYPE VARCHAR(20) USING (creator::TEXT);

-- servers table
ALTER TABLE core.servers
  ALTER COLUMN message_id TYPE VARCHAR(20) USING (message_id::TEXT),
  ALTER COLUMN announcement_channel TYPE VARCHAR(20) USING (
    CASE WHEN announcement_channel IS NULL THEN 'UNSET' ELSE announcement_channel::TEXT END
  ),
  ALTER COLUMN announcement_channel SET DEFAULT 'UNSET',
  ALTER COLUMN level_up_channel TYPE VARCHAR(20) USING (
    CASE WHEN level_up_channel IS NULL THEN 'UNSET' ELSE level_up_channel::TEXT END
  ),
  ALTER COLUMN level_up_channel SET DEFAULT 'UNSET',
  ALTER COLUMN owner TYPE VARCHAR(20) USING (owner::TEXT),
  ALTER COLUMN id TYPE VARCHAR(20) USING (id::TEXT);

-- users table
ALTER TABLE core.users
  ALTER COLUMN ban_message_id TYPE VARCHAR(20) USING (ban_message_id::TEXT),
  ALTER COLUMN id TYPE VARCHAR(20) USING (id::TEXT);

-- =====================================================
-- PHASE 4: RENAME COLUMNS FROM snake_case TO camelCase
-- =====================================================
-- Revert column names back to original camelCase

-- questions table
ALTER TABLE core.questions
  RENAME COLUMN is_approved TO "isApproved";
ALTER TABLE core.questions
  RENAME COLUMN approved_by TO "approvedBy";
ALTER TABLE core.questions
  RENAME COLUMN is_banned TO "isBanned";
ALTER TABLE core.questions
  RENAME COLUMN ban_reason TO "banReason";
ALTER TABLE core.questions
  RENAME COLUMN banned_by TO "bannedBy";
ALTER TABLE core.questions
  RENAME COLUMN server_id TO "serverId";
ALTER TABLE core.questions
  RENAME COLUMN message_id TO "messageId";
ALTER TABLE core.questions
  RENAME COLUMN is_deleted TO "isDeleted";

-- users table
ALTER TABLE core.users
  RENAME COLUMN global_level TO "globalLevel";
ALTER TABLE core.users
  RENAME COLUMN global_level_xp TO "globalLevelXp";
ALTER TABLE core.users
  RENAME COLUMN rules_accepted TO "rulesAccepted";
ALTER TABLE core.users
  RENAME COLUMN is_banned TO "isBanned";
ALTER TABLE core.users
  RENAME COLUMN ban_reason TO "banReason";
ALTER TABLE core.users
  RENAME COLUMN vote_count TO "voteCount";
ALTER TABLE core.users
  RENAME COLUMN delete_date TO "deleteDate";

-- servers table
ALTER TABLE core.servers
  RENAME COLUMN has_accepted TO "hasAccepted";
ALTER TABLE core.servers
  RENAME COLUMN is_banned TO "isBanned";
ALTER TABLE core.servers
  RENAME COLUMN ban_reason TO "banReason";
ALTER TABLE core.servers
  RENAME COLUMN is_deleted TO "isDeleted";

-- user_questions table
ALTER TABLE core.user_questions
  RENAME COLUMN message_id TO "messageId";
ALTER TABLE core.user_questions
  RENAME COLUMN user_id TO "userId";
ALTER TABLE core.user_questions
  RENAME COLUMN question_id TO "questionId";
ALTER TABLE core.user_questions
  RENAME COLUMN server_id TO "serverId";
ALTER TABLE core.user_questions
  RENAME COLUMN channel_id TO "channelId";
ALTER TABLE core.user_questions
  RENAME COLUMN image_url TO "imageUrl";
ALTER TABLE core.user_questions
  RENAME COLUMN done_count TO "doneCount";
ALTER TABLE core.user_questions
  RENAME COLUMN failed_count TO "failedCount";
ALTER TABLE core.user_questions
  RENAME COLUMN final_result TO "finalResult";

-- given_questions table
ALTER TABLE core.given_questions
  RENAME COLUMN sender_id TO "senderId";
ALTER TABLE core.given_questions
  RENAME COLUMN target_id TO "targetId";
ALTER TABLE core.given_questions
  RENAME COLUMN server_id TO "serverId";
ALTER TABLE core.given_questions
  RENAME COLUMN message_id TO "messageId";
ALTER TABLE core.given_questions
  RENAME COLUMN done_count TO "doneCount";
ALTER TABLE core.given_questions
  RENAME COLUMN fail_count TO "failCount";
ALTER TABLE core.given_questions
  RENAME COLUMN xp_type TO "xpType";

-- reports table
ALTER TABLE moderation.reports
  RENAME COLUMN moderator_id TO "moderatorId";
ALTER TABLE moderation.reports
  RENAME COLUMN ban_reason TO "banReason";
ALTER TABLE moderation.reports
  RENAME COLUMN sender_id TO "senderId";
ALTER TABLE moderation.reports
  RENAME COLUMN offender_id TO "offenderId";
ALTER TABLE moderation.reports
  RENAME COLUMN server_id TO "serverId";

-- entitlements table
ALTER TABLE premium.entitlements
  RENAME COLUMN sku_id TO "skuId";
ALTER TABLE premium.entitlements
  RENAME COLUMN user_id TO "userId";
ALTER TABLE premium.entitlements
  RENAME COLUMN guild_id TO "guildId";

-- adverts table
ALTER TABLE premium.adverts
  RENAME COLUMN server_id TO "serverId";
ALTER TABLE premium.adverts
  RENAME COLUMN message_id TO "messageId";

-- config table
ALTER TABLE system.config
  RENAME COLUMN advert_channel TO "advertChannel";
ALTER TABLE system.config
  RENAME COLUMN guild_id TO "guildId";
ALTER TABLE system.config
  RENAME COLUMN announcement_channel_id TO "announcementChannelId";
ALTER TABLE system.config
  RENAME COLUMN update_channel_id TO "updateChannelId";

-- =====================================================
-- PHASE 5: RECREATE ARCHIVE TABLES (EMPTY)
-- =====================================================
-- WARNING: These tables are DEPRECATED and should not be used
-- No data is migrated - tables are created empty

CREATE TABLE IF NOT EXISTS archive_dares (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  creator VARCHAR(20) NOT NULL,
  "isApproved" SMALLINT NOT NULL DEFAULT 0,
  "isBanned" SMALLINT NOT NULL DEFAULT 0,
  "banReason" TEXT,
  created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "serverId" VARCHAR(20) NOT NULL DEFAULT 'pre-v5',
  "messageId" VARCHAR(20) DEFAULT 'pre-v5'
);

COMMENT ON TABLE archive_dares IS 'DEPRECATED: This table should not be used';

CREATE TABLE IF NOT EXISTS archive_truths (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  creator VARCHAR(20) DEFAULT NULL,
  "isApproved" SMALLINT NOT NULL DEFAULT 0,
  "isBanned" SMALLINT NOT NULL DEFAULT 0,
  "banReason" TEXT,
  created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "serverId" VARCHAR(20) NOT NULL DEFAULT 'pre-v5',
  "messageId" VARCHAR(20) DEFAULT 'pre-v5'
);

COMMENT ON TABLE archive_truths IS 'DEPRECATED: This table should not be used';

-- Recreate dropped tables (empty)
CREATE TABLE IF NOT EXISTS user_dares (
  -- Structure unknown - creating minimal placeholder
  id SERIAL PRIMARY KEY
);

COMMENT ON TABLE user_dares IS 'DEPRECATED: Superseded by user_questions table';

CREATE TABLE IF NOT EXISTS user_truths (
  -- Structure unknown - creating minimal placeholder
  id SERIAL PRIMARY KEY
);

COMMENT ON TABLE user_truths IS 'DEPRECATED: Superseded by user_questions table';

-- Rollback complete!