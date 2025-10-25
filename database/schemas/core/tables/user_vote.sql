
CREATE TABLE IF NOT EXISTS "user_vote" ("message_id" VARCHAR(20) NOT NULL,
  "user_id" VARCHAR(20) NOT NULL,
  PRIMARY KEY ("message_id")
);
 
COMMENT ON TABLE "user_vote" IS 'Records which users have voted on question outcomes';
