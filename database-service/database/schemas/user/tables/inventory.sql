CREATE TABLE IF NOT EXISTS "user"."inventory" (
  "id" SERIAL,
  "user_id" BIGINT NOT NULL,
  "storable_id" VARCHAR(50) NOT NULL,
  "qty" INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_inventory_user" FOREIGN KEY ("user_id") REFERENCES "user"."users" ("id") ON DELETE CASCADE,
  CONSTRAINT "fk_inventory_storable" FOREIGN KEY ("storable_id") REFERENCES "core"."storables" ("id"),
  CONSTRAINT "uq_inventory_user_storable" UNIQUE ("user_id", "storable_id"),
  CONSTRAINT "chk_inventory_qty_non_negative" CHECK ("qty" >= 0)
);

CREATE INDEX IF NOT EXISTS "idx_inventory_user_id" ON "user"."inventory" ("user_id");

COMMENT ON TABLE "user"."inventory" IS 'Tracks quantities of storables held by each user';
COMMENT ON COLUMN "user"."inventory"."user_id" IS 'Reference to the owning user';
COMMENT ON COLUMN "user"."inventory"."storable_id" IS 'Reference to the storable type';
COMMENT ON COLUMN "user"."inventory"."qty" IS 'Current quantity held; cannot go below 0';
