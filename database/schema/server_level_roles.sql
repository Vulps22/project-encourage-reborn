CREATE TABLE IF NOT EXISTS `server_level_roles` (
  `server_id` varchar(20) NOT NULL       COMMENT 'Discord server ID',
  `role_id`   varchar(20) NOT NULL       COMMENT 'Discord role ID to be awarded',
  `level`     int NOT NULL DEFAULT '0'   COMMENT 'Server level required to earn this role',
  KEY `fk_server_level_roles_server_id` (`server_id`),
  CONSTRAINT `fk_server_level_roles_server_id` FOREIGN KEY (`server_id`) REFERENCES `servers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Defines role rewards for reaching specific server levels';
