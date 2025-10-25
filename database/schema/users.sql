CREATE TABLE IF NOT EXISTS `users` (
  `id`               varchar(20) NOT NULL                             COMMENT 'Discord user ID (primary key)',
  `username`         longtext                                         COMMENT 'Discord username',
  `globalLevel`      int NOT NULL DEFAULT '0'                         COMMENT 'User global level across all servers',
  `globalLevelXp`    int NOT NULL DEFAULT '0'                         COMMENT 'Current XP progress toward next global level',
  `banned_questions` int NOT NULL DEFAULT '0'                         COMMENT 'Number of questions submitted by user that were banned',
  `rulesAccepted`    tinyint(1) NOT NULL DEFAULT '0'                  COMMENT 'Whether user has accepted bot rules/terms',
  `isBanned`         tinyint(1) NOT NULL DEFAULT '0'                  COMMENT 'Whether user is banned from using the bot',
  `banReason`        longtext                                         COMMENT 'Reason for user ban',
  `voteCount`        int NOT NULL DEFAULT '0'                         COMMENT 'Number of votes cast by user',
  `ban_message_id`   varchar(20) DEFAULT NULL                         COMMENT 'Discord message ID of ban notification',
  `deleteDate`       datetime DEFAULT NULL                            COMMENT 'Scheduled date for user data deletion',
  `created_datetime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP      COMMENT 'When user was first added to database',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`) /*!80000 INVISIBLE */,
  KEY `id_idx` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores Discord user data and global progression';
