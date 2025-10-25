
CREATE TABLE IF NOT EXISTS "user_questions" ("message_id" VARCHAR(20) NOT NULL,
  "user_id" VARCHAR(20) NOT NULL,
  "question_id" INTEGER NOT NULL,
  "server_id" VARCHAR(20) NOT NULL,
  "channel_id" VARCHAR(20) NOT NULL DEFAULT 'PRE_5_7_0',
  "username" TEXT NOT NULL,
  "image_url" TEXT,
  "done_count" INTEGER NOT NULL DEFAULT 0,
  "failed_count" INTEGER NOT NULL DEFAULT 0,
  "skipped" SMALLINT NOT NULL DEFAULT 0,
  "type" VARCHAR(10) NOT NULL,
  "final_result" VARCHAR(10) DEFAULT NULL,
  "finalised_datetime" TIMESTAMP DEFAULT NULL,
  "datetime_created" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("message_id")
);
 
COMMENT ON TABLE "user_questions" IS 'Tracks user responses to questions with voting and completion status';
COMMENT ON COLUMN "user_questions"."question_id" IS 'ID reference to questions table';
COMMENT ON COLUMN "user_questions"."username" IS 'Discord username at time of question';
COMMENT ON COLUMN "user_questions"."image_url" IS 'Profile image URL at time of question';
COMMENT ON COLUMN "user_questions"."done_count" IS 'Number of votes for successful completion';
COMMENT ON COLUMN "user_questions"."failed_count" IS 'Number of votes for failure';
COMMENT ON COLUMN "user_questions"."skipped" IS 'Whether user skipped the question';
COMMENT ON COLUMN "user_questions"."skipped" IS 'When the final result was determined (set by trigger)';
