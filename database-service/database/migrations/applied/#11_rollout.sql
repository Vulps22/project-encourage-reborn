-- Add playtest_notified column to servers table
ALTER TABLE "server"."servers"
  ADD COLUMN IF NOT EXISTS "playtest_notified" BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN "server"."servers"."playtest_notified" IS 'Whether the server has been shown the playtest notice on first interaction';
