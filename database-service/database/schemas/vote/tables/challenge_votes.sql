CREATE TABLE IF NOT EXISTS "vote"."challenge_votes" (
  "challenge_id" INTEGER NOT NULL,
  "done_count" INTEGER NOT NULL DEFAULT 0,
  "failed_count" INTEGER NOT NULL DEFAULT 0,
  "final_result" VARCHAR(10) DEFAULT NULL,
  "finalised_datetime" TIMESTAMP DEFAULT NULL,
  PRIMARY KEY ("challenge_id")
);

CREATE INDEX IF NOT EXISTS "idx_challenge_votes_final_result" ON "vote"."challenge_votes"("final_result");

COMMENT ON TABLE "vote"."challenge_votes" IS 'Aggregate vote counts and final outcome per challenge';
COMMENT ON COLUMN "vote"."challenge_votes"."challenge_id" IS 'FK to challenge.challenges id';
COMMENT ON COLUMN "vote"."challenge_votes"."done_count" IS 'Number of done votes cast';
COMMENT ON COLUMN "vote"."challenge_votes"."failed_count" IS 'Number of failed votes cast';
COMMENT ON COLUMN "vote"."challenge_votes"."final_result" IS 'done, failed, or skipped once threshold is reached';
COMMENT ON COLUMN "vote"."challenge_votes"."finalised_datetime" IS 'When the final result was determined';

-- bot_user privileges
GRANT USAGE ON SCHEMA "vote" TO bot_user;
GRANT SELECT, INSERT, UPDATE ON "vote"."challenge_votes" TO bot_user;
