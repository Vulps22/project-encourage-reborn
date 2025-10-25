
CREATE TABLE IF NOT EXISTS "servers" ("id" VARCHAR(20) NOT NULL,
  "name" TEXT NOT NULL,
  "owner" VARCHAR(20) NOT NULL,
  "has_accepted" BOOLEAN NOT NULL DEFAULT FALSE,
  "is_banned" BOOLEAN NOT NULL DEFAULT FALSE,
  "ban_reason" TEXT,
  "date_created" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "date_updated" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dare_success_xp" INTEGER NOT NULL DEFAULT '50',
  "dare_fail_xp" INTEGER NOT NULL DEFAULT '25',
  "truth_success_xp" INTEGER DEFAULT '40',
  "truth_fail_xp" INTEGER DEFAULT '40',
  "message_xp" INTEGER NOT NULL DEFAULT 0,
  "level_up_channel" VARCHAR(20) DEFAULT 'UNSET',
  "announcement_channel" VARCHAR(20) DEFAULT 'UNSET',
  "is_entitled" SMALLINT NOT NULL DEFAULT 0,
  "entitlement_end_date" TIMESTAMP DEFAULT NULL,
  "message_id" VARCHAR(20) DEFAULT NULL,
  "is_deleted" SMALLINT NOT NULL DEFAULT 0,
  "datetime_deleted" TIMESTAMP DEFAULT NULL,
  PRIMARY KEY ("id")
);
 
CREATE UNIQUE INDEX IF NOT EXISTS "id" ON "servers"("id");
CREATE INDEX IF NOT EXISTS "id_idx" ON "servers"("id");

COMMENT ON TABLE "servers" IS 'Stores Discord server configuration and settings';
COMMENT ON COLUMN "servers"."name" IS 'Discord server name';
COMMENT ON COLUMN "servers"."has_accepted" IS 'Whether owner has accepted bot terms/rules';
COMMENT ON COLUMN "servers"."is_banned" IS 'Whether server is banned from using the bot';
COMMENT ON COLUMN "servers"."ban_reason" IS 'Reason for server ban';
COMMENT ON COLUMN "servers"."dare_success_xp" IS 'XP awarded for successfully completing a dare';
COMMENT ON COLUMN "servers"."dare_fail_xp" IS 'XP awarded for failing a dare';
COMMENT ON COLUMN "servers"."truth_success_xp" IS 'XP awarded for successfully completing a truth';
COMMENT ON COLUMN "servers"."truth_fail_xp" IS 'XP awarded for failing a truth';
COMMENT ON COLUMN "servers"."message_xp" IS 'XP awarded per message (if enabled)';
COMMENT ON COLUMN "servers"."is_entitled" IS 'Whether server has active premium entitlement';
COMMENT ON COLUMN "servers"."entitlement_end_date" IS 'When premium entitlement expires';
COMMENT ON COLUMN "servers"."is_deleted" IS 'Whether server has been soft deleted';
COMMENT ON COLUMN "servers"."datetime_deleted" IS 'When server was soft deleted';
