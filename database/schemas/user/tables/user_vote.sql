
CREATE TABLE IF NOT EXISTS "user"."user_vote" ("message_id" BIGINT NOT NULL,
  "user_id" BIGINT NOT NULL,
  PRIMARY KEY ("message_id")
);
 
COMMENT ON TABLE "user"."user_vote" IS 'Records which users have voted on question outcomes';
