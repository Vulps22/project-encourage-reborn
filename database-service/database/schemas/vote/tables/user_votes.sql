CREATE TABLE IF NOT EXISTS "vote"."user_votes" (
  "challenge_id" INTEGER NOT NULL,
  "user_id" BIGINT NOT NULL,
  "vote_type" VARCHAR(10) NOT NULL,
  PRIMARY KEY ("challenge_id", "user_id")
);

COMMENT ON TABLE "vote"."user_votes" IS 'Records individual user votes on challenge outcomes';
COMMENT ON COLUMN "vote"."user_votes"."challenge_id" IS 'FK to challenge.challenges id';
COMMENT ON COLUMN "vote"."user_votes"."user_id" IS 'Discord ID of the user who cast the vote';
COMMENT ON COLUMN "vote"."user_votes"."vote_type" IS 'done or failed';
