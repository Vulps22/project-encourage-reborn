-- Migration Rollback: #26 - Remove redundant tables
-- Description: Recreate user_dares and user_truths tables
-- Date: 2025-10-25
-- Issue: https://github.com/Vulps22/project-encourage-reborn/issues/26
-- WARNING: These tables will be recreated EMPTY - no data migration is performed

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
