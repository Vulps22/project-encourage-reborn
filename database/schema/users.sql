CREATE TABLE IF NOT EXISTS `users` (
  `id`               varchar(20) NOT NULL                             COMMENT 'Discord user ID (primary key)',
  `username`         longtext                                         COMMENT 'Discord username',
  `global_level`     int NOT NULL DEFAULT '0'                         COMMENT 'User global level across all servers',
  `global_level_xp`  int NOT NULL DEFAULT '0'                         COMMENT 'Current XP progress toward next global level',
  `banned_questions` int NOT NULL DEFAULT '0'                         COMMENT 'Number of questions submitted by user that were banned',
  `rules_accepted`   tinyint(1) NOT NULL DEFAULT '0'                  COMMENT 'Whether user has accepted bot rules/terms',
  `is_banned`        tinyint(1) NOT NULL DEFAULT '0'                  COMMENT 'Whether user is banned from using the bot',
  `ban_reason`       longtext                                         COMMENT 'Reason for user ban',
  `vote_count`       int NOT NULL DEFAULT '0'                         COMMENT 'Number of votes cast by user',
  `ban_message_id`   varchar(20) DEFAULT NULL                         COMMENT 'Discord message ID of ban notification',
  `delete_date`      datetime DEFAULT NULL                            COMMENT 'Scheduled date for user data deletion',
  `created_datetime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP      COMMENT 'When user was first added to database',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`) /*!80000 INVISIBLE */,
  KEY `id_idx` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores Discord user data and global progression';
