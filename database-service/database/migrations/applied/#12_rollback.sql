-- Remove playtest_notified column from servers table
ALTER TABLE "moderation"."reports"
  DROP COLUMN IF EXISTS "content";
