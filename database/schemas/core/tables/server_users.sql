
CREATE TABLE IF NOT EXISTS "server_users" ("user_id" BIGINT NOT NULL,
  "server_id" BIGINT NOT NULL,
  "level" INTEGER NOT NULL DEFAULT 0,
  "level_xp" INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY ("user_id", "server_id"),
  CONSTRAINT "fk_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED
);
 
CREATE INDEX IF NOT EXISTS "user_idx" ON "server_users"("user_id");

COMMENT ON TABLE "server_users" IS 'Tracks user level and XP progress per server';
COMMENT ON COLUMN "server_users"."server_level" IS 'User level within this specific server';
COMMENT ON COLUMN "server_users"."server_level_xp" IS 'Current XP progress toward next server level';
