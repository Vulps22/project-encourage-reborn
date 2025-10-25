CREATE TABLE IF NOT EXISTS `leaderboard_recent_top10` (
  `userId`      bigint NOT NULL,                                              COMMENT 'Discord user ID',
  `username`    varchar(64) DEFAULT NULL,                                     COMMENT 'Discord username',
  `truths_done` int DEFAULT '0',                                              COMMENT 'Number of truths completed',
  `dares_done`  int DEFAULT '0',                                              COMMENT 'Number of dares completed',
  `total_done`  int GENERATED ALWAYS AS ((`truths_done` + `dares_done`)) STORED,
  PRIMARY KEY (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='TODO: Needs cleanup - holds current top 10 users (maybe?)';
