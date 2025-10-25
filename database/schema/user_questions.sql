CREATE TABLE IF NOT EXISTS `user_questions` (
  `messageId`          varchar(20) NOT NULL,                            COMMENT 'Discord message ID of the question',
  `userId`             varchar(20) NOT NULL,                            COMMENT 'Discord user ID who received the question',
  `questionId`         int NOT NULL,                                    COMMENT 'ID reference to questions table',
  `serverId`           varchar(20) NOT NULL,                            COMMENT 'Discord server ID where question was asked',
  `channelId`          varchar(20) NOT NULL DEFAULT 'PRE_5_7_0',        COMMENT 'Discord channel ID where question was posted',
  `username`           text NOT NULL,                                   COMMENT 'Discord username at time of question',
  `imageUrl`           text,                                            COMMENT 'Profile image URL at time of question',
  `doneCount`          int NOT NULL DEFAULT '0',                        COMMENT 'Number of votes for successful completion',
  `failedCount`        int NOT NULL DEFAULT '0',                        COMMENT 'Number of votes for failure',
  `skipped`            tinyint NOT NULL DEFAULT '0',                    COMMENT 'Whether user skipped the question',
  `type`               varchar(10) NOT NULL,                            COMMENT 'Question type: "truth" or "dare"',
  `finalResult`        varchar(10) DEFAULT NULL,                        COMMENT 'Final outcome: "done", "failed", or "skipped" (set by trigger)',
  `finalised_datetime` datetime DEFAULT NULL,                           COMMENT 'When the final result was determined (set by trigger)',
  `datetime_created`   datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,     COMMENT 'When the question was assigned to user',
  PRIMARY KEY (`messageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Tracks user responses to questions with voting and completion status';
