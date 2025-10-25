CREATE TABLE IF NOT EXISTS `questions` (
  `id`                int NOT NULL AUTO_INCREMENT                      COMMENT 'Unique identifier for the question',
  `type`              varchar(10) NOT NULL                             COMMENT 'Question type: "truth" or "dare"',
  `question`          text NOT NULL                                    COMMENT 'The question text',
  `creator`           varchar(20) NOT NULL                             COMMENT 'Discord user ID of the question creator',
  `is_approved`       tinyint NOT NULL DEFAULT '0'                     COMMENT 'Whether question has been approved by moderators',
  `approved_by`       varchar(20) NOT NULL DEFAULT 'pre-v5-6'          COMMENT 'Discord user ID of the moderator who approved',
  `datetime_approved` datetime DEFAULT NULL                            COMMENT 'When the question was approved (set by trigger)',
  `is_banned`         tinyint NOT NULL DEFAULT '0'                     COMMENT 'Whether question has been banned',
  `ban_reason`        text                                             COMMENT 'Reason for banning the question',
  `banned_by`         varchar(20) DEFAULT NULL                         COMMENT 'Discord user ID of the moderator who banned',
  `datetime_banned`   datetime DEFAULT NULL                            COMMENT 'When the question was banned (set by trigger)',
  `created`           datetime NOT NULL DEFAULT CURRENT_TIMESTAMP      COMMENT 'When the question was created',
  `server_id`         varchar(20) NOT NULL DEFAULT 'pre-v5'            COMMENT 'Discord server ID where question was submitted',
  `message_id`        varchar(20) DEFAULT 'pre-v5'                     COMMENT 'Discord message ID of the submission',
  `is_deleted`        tinyint NOT NULL DEFAULT '0'                     COMMENT 'Whether question has been soft deleted',
  `datetime_deleted`  datetime DEFAULT NULL                            COMMENT 'When the question was soft deleted',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6443 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores all truth and dare questions submitted by users';
