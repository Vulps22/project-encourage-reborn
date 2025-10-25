CREATE TABLE IF NOT EXISTS `server_users` (
  `user_id`         varchar(20) NOT NULL,     COMMENT 'Discord user ID',
  `server_id`       varchar(20) NOT NULL,     COMMENT 'Discord server ID',
  `server_level`    int NOT NULL DEFAULT '0', COMMENT 'User level within this specific server',
  `server_level_xp` int NOT NULL DEFAULT '0', COMMENT 'Current XP progress toward next server level',
  KEY `user_idx` (`user_id`),
  CONSTRAINT `fk_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Tracks user level and XP progress per server';
