
CREATE TABLE IF NOT EXISTS "server"."server_users" ("user_id" BIGINT NOT NULL,
  "server_id" BIGINT NOT NULL,
  "server_level" INTEGER NOT NULL DEFAULT 0,
  "server_level_xp" INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY ("user_id", "server_id"),
  CONSTRAINT "fk_user_id" FOREIGN KEY ("user_id") REFERENCES "user"."users" ("id") DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT "fk_server_id" FOREIGN KEY ("server_id") REFERENCES "server"."servers" ("id") DEFERRABLE INITIALLY DEFERRED
);
 
CREATE INDEX IF NOT EXISTS "user_idx" ON "server"."server_users"("user_id");

COMMENT ON TABLE "server"."server_users" IS 'Tracks user level and XP progress per server';
COMMENT ON COLUMN "server"."server_users"."user_id" IS 'Discord user ID';
COMMENT ON COLUMN "server"."server_users"."server_id" IS 'Discord server ID';
COMMENT ON COLUMN "server"."server_users"."server_level" IS 'User level within this specific server';
COMMENT ON COLUMN "server"."server_users"."server_level_xp" IS 'Current XP progress toward next server level';

-- bot_user privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON "server"."server_users" TO bot_user;
