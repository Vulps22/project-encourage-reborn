
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
COMMENT ON COLUMN "purchasables"."environment" IS 'Environment where this purchasable is available';
COMMENT ON COLUMN "purchasables"."type" IS 'Type of purchase: consumable (one-time) or subscription (recurring)';
