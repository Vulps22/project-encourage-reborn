CREATE TABLE IF NOT EXISTS `reports` (
  `id`          int NOT NULL AUTO_INCREMENT                                                  COMMENT 'Unique identifier for the report',
  `type`         text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL               COMMENT 'Type of content being reported',
  `reason`       text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL               COMMENT 'User-provided reason for the report',
  `status`       enum('pending','actioning','actioned','cleared') NOT NULL DEFAULT 'pending'  COMMENT 'Current status of the report',
  `moderator_id` varchar(20) DEFAULT NULL                                                     COMMENT 'Discord user ID of moderator handling the report',
  `ban_reason`   text                                                                         COMMENT 'Moderator-provided reason if content was banned',
  `sender_id`    varchar(20) NOT NULL                                                         COMMENT 'Discord user ID who submitted the report',
  `offender_id`  varchar(20) NOT NULL                                                         COMMENT 'Discord user ID of the reported user',
  `server_id`    varchar(20) NOT NULL                                                         COMMENT 'Discord server ID where report occurred',
  `created_at`   timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP                                 COMMENT 'When the report was created',
  `updated_at`  timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP     COMMENT 'When the report was last updated',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=210 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores user reports for inappropriate questions or behavior';
