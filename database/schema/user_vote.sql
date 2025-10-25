CREATE TABLE IF NOT EXISTS `user_vote` (
  `message_id` varchar(20) NOT NULL   COMMENT 'Discord message ID of the question being voted on',
  `user_id`    varchar(20) NOT NULL   COMMENT 'Discord user ID of the voter',
  PRIMARY KEY (`message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Records which users have voted on question outcomes';
