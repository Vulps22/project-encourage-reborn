-- Schema role: purchasables = catalogue of available Discord SKUs (consumable/subscription products for sale)
DO $$ BEGIN
    CREATE TYPE purchasable_environment AS ENUM ('dev', 'prod');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE purchasable_type AS ENUM ('consumable', 'subscription');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "purchasables" ("id" SERIAL,
  "application_id" BIGINT NOT NULL,
  "environment" purchasable_environment NOT NULL,
  "name" VARCHAR(50) NOT NULL,
  "sku_id" BIGINT NOT NULL,
  "type" purchasable_type NOT NULL,
  "created_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
 
COMMENT ON TABLE "purchasables" IS 'Defines available Discord subscription/consumable products for purchase';
COMMENT ON COLUMN "purchasables"."id" IS 'Unique identifier for the purchasable item';
COMMENT ON COLUMN "purchasables"."application_id" IS 'Discord application ID this purchasable belongs to';
COMMENT ON COLUMN "purchasables"."environment" IS 'Environment where this purchasable is available';
COMMENT ON COLUMN "purchasables"."name" IS 'Human-readable product name';
COMMENT ON COLUMN "purchasables"."sku_id" IS 'Discord SKU ID for this product';
COMMENT ON COLUMN "purchasables"."created_at" IS 'When this purchasable was registered';
COMMENT ON COLUMN "purchasables"."type" IS 'Type of purchase: consumable (one-time) or subscription (recurring)';

-- bot_user privileges
GRANT SELECT ON "entitlement"."purchasables" TO bot_user;
GRANT USAGE, SELECT ON SEQUENCE "entitlement"."purchasables_id_seq" TO bot_user;
