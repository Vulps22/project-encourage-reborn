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
