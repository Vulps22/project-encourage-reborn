-- Remove playtest_notified column from servers table
ALTER TABLE "server"."servers"
  DROP COLUMN IF EXISTS "playtest_notified";
