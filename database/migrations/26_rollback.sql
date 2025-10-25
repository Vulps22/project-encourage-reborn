-- Migration Rollback: #26 - Database schema cleanup
-- Description: Reverse all changes - restore camelCase and recreate redundant tables
-- Date: 2025-10-25
-- Issue: https://github.com/Vulps22/project-encourage-reborn/issues/26
-- WARNING: Redundant tables will be recreated EMPTY - no data migration is performed

-- =====================================================
-- REVERSE SNAKE_CASE NAMING BACK TO CAMELCASE
-- =====================================================
-- Restore original camelCase column names

-- reports table
ALTER TABLE reports
  CHANGE COLUMN moderator_id moderatorId VARCHAR(20) DEFAULT NULL,
  CHANGE COLUMN ban_reason banReason TEXT,
  CHANGE COLUMN sender_id senderId VARCHAR(20) NOT NULL,
  CHANGE COLUMN offender_id offenderId VARCHAR(20) NOT NULL,
  CHANGE COLUMN server_id serverId VARCHAR(20) NOT NULL;

-- given_questions table
ALTER TABLE given_questions
  CHANGE COLUMN sender_id senderId VARCHAR(20) NOT NULL,
  CHANGE COLUMN target_id targetId VARCHAR(20) NOT NULL,
  CHANGE COLUMN server_id serverId VARCHAR(20) NOT NULL,
  CHANGE COLUMN message_id messageId VARCHAR(20) DEFAULT NULL,
  CHANGE COLUMN done_count doneCount INT NOT NULL DEFAULT 0,
  CHANGE COLUMN fail_count failCount INT NOT NULL DEFAULT 0,
  CHANGE COLUMN xp_type xpType VARCHAR(10) NOT NULL DEFAULT 'global';

-- user_questions table
ALTER TABLE user_questions
  CHANGE COLUMN message_id messageId VARCHAR(20) NOT NULL,
  CHANGE COLUMN user_id userId VARCHAR(20) NOT NULL,
  CHANGE COLUMN question_id questionId INT NOT NULL,
  CHANGE COLUMN server_id serverId VARCHAR(20) NOT NULL,
  CHANGE COLUMN channel_id channelId VARCHAR(20) NOT NULL DEFAULT 'PRE_5_7_0',
  CHANGE COLUMN image_url imageUrl TEXT,
  CHANGE COLUMN done_count doneCount INT NOT NULL DEFAULT 0,
  CHANGE COLUMN failed_count failedCount INT NOT NULL DEFAULT 0,
  CHANGE COLUMN final_result finalResult VARCHAR(10) DEFAULT NULL;

-- servers table
ALTER TABLE servers
  CHANGE COLUMN has_accepted hasAccepted TINYINT(1) NOT NULL DEFAULT 0,
  CHANGE COLUMN is_banned isBanned TINYINT(1) NOT NULL DEFAULT 0,
  CHANGE COLUMN ban_reason banReason TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  CHANGE COLUMN is_deleted isDeleted TINYINT NOT NULL DEFAULT 0;

-- users table
ALTER TABLE users
  CHANGE COLUMN global_level globalLevel INT NOT NULL DEFAULT 0,
  CHANGE COLUMN global_level_xp globalLevelXp INT NOT NULL DEFAULT 0,
  CHANGE COLUMN rules_accepted rulesAccepted TINYINT(1) NOT NULL DEFAULT 0,
  CHANGE COLUMN is_banned isBanned TINYINT(1) NOT NULL DEFAULT 0,
  CHANGE COLUMN ban_reason banReason LONGTEXT,
  CHANGE COLUMN vote_count voteCount INT NOT NULL DEFAULT 0,
  CHANGE COLUMN delete_date deleteDate DATETIME DEFAULT NULL;

-- questions table
ALTER TABLE questions
  CHANGE COLUMN is_approved isApproved TINYINT NOT NULL DEFAULT 0,
  CHANGE COLUMN approved_by approvedBy VARCHAR(20) NOT NULL DEFAULT 'pre-v5-6',
  CHANGE COLUMN is_banned isBanned TINYINT NOT NULL DEFAULT 0,
  CHANGE COLUMN ban_reason banReason TEXT,
  CHANGE COLUMN banned_by bannedBy VARCHAR(20) DEFAULT NULL,
  CHANGE COLUMN server_id serverId VARCHAR(20) NOT NULL DEFAULT 'pre-v5',
  CHANGE COLUMN message_id messageId VARCHAR(20) DEFAULT 'pre-v5',
  CHANGE COLUMN is_deleted isDeleted TINYINT NOT NULL DEFAULT 0;

-- =====================================================
-- RECREATE REDUNDANT TABLES (EMPTY)
-- =====================================================
-- WARNING: These tables are DEPRECATED and should not be used
-- They are recreated here only for rollback purposes

CREATE TABLE IF NOT EXISTS `user_dares` (
  `message_id` varchar(20) NOT NULL,
  `user_id` varchar(20) NOT NULL,
  `question_id` int NOT NULL,
  `server_id` varchar(20) NOT NULL,
  `username` text NOT NULL,
  `image_url` text NOT NULL,
  `done_count` int NOT NULL DEFAULT '0',
  `failed_count` int NOT NULL DEFAULT '0',
  `skipped` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='DEPRECATED: Delete me - replaced by user_questions table';

CREATE TABLE IF NOT EXISTS `user_truths` (
  `message_id` varchar(20) NOT NULL,
  `user_id` varchar(20) NOT NULL,
  `question_id` int NOT NULL,
  `server_id` varchar(20) NOT NULL,
  `username` text NOT NULL,
  `image_url` text NOT NULL,
  `done_count` int NOT NULL DEFAULT '0',
  `failed_count` int NOT NULL DEFAULT '0',
  `skipped` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='DEPRECATED: Delete me - replaced by user_questions table';
