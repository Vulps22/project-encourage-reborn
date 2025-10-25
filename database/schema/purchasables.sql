CREATE TABLE IF NOT EXISTS `purchasables` (
  `id`             int NOT NULL AUTO_INCREMENT                      COMMENT 'Unique identifier for the purchasable item',
  `application_id` varchar(20) NOT NULL                             COMMENT 'Discord application ID',
  `environment`    enum('dev','prod') NOT NULL                      COMMENT 'Environment where this purchasable is available',
  `name`           varchar(50) NOT NULL                             COMMENT 'Display name of the purchasable item',
  `sku_id`         varchar(20) NOT NULL                             COMMENT 'Discord SKU (Stock Keeping Unit) ID',
  `type`           enum('consumable','subscription') NOT NULL       COMMENT 'Type of purchase: consumable (one-time) or subscription (recurring)',
  `created_at`     timestamp NULL DEFAULT CURRENT_TIMESTAMP         COMMENT 'When this purchasable was created',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Defines available Discord subscription/consumable products for purchase';
