-- Migration: #26 - Database schema cleanup
-- Description: Drop redundant tables and standardize naming to snake_case
-- Date: 2025-10-25
-- Issue: https://github.com/Vulps22/project-encourage-reborn/issues/26

-- =====================================================
-- DROP REDUNDANT TABLES
-- =====================================================
-- user_dares and user_truths are superseded by user_questions table
-- These tables are no longer used by the bot

DROP TABLE IF EXISTS user_dares;
DROP TABLE IF EXISTS user_truths;

-- =====================================================
-- STANDARDIZE NAMING TO SNAKE_CASE
-- =====================================================
-- All camelCase columns renamed to snake_case per SQL convention

-- questions table
ALTER TABLE questions
  CHANGE COLUMN isApproved is_approved TINYINT NOT NULL DEFAULT 0,
  CHANGE COLUMN approvedBy approved_by VARCHAR(20) NOT NULL DEFAULT 'pre-v5-6',
  CHANGE COLUMN isBanned is_banned TINYINT NOT NULL DEFAULT 0,
  CHANGE COLUMN banReason ban_reason TEXT,
  CHANGE COLUMN bannedBy banned_by VARCHAR(20) DEFAULT NULL,
  CHANGE COLUMN serverId server_id VARCHAR(20) NOT NULL DEFAULT 'pre-v5',
  CHANGE COLUMN messageId message_id VARCHAR(20) DEFAULT 'pre-v5',
  CHANGE COLUMN isDeleted is_deleted TINYINT NOT NULL DEFAULT 0;

-- users table
ALTER TABLE users
  CHANGE COLUMN globalLevel global_level INT NOT NULL DEFAULT 0,
  CHANGE COLUMN globalLevelXp global_level_xp INT NOT NULL DEFAULT 0,
  CHANGE COLUMN rulesAccepted rules_accepted TINYINT(1) NOT NULL DEFAULT 0,
  CHANGE COLUMN isBanned is_banned TINYINT(1) NOT NULL DEFAULT 0,
  CHANGE COLUMN banReason ban_reason LONGTEXT,
  CHANGE COLUMN voteCount vote_count INT NOT NULL DEFAULT 0,
  CHANGE COLUMN deleteDate delete_date DATETIME DEFAULT NULL;

-- servers table
ALTER TABLE servers
  CHANGE COLUMN hasAccepted has_accepted TINYINT(1) NOT NULL DEFAULT 0,
  CHANGE COLUMN isBanned is_banned TINYINT(1) NOT NULL DEFAULT 0,
  CHANGE COLUMN banReason ban_reason TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  CHANGE COLUMN isDeleted is_deleted TINYINT NOT NULL DEFAULT 0;

-- user_questions table
ALTER TABLE user_questions
  CHANGE COLUMN messageId message_id VARCHAR(20) NOT NULL,
  CHANGE COLUMN userId user_id VARCHAR(20) NOT NULL,
  CHANGE COLUMN questionId question_id INT NOT NULL,
  CHANGE COLUMN serverId server_id VARCHAR(20) NOT NULL,
  CHANGE COLUMN channelId channel_id VARCHAR(20) NOT NULL DEFAULT 'PRE_5_7_0',
  CHANGE COLUMN imageUrl image_url TEXT,
  CHANGE COLUMN doneCount done_count INT NOT NULL DEFAULT 0,
  CHANGE COLUMN failedCount failed_count INT NOT NULL DEFAULT 0,
  CHANGE COLUMN finalResult final_result VARCHAR(10) DEFAULT NULL;

-- given_questions table
ALTER TABLE given_questions
  CHANGE COLUMN senderId sender_id VARCHAR(20) NOT NULL,
  CHANGE COLUMN targetId target_id VARCHAR(20) NOT NULL,
  CHANGE COLUMN serverId server_id VARCHAR(20) NOT NULL,
  CHANGE COLUMN messageId message_id VARCHAR(20) DEFAULT NULL,
  CHANGE COLUMN doneCount done_count INT NOT NULL DEFAULT 0,
  CHANGE COLUMN failCount fail_count INT NOT NULL DEFAULT 0,
  CHANGE COLUMN xpType xp_type VARCHAR(10) NOT NULL DEFAULT 'global';

-- reports table
ALTER TABLE reports
  CHANGE COLUMN moderatorId moderator_id VARCHAR(20) DEFAULT NULL,
  CHANGE COLUMN banReason ban_reason TEXT,
  CHANGE COLUMN senderId sender_id VARCHAR(20) NOT NULL,
  CHANGE COLUMN offenderId offender_id VARCHAR(20) NOT NULL,
  CHANGE COLUMN serverId server_id VARCHAR(20) NOT NULL;
