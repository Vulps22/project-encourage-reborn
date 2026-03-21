
CREATE TABLE IF NOT EXISTS "user"."user_vote" (
  "message_id" BIGINT NOT NULL,
  "user_id" BIGINT NOT NULL,
  "vote_type" VARCHAR(10) NOT NULL,
  PRIMARY KEY ("message_id", "user_id")
);

COMMENT ON TABLE "user"."user_vote" IS 'Records which users have voted on question outcomes';
COMMENT ON COLUMN "user"."user_vote"."message_id" IS 'ID of the question message being voted on';
COMMENT ON COLUMN "user"."user_vote"."user_id" IS 'ID of the user who cast the vote';
COMMENT ON COLUMN "user"."user_vote"."vote_type" IS 'done or failed';
