-- Migration: #26 - Database schema cleanup and optimization
-- Description: Drop archive tables, convert Discord IDs to BIGINT, standardize booleans, add indexes
-- Date: 2025-10-25
-- Issue: https://github.com/Vulps22/project-encourage-reborn/issues/26

-- =====================================================
-- RECREATE VIEWS THAT DEPEND ON MODIFIED COLUMNS
-- =====================================================
-- Include the ban_report view to ensure it uses the new column types
\i ../schemas/moderation/views/ban_report.sql

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


-- entitlements table
ALTER TABLE premium.entitlements
  RENAME COLUMN "skuId" TO sku_id;
ALTER TABLE premium.entitlements
  RENAME COLUMN "userId" TO user_id;
ALTER TABLE premium.entitlements
  RENAME COLUMN "guildId" TO guild_id;
ALTER TABLE premium.entitlements
  RENAME COLUMN "isConsumable" TO is_consumable;

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
-- Simplified: No data exists, so no need for CASE statements

-- users table
ALTER TABLE core.users
  ALTER COLUMN id TYPE BIGINT USING (id::BIGINT),
  ALTER COLUMN ban_message_id TYPE BIGINT USING (ban_message_id::BIGINT);

-- servers table
ALTER TABLE core.servers
  ALTER COLUMN id TYPE BIGINT USING (id::BIGINT),
  ALTER COLUMN owner TYPE BIGINT USING (owner::BIGINT),
  ALTER COLUMN level_up_channel TYPE BIGINT USING (level_up_channel::BIGINT),
  ALTER COLUMN announcement_channel TYPE BIGINT USING (announcement_channel::BIGINT),
  ALTER COLUMN message_id TYPE BIGINT USING (message_id::BIGINT);

-- questions table
ALTER TABLE core.questions
  ALTER COLUMN creator TYPE BIGINT USING (creator::BIGINT),
  ALTER COLUMN approved_by TYPE BIGINT USING (approved_by::BIGINT),
  ALTER COLUMN banned_by TYPE BIGINT USING (banned_by::BIGINT),
  ALTER COLUMN server_id TYPE BIGINT USING (server_id::BIGINT),
  ALTER COLUMN message_id TYPE BIGINT USING (message_id::BIGINT);

-- user_questions table
ALTER TABLE core.user_questions
  ALTER COLUMN message_id TYPE BIGINT USING (message_id::BIGINT),
  ALTER COLUMN user_id TYPE BIGINT USING (user_id::BIGINT),
  ALTER COLUMN server_id TYPE BIGINT USING (server_id::BIGINT),
  ALTER COLUMN channel_id TYPE BIGINT USING (channel_id::BIGINT);

-- given_questions table
ALTER TABLE core.given_questions
  ALTER COLUMN sender_id TYPE BIGINT USING (sender_id::BIGINT),
  ALTER COLUMN target_id TYPE BIGINT USING (target_id::BIGINT),
  ALTER COLUMN server_id TYPE BIGINT USING (server_id::BIGINT),
  ALTER COLUMN message_id TYPE BIGINT USING (message_id::BIGINT);

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
  ALTER COLUMN moderator_id TYPE BIGINT USING (moderator_id::BIGINT),
  ALTER COLUMN sender_id TYPE BIGINT USING (sender_id::BIGINT),
  ALTER COLUMN offender_id TYPE BIGINT USING (offender_id::BIGINT),
  ALTER COLUMN server_id TYPE BIGINT USING (server_id::BIGINT);

-- entitlements table
ALTER TABLE premium.entitlements
  ALTER COLUMN id TYPE BIGINT USING (id::BIGINT),
  ALTER COLUMN sku_id TYPE BIGINT USING (sku_id::BIGINT),
  ALTER COLUMN user_id TYPE BIGINT USING (user_id::BIGINT),
  ALTER COLUMN guild_id TYPE BIGINT USING (guild_id::BIGINT);

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
  ALTER COLUMN dares_log TYPE BIGINT USING (dares_log::BIGINT),
  ALTER COLUMN truths_log TYPE BIGINT USING (truths_log::BIGINT),
  ALTER COLUMN servers_log TYPE BIGINT USING (servers_log::BIGINT),
  ALTER COLUMN reports_log TYPE BIGINT USING (reports_log::BIGINT),
  ALTER COLUMN banned_users_log TYPE BIGINT USING (banned_users_log::BIGINT),
  ALTER COLUMN errors_log TYPE BIGINT USING (errors_log::BIGINT),
  ALTER COLUMN advert_channel TYPE BIGINT USING (advert_channel::BIGINT),
  ALTER COLUMN client TYPE BIGINT USING (client::BIGINT),
  ALTER COLUMN guild_id TYPE BIGINT USING (guild_id::BIGINT),
  ALTER COLUMN logs TYPE BIGINT USING (logs::BIGINT),
  ALTER COLUMN announcement_channel_id TYPE BIGINT USING (announcement_channel_id::BIGINT),
  ALTER COLUMN update_channel_id TYPE BIGINT USING (update_channel_id::BIGINT);

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