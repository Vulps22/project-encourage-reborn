-- Add playtest_notified column to servers table
ALTER TABLE "moderation"."reports"
  ADD COLUMN IF NOT EXISTS "content" TEXT NULL;

COMMENT ON COLUMN "moderation"."reports"."content" IS 'Content of the report';