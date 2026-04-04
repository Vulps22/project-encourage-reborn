
CREATE TABLE IF NOT EXISTS "user"."users" ("id" BIGINT NOT NULL,
  "username" TEXT,
  "global_level" INTEGER NOT NULL DEFAULT 0,
  "global_level_xp" INTEGER NOT NULL DEFAULT 0,
  "banned_questions" INTEGER NOT NULL DEFAULT 0,
  "rules_accepted" BOOLEAN NOT NULL DEFAULT FALSE,
  "is_banned" BOOLEAN NOT NULL DEFAULT FALSE,
  "ban_reason" TEXT,
  "vote_count" INTEGER NOT NULL DEFAULT 0,
  "ban_message_id" BIGINT DEFAULT NULL,
  "delete_date" TIMESTAMP DEFAULT NULL,
  "created_datetime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
 
CREATE UNIQUE INDEX IF NOT EXISTS "id_UNIQUE" ON "user"."users"("id");
CREATE INDEX IF NOT EXISTS "id_idx" ON "user"."users"("id");

-- Performance indexes
CREATE INDEX IF NOT EXISTS "idx_level_xp" ON "user"."users"("global_level", "global_level_xp");
CREATE INDEX IF NOT EXISTS "idx_banned" ON "user"."users"("is_banned");

COMMENT ON TABLE "user"."users" IS 'Stores Discord user data and global progression';
COMMENT ON COLUMN "user"."users"."username" IS 'Discord username';
COMMENT ON COLUMN "user"."users"."global_level" IS 'User global level across all servers';
COMMENT ON COLUMN "user"."users"."global_level_xp" IS 'Current XP progress toward next global level';
COMMENT ON COLUMN "user"."users"."banned_questions" IS 'Number of questions submitted by user that were banned';
COMMENT ON COLUMN "user"."users"."rules_accepted" IS 'Whether user has accepted bot rules/terms';
COMMENT ON COLUMN "user"."users"."is_banned" IS 'Whether user is banned from using the bot';
COMMENT ON COLUMN "user"."users"."ban_reason" IS 'Reason for user ban';
COMMENT ON COLUMN "user"."users"."vote_count" IS 'Number of votes cast by user';
COMMENT ON COLUMN "user"."users"."id" IS 'Discord user ID';
COMMENT ON COLUMN "user"."users"."ban_message_id" IS 'Discord message ID of the ban notification message';
COMMENT ON COLUMN "user"."users"."created_datetime" IS 'When the user was first seen by the bot';
COMMENT ON COLUMN "user"."users"."delete_date" IS 'Scheduled date for user data deletion';
