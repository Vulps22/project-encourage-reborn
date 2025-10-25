
CREATE TABLE IF NOT EXISTS "users" ("id" VARCHAR(20) NOT NULL,
  "username" TEXT,
  "global_level" INTEGER NOT NULL DEFAULT 0,
  "global_level_xp" INTEGER NOT NULL DEFAULT 0,
  "banned_questions" INTEGER NOT NULL DEFAULT 0,
  "rules_accepted" BOOLEAN NOT NULL DEFAULT FALSE,
  "is_banned" BOOLEAN NOT NULL DEFAULT FALSE,
  "ban_reason" TEXT,
  "vote_count" INTEGER NOT NULL DEFAULT 0,
  "ban_message_id" VARCHAR(20) DEFAULT NULL,
  "delete_date" TIMESTAMP DEFAULT NULL,
  "created_datetime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
 
CREATE UNIQUE INDEX IF NOT EXISTS "id_UNIQUE" ON "users"("id");
CREATE INDEX IF NOT EXISTS "id_idx" ON "users"("id");

COMMENT ON TABLE "users" IS 'Stores Discord user data and global progression';
COMMENT ON COLUMN "users"."username" IS 'Discord username';
COMMENT ON COLUMN "users"."global_level" IS 'User global level across all servers';
COMMENT ON COLUMN "users"."global_level_xp" IS 'Current XP progress toward next global level';
COMMENT ON COLUMN "users"."banned_questions" IS 'Number of questions submitted by user that were banned';
COMMENT ON COLUMN "users"."rules_accepted" IS 'Whether user has accepted bot rules/terms';
COMMENT ON COLUMN "users"."is_banned" IS 'Whether user is banned from using the bot';
COMMENT ON COLUMN "users"."ban_reason" IS 'Reason for user ban';
COMMENT ON COLUMN "users"."vote_count" IS 'Number of votes cast by user';
COMMENT ON COLUMN "users"."delete_date" IS 'Scheduled date for user data deletion';
