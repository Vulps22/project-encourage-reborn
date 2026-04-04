
CREATE TABLE IF NOT EXISTS "server"."servers" (
  "id" BIGINT NOT NULL,
  "name" TEXT,
  "user_id" BIGINT NOT NULL,
  "has_accepted" BOOLEAN NOT NULL DEFAULT FALSE,
  "can_create" BOOLEAN NOT NULL DEFAULT FALSE,
  "is_banned" BOOLEAN NOT NULL DEFAULT FALSE,
  "ban_reason" TEXT,
  "banned_by" BIGINT DEFAULT NULL,
  "datetime_banned" TIMESTAMP DEFAULT NULL,
  "date_created" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "date_updated" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dare_success_xp" INTEGER NOT NULL DEFAULT '50',
  "dare_fail_xp" INTEGER NOT NULL DEFAULT '25',
  "truth_success_xp" INTEGER DEFAULT '40',
  "truth_fail_xp" INTEGER DEFAULT '40',
  "message_xp" INTEGER NOT NULL DEFAULT 0,
  "level_up_channel" BIGINT DEFAULT NULL,
  "announcement_channel" BIGINT DEFAULT NULL,
  "is_entitled" BOOLEAN NOT NULL DEFAULT FALSE,
  "entitlement_end_date" TIMESTAMP DEFAULT NULL,
  "message_id" BIGINT DEFAULT NULL,
  "is_deleted" BOOLEAN NOT NULL DEFAULT FALSE,
  "datetime_deleted" TIMESTAMP DEFAULT NULL,
  "playtest_notified" BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY ("id")
);
 
CREATE UNIQUE INDEX IF NOT EXISTS "id" ON "server"."servers"("id");
CREATE INDEX IF NOT EXISTS "id_idx" ON "server"."servers"("id");

-- Performance indexes
CREATE INDEX IF NOT EXISTS "idx_user_id" ON "server"."servers"("user_id");
CREATE INDEX IF NOT EXISTS "idx_entitled" ON "server"."servers"("is_entitled");
CREATE INDEX IF NOT EXISTS "idx_deleted" ON "server"."servers"("is_deleted");

COMMENT ON TABLE "server"."servers" IS 'Stores Discord server configuration and settings';
COMMENT ON COLUMN "server"."servers"."id" IS 'Discord server (guild) ID';
COMMENT ON COLUMN "server"."servers"."date_created" IS 'When the server was first registered with the bot';
COMMENT ON COLUMN "server"."servers"."date_updated" IS 'When the server record was last updated';
COMMENT ON COLUMN "server"."servers"."level_up_channel" IS 'Discord channel ID where level-up announcements are posted';
COMMENT ON COLUMN "server"."servers"."announcement_channel" IS 'Discord channel ID for bot announcements';
COMMENT ON COLUMN "server"."servers"."message_id" IS 'Discord message ID of the server advert post in the support server';
COMMENT ON COLUMN "server"."servers"."name" IS 'Discord server name';
COMMENT ON COLUMN "server"."servers"."user_id" IS 'Discord user ID of the server owner';
COMMENT ON COLUMN "server"."servers"."has_accepted" IS 'Whether owner has accepted bot terms/rules';
COMMENT ON COLUMN "server"."servers"."can_create" IS 'Whether server can create new truth/dare questions (requires rules acceptance)';
COMMENT ON COLUMN "server"."servers"."is_banned" IS 'Whether server is banned from using the bot';
COMMENT ON COLUMN "server"."servers"."ban_reason" IS 'Reason for server ban';
COMMENT ON COLUMN "server"."servers"."banned_by" IS 'Discord user ID of the moderator who banned the server';
COMMENT ON COLUMN "server"."servers"."datetime_banned" IS 'When the server was banned';
COMMENT ON COLUMN "server"."servers"."dare_success_xp" IS 'XP awarded for successfully completing a dare';
COMMENT ON COLUMN "server"."servers"."dare_fail_xp" IS 'XP awarded for failing a dare';
COMMENT ON COLUMN "server"."servers"."truth_success_xp" IS 'XP awarded for successfully completing a truth';
COMMENT ON COLUMN "server"."servers"."truth_fail_xp" IS 'XP awarded for failing a truth';
COMMENT ON COLUMN "server"."servers"."message_xp" IS 'XP awarded per message (if enabled)';
COMMENT ON COLUMN "server"."servers"."is_entitled" IS 'Whether server has active premium entitlement';
COMMENT ON COLUMN "server"."servers"."entitlement_end_date" IS 'When premium entitlement expires';
COMMENT ON COLUMN "server"."servers"."is_deleted" IS 'Whether server has been soft deleted';
COMMENT ON COLUMN "server"."servers"."datetime_deleted" IS 'When server was soft deleted';
COMMENT ON COLUMN "server"."servers"."playtest_notified" IS 'Whether the server has been shown the playtest notice on first interaction';
