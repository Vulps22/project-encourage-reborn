-- Migration: #26 - Database schema cleanup and optimization
-- Description: Drop archive tables, convert Discord IDs to BIGINT, standardize booleans, add indexes
-- Date: 2025-10-25
-- Issue: https://github.com/Vulps22/project-encourage-reborn/issues/26

-- =====================================================
-- PHASE 1: DROP REDUNDANT TABLES
-- =====================================================
-- These tables are no longer used by the bot

DROP TABLE IF EXISTS archive_dares;
DROP TABLE IF EXISTS archive_truths;
DROP TABLE IF EXISTS user_dares;
DROP TABLE IF EXISTS user_truths;

-- =====================================================
-- PHASE 2: RENAME COLUMNS FROM camelCase TO snake_case
-- =====================================================
-- PostgreSQL requires columns to exist before renaming them

-- questions table
ALTER TABLE core.questions
  RENAME COLUMN "isApproved" TO is_approved;
ALTER TABLE core.questions
  RENAME COLUMN "approvedBy" TO approved_by;
ALTER TABLE core.questions
  RENAME COLUMN "isBanned" TO is_banned;
ALTER TABLE core.questions
  RENAME COLUMN "banReason" TO ban_reason;
ALTER TABLE core.questions
  RENAME COLUMN "bannedBy" TO banned_by;
ALTER TABLE core.questions
  RENAME COLUMN "serverId" TO server_id;
ALTER TABLE core.questions
  RENAME COLUMN "messageId" TO message_id;
ALTER TABLE core.questions
  RENAME COLUMN "isDeleted" TO is_deleted;

-- users table
ALTER TABLE core.users
  RENAME COLUMN "globalLevel" TO global_level;
ALTER TABLE core.users
  RENAME COLUMN "globalLevelXp" TO global_level_xp;
ALTER TABLE core.users
  RENAME COLUMN "rulesAccepted" TO rules_accepted;
ALTER TABLE core.users
  RENAME COLUMN "isBanned" TO is_banned;
ALTER TABLE core.users
  RENAME COLUMN "banReason" TO ban_reason;
ALTER TABLE core.users
  RENAME COLUMN "voteCount" TO vote_count;
ALTER TABLE core.users
  RENAME COLUMN "deleteDate" TO delete_date;

-- servers table
ALTER TABLE core.servers
  RENAME COLUMN "hasAccepted" TO has_accepted;
ALTER TABLE core.servers
  RENAME COLUMN "isBanned" TO is_banned;
ALTER TABLE core.servers
  RENAME COLUMN "banReason" TO ban_reason;
ALTER TABLE core.servers
  RENAME COLUMN "isDeleted" TO is_deleted;

-- user_questions table
ALTER TABLE core.user_questions
  RENAME COLUMN "messageId" TO message_id;
ALTER TABLE core.user_questions
  RENAME COLUMN "userId" TO user_id;
ALTER TABLE core.user_questions
  RENAME COLUMN "questionId" TO question_id;
ALTER TABLE core.user_questions
  RENAME COLUMN "serverId" TO server_id;
ALTER TABLE core.user_questions
  RENAME COLUMN "channelId" TO channel_id;
ALTER TABLE core.user_questions
  RENAME COLUMN "imageUrl" TO image_url;
ALTER TABLE core.user_questions
  RENAME COLUMN "doneCount" TO done_count;
ALTER TABLE core.user_questions
  RENAME COLUMN "failedCount" TO failed_count;
ALTER TABLE core.user_questions
  RENAME COLUMN "finalResult" TO final_result;

-- given_questions table
ALTER TABLE core.given_questions
  RENAME COLUMN "senderId" TO sender_id;
ALTER TABLE core.given_questions
  RENAME COLUMN "targetId" TO target_id;
ALTER TABLE core.given_questions
  RENAME COLUMN "serverId" TO server_id;
ALTER TABLE core.given_questions
  RENAME COLUMN "messageId" TO message_id;
ALTER TABLE core.given_questions
  RENAME COLUMN "doneCount" TO done_count;
ALTER TABLE core.given_questions
  RENAME COLUMN "failCount" TO fail_count;
ALTER TABLE core.given_questions
  RENAME COLUMN "xpType" TO xp_type;

-- reports table
ALTER TABLE moderation.reports
  RENAME COLUMN "moderatorId" TO moderator_id;
ALTER TABLE moderation.reports
  RENAME COLUMN "banReason" TO ban_reason;
ALTER TABLE moderation.reports
  RENAME COLUMN "senderId" TO sender_id;
ALTER TABLE moderation.reports
  RENAME COLUMN "offenderId" TO offender_id;
ALTER TABLE moderation.reports
  RENAME COLUMN "serverId" TO server_id;

-- entitlements table
ALTER TABLE premium.entitlements
  RENAME COLUMN "skuId" TO sku_id;
ALTER TABLE premium.entitlements
  RENAME COLUMN "userId" TO user_id;
ALTER TABLE premium.entitlements
  RENAME COLUMN "guildId" TO guild_id;

-- adverts table
ALTER TABLE premium.adverts
  RENAME COLUMN "serverId" TO server_id;
ALTER TABLE premium.adverts
  RENAME COLUMN "messageId" TO message_id;

-- config table
ALTER TABLE system.config
  RENAME COLUMN "advertChannel" TO advert_channel;
ALTER TABLE system.config
  RENAME COLUMN "guildId" TO guild_id;
ALTER TABLE system.config
  RENAME COLUMN "announcementChannelId" TO announcement_channel_id;
ALTER TABLE system.config
  RENAME COLUMN "updateChannelId" TO update_channel_id;

-- =====================================================
-- PHASE 3: CONVERT DISCORD IDS TO BIGINT
-- =====================================================
-- Convert all VARCHAR(20) Discord IDs to BIGINT for better performance

-- users table
ALTER TABLE core.users
  ALTER COLUMN id TYPE BIGINT USING (id::BIGINT),
  ALTER COLUMN ban_message_id TYPE BIGINT USING (
    CASE WHEN ban_message_id IS NULL THEN NULL ELSE ban_message_id::BIGINT END
  );

-- servers table
ALTER TABLE core.servers
  ALTER COLUMN id TYPE BIGINT USING (id::BIGINT),
  ALTER COLUMN owner TYPE BIGINT USING (owner::BIGINT),
  ALTER COLUMN level_up_channel TYPE BIGINT USING (
    CASE WHEN level_up_channel = 'UNSET' THEN NULL ELSE level_up_channel::BIGINT END
  ),
  ALTER COLUMN announcement_channel TYPE BIGINT USING (
    CASE WHEN announcement_channel = 'UNSET' THEN NULL ELSE announcement_channel::BIGINT END
  ),
  ALTER COLUMN message_id TYPE BIGINT USING (
    CASE WHEN message_id IS NULL THEN NULL ELSE message_id::BIGINT END
  );

-- questions table
ALTER TABLE core.questions
  ALTER COLUMN creator TYPE BIGINT USING (creator::BIGINT),
  ALTER COLUMN approved_by TYPE BIGINT USING (
    CASE WHEN approved_by = 'pre-v5-6' THEN NULL ELSE approved_by::BIGINT END
  ),
  ALTER COLUMN banned_by TYPE BIGINT USING (
    CASE WHEN banned_by IS NULL THEN NULL ELSE banned_by::BIGINT END
  ),
  ALTER COLUMN server_id TYPE BIGINT USING (
    CASE WHEN server_id = 'pre-v5' THEN NULL ELSE server_id::BIGINT END
  ),
  ALTER COLUMN message_id TYPE BIGINT USING (
    CASE WHEN message_id = 'pre-v5' OR message_id IS NULL THEN NULL ELSE message_id::BIGINT END
  );

-- user_questions table
ALTER TABLE core.user_questions
  ALTER COLUMN message_id TYPE BIGINT USING (message_id::BIGINT),
  ALTER COLUMN user_id TYPE BIGINT USING (user_id::BIGINT),
  ALTER COLUMN server_id TYPE BIGINT USING (server_id::BIGINT),
  ALTER COLUMN channel_id TYPE BIGINT USING (
    CASE WHEN channel_id = 'PRE_5_7_0' THEN NULL ELSE channel_id::BIGINT END
  );

-- given_questions table
ALTER TABLE core.given_questions
  ALTER COLUMN sender_id TYPE BIGINT USING (sender_id::BIGINT),
  ALTER COLUMN target_id TYPE BIGINT USING (target_id::BIGINT),
  ALTER COLUMN server_id TYPE BIGINT USING (server_id::BIGINT),
  ALTER COLUMN message_id TYPE BIGINT USING (
    CASE WHEN message_id IS NULL THEN NULL ELSE message_id::BIGINT END
  );

-- server_users table
ALTER TABLE core.server_users
  ALTER COLUMN user_id TYPE BIGINT USING (user_id::BIGINT),
  ALTER COLUMN server_id TYPE BIGINT USING (server_id::BIGINT);

-- server_level_roles table
ALTER TABLE core.server_level_roles
  ALTER COLUMN server_id TYPE BIGINT USING (server_id::BIGINT),
  ALTER COLUMN role_id TYPE BIGINT USING (role_id::BIGINT);

-- user_vote table
ALTER TABLE core.user_vote
  ALTER COLUMN message_id TYPE BIGINT USING (message_id::BIGINT),
  ALTER COLUMN user_id TYPE BIGINT USING (user_id::BIGINT);

-- reports table
ALTER TABLE moderation.reports
  ALTER COLUMN moderator_id TYPE BIGINT USING (
    CASE WHEN moderator_id IS NULL THEN NULL ELSE moderator_id::BIGINT END
  ),
  ALTER COLUMN sender_id TYPE BIGINT USING (sender_id::BIGINT),
  ALTER COLUMN offender_id TYPE BIGINT USING (offender_id::BIGINT),
  ALTER COLUMN server_id TYPE BIGINT USING (server_id::BIGINT);

-- entitlements table
ALTER TABLE premium.entitlements
  ALTER COLUMN id TYPE BIGINT USING (id::BIGINT),
  ALTER COLUMN sku_id TYPE BIGINT USING (sku_id::BIGINT),
  ALTER COLUMN user_id TYPE BIGINT USING (user_id::BIGINT),
  ALTER COLUMN guild_id TYPE BIGINT USING (
    CASE WHEN guild_id IS NULL THEN NULL ELSE guild_id::BIGINT END
  );

-- purchasables table
ALTER TABLE premium.purchasables
  ALTER COLUMN application_id TYPE BIGINT USING (application_id::BIGINT),
  ALTER COLUMN sku_id TYPE BIGINT USING (sku_id::BIGINT);

-- adverts table
ALTER TABLE premium.adverts
  ALTER COLUMN server_id TYPE BIGINT USING (server_id::BIGINT),
  ALTER COLUMN message_id TYPE BIGINT USING (message_id::BIGINT);

-- config table
ALTER TABLE system.config
  ALTER COLUMN dares_log TYPE BIGINT USING (
    CASE WHEN dares_log IS NULL THEN NULL ELSE dares_log::BIGINT END
  ),
  ALTER COLUMN truths_log TYPE BIGINT USING (
    CASE WHEN truths_log IS NULL THEN NULL ELSE truths_log::BIGINT END
  ),
  ALTER COLUMN servers_log TYPE BIGINT USING (
    CASE WHEN servers_log IS NULL THEN NULL ELSE servers_log::BIGINT END
  ),
  ALTER COLUMN reports_log TYPE BIGINT USING (
    CASE WHEN reports_log IS NULL THEN NULL ELSE reports_log::BIGINT END
  ),
  ALTER COLUMN banned_users_log TYPE BIGINT USING (
    CASE WHEN banned_users_log IS NULL THEN NULL ELSE banned_users_log::BIGINT END
  ),
  ALTER COLUMN errors_log TYPE BIGINT USING (
    CASE WHEN errors_log IS NULL THEN NULL ELSE errors_log::BIGINT END
  ),
  ALTER COLUMN advert_channel TYPE BIGINT USING (advert_channel::BIGINT),
  ALTER COLUMN client TYPE BIGINT USING (client::BIGINT),
  ALTER COLUMN guild_id TYPE BIGINT USING (guild_id::BIGINT),
  ALTER COLUMN logs TYPE BIGINT USING (logs::BIGINT),
  ALTER COLUMN announcement_channel_id TYPE BIGINT USING (
    CASE WHEN announcement_channel_id IS NULL THEN NULL ELSE announcement_channel_id::BIGINT END
  ),
  ALTER COLUMN update_channel_id TYPE BIGINT USING (
    CASE WHEN update_channel_id IS NULL THEN NULL ELSE update_channel_id::BIGINT END
  );

-- =====================================================
-- PHASE 4: STANDARDIZE BOOLEAN FIELDS
-- =====================================================
-- Convert SMALLINT (0/1) fields to proper BOOLEAN type

-- questions table
ALTER TABLE core.questions
  ALTER COLUMN is_approved TYPE BOOLEAN USING (is_approved::SMALLINT::BOOLEAN),
  ALTER COLUMN is_approved SET DEFAULT FALSE,
  ALTER COLUMN is_banned TYPE BOOLEAN USING (is_banned::SMALLINT::BOOLEAN),
  ALTER COLUMN is_banned SET DEFAULT FALSE,
  ALTER COLUMN is_deleted TYPE BOOLEAN USING (is_deleted::SMALLINT::BOOLEAN),
  ALTER COLUMN is_deleted SET DEFAULT FALSE;

-- servers table
ALTER TABLE core.servers
  ALTER COLUMN is_entitled TYPE BOOLEAN USING (is_entitled::SMALLINT::BOOLEAN),
  ALTER COLUMN is_entitled SET DEFAULT FALSE,
  ALTER COLUMN is_deleted TYPE BOOLEAN USING (is_deleted::SMALLINT::BOOLEAN),
  ALTER COLUMN is_deleted SET DEFAULT FALSE;

-- user_questions table
ALTER TABLE core.user_questions
  ALTER COLUMN skipped TYPE BOOLEAN USING (skipped::SMALLINT::BOOLEAN),
  ALTER COLUMN skipped SET DEFAULT FALSE;

-- given_questions table
ALTER TABLE core.given_questions
  ALTER COLUMN skipped TYPE BOOLEAN USING (skipped::SMALLINT::BOOLEAN),
  ALTER COLUMN skipped SET DEFAULT FALSE;

-- entitlements table
ALTER TABLE premium.entitlements
  ALTER COLUMN deleted TYPE BOOLEAN USING (deleted::SMALLINT::BOOLEAN),
  ALTER COLUMN deleted SET DEFAULT FALSE,
  ALTER COLUMN consumed TYPE BOOLEAN USING (consumed::SMALLINT::BOOLEAN),
  ALTER COLUMN consumed SET DEFAULT FALSE;

-- =====================================================
-- PHASE 5: ADD PERFORMANCE INDEXES
-- =====================================================
-- Add indexes for commonly queried columns to improve performance

-- questions table indexes
CREATE INDEX IF NOT EXISTS idx_questions_type_approved ON core.questions(type, is_approved, is_banned);
CREATE INDEX IF NOT EXISTS idx_questions_server ON core.questions(server_id);
CREATE INDEX IF NOT EXISTS idx_questions_creator ON core.questions(creator);
CREATE INDEX IF NOT EXISTS idx_questions_created ON core.questions(created);

-- users table indexes
CREATE INDEX IF NOT EXISTS idx_users_level_xp ON core.users(global_level, global_level_xp);
CREATE INDEX IF NOT EXISTS idx_users_banned ON core.users(is_banned);

-- servers table indexes
CREATE INDEX IF NOT EXISTS idx_servers_owner ON core.servers(owner);
CREATE INDEX IF NOT EXISTS idx_servers_entitled ON core.servers(is_entitled);
CREATE INDEX IF NOT EXISTS idx_servers_deleted ON core.servers(is_deleted);

-- user_questions table indexes
CREATE INDEX IF NOT EXISTS idx_user_questions_user ON core.user_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_questions_server ON core.user_questions(server_id);
CREATE INDEX IF NOT EXISTS idx_user_questions_question ON core.user_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_user_questions_created ON core.user_questions(datetime_created);
CREATE INDEX IF NOT EXISTS idx_user_questions_type ON core.user_questions(type);
CREATE INDEX IF NOT EXISTS idx_user_questions_final_result ON core.user_questions(final_result);

-- given_questions table indexes
CREATE INDEX IF NOT EXISTS idx_given_questions_sender ON core.given_questions(sender_id);
CREATE INDEX IF NOT EXISTS idx_given_questions_target ON core.given_questions(target_id);
CREATE INDEX IF NOT EXISTS idx_given_questions_server ON core.given_questions(server_id);
CREATE INDEX IF NOT EXISTS idx_given_questions_created ON core.given_questions(created);

-- reports table indexes
CREATE INDEX IF NOT EXISTS idx_reports_status ON moderation.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_offender ON moderation.reports(offender_id);
CREATE INDEX IF NOT EXISTS idx_reports_server ON moderation.reports(server_id);
CREATE INDEX IF NOT EXISTS idx_reports_created ON moderation.reports(created_at);

-- Migration complete!