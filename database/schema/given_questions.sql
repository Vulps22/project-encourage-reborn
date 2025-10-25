CREATE TABLE IF NOT EXISTS `given_questions` (
  `id`         int NOT NULL AUTO_INCREMENT                      COMMENT 'Unique identifier for the given question',
  `senderId`   varchar(20) NOT NULL                             COMMENT 'Discord user ID of the person giving the question',
  `targetId`   varchar(20) NOT NULL                             COMMENT 'Discord user ID of the person receiving the question',
  `serverId`   varchar(20) NOT NULL                             COMMENT 'Discord server ID where question was given',
  `messageId`  varchar(20) DEFAULT NULL                         COMMENT 'Discord message ID of the question',
  `question`   longtext NOT NULL                                COMMENT 'The question text',
  `wager`      bigint NOT NULL                                  COMMENT 'Amount of XP wagered - transferred to target if completed',
  `doneCount`  int NOT NULL DEFAULT '0'                         COMMENT 'Number of completion votes',
  `failCount`  int NOT NULL DEFAULT '0'                         COMMENT 'Number of failure votes',
  `skipped`    tinyint NOT NULL DEFAULT '0'                     COMMENT 'Whether the question was skipped',
  `created`    datetime NOT NULL DEFAULT CURRENT_TIMESTAMP      COMMENT 'When the question was given',
  `type`       varchar(10) NOT NULL                             COMMENT 'Question type: "truth" or "dare"',
  `xpType`     varchar(10) NOT NULL DEFAULT 'global'            COMMENT 'Where XP is awarded: "global" or "server"',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=317 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores questions given from one user to another with XP wager';
