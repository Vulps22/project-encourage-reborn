DO $$ BEGIN
  CREATE TYPE core_config_singleton AS ENUM ('config');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "core"."config" (
  "id" core_config_singleton NOT NULL DEFAULT 'config',
  "vote_threshold" INTEGER NOT NULL DEFAULT 3,
  PRIMARY KEY ("id")
);

COMMENT ON TABLE "core"."config" IS 'Configuration table for system values that need to be mutable without restarting the bot';
COMMENT ON COLUMN "core"."config"."vote_threshold" IS 'Number of votes required to finalise a question outcome';

INSERT INTO "core"."config" ("id", "vote_threshold") VALUES ('config', 3)
ON CONFLICT ("id") DO NOTHING;
