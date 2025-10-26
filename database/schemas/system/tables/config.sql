
DO $$ BEGIN
    CREATE TYPE config_environment AS ENUM ('prod', 'stage', 'dev');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "config" ("id" SERIAL,
  "maintenance_mode" BOOLEAN NOT NULL DEFAULT FALSE,
  "maintenance_reason" TEXT,
  "dares_log" BIGINT DEFAULT NULL,
  "truths_log" BIGINT DEFAULT NULL,
  "servers_log" BIGINT DEFAULT NULL,
  "reports_log" BIGINT DEFAULT NULL,
  "banned_users_log" BIGINT DEFAULT NULL,
  "errors_log" BIGINT DEFAULT NULL,
  "advertChannel" BIGINT NOT NULL,
  "required_votes" INTEGER NOT NULL DEFAULT '3',
  "environment" config_environment NOT NULL DEFAULT 'dev',
  "client" BIGINT NOT NULL,
  "secret" VARCHAR(90) NOT NULL,
  "guildId" BIGINT NOT NULL DEFAULT 1079206786021732412,
  "logs" BIGINT NOT NULL,
  "top_gg_token" VARCHAR(200) DEFAULT NULL,
  "top_gg_webhook_secret" VARCHAR(90) DEFAULT NULL,
  "announce_password" VARCHAR(90) DEFAULT NULL,
  "bot_invite_url" TEXT NOT NULL,
  "discord_invite_code" VARCHAR(10) NOT NULL,
  "announcementChannelId" BIGINT DEFAULT NULL,
  "updateChannelId" BIGINT DEFAULT NULL,
  PRIMARY KEY ("id")
);
 
CREATE UNIQUE INDEX IF NOT EXISTS "id_UNIQUE" ON "config"("id");

COMMENT ON TABLE "config" IS 'DEPRECATED: Used for database-based config in production. Moving to .env in rewrite.';
