CREATE TABLE IF NOT EXISTS `adverts` (
  `serverId`    varchar(20) NOT NULL                                                      COMMENT 'Discord server ID that created the advertisement',
  `messageId`   varchar(20) NOT NULL                                                      COMMENT 'Discord message ID of the advertisement post on support server',
  `description` text NOT NULL                                                             COMMENT 'Brief description of the server provided by user',
  `created`     timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP                              COMMENT 'Timestamp when advertisement was created',
  `updated`     timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  COMMENT 'Timestamp when advertisement was last updated',
  PRIMARY KEY (`serverId`),
  UNIQUE KEY `id_UNIQUE` (`serverId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores server advertisements posted to the official support server';
