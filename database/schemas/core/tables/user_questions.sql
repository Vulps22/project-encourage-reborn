
CREATE TABLE IF NOT EXISTS "user_questions" ("message_id" BIGINT NOT NULL,
  "user_id" BIGINT NOT NULL,
  "question_id" INTEGER NOT NULL,
  "server_id" BIGINT NOT NULL,
  "channel_id" BIGINT DEFAULT NULL,
  "username" TEXT NOT NULL,
  "image_url" TEXT,
  "done_count" INTEGER NOT NULL DEFAULT 0,
  "failed_count" INTEGER NOT NULL DEFAULT 0,
  "skipped" BOOLEAN NOT NULL DEFAULT FALSE,
  "type" VARCHAR(10) NOT NULL,
  "final_result" VARCHAR(10) DEFAULT NULL,
  "finalised_datetime" TIMESTAMP DEFAULT NULL,
  "datetime_created" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("message_id")
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS "idx_user" ON "user_questions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_server" ON "user_questions"("server_id");
CREATE INDEX IF NOT EXISTS "idx_question" ON "user_questions"("question_id");
CREATE INDEX IF NOT EXISTS "idx_created" ON "user_questions"("datetime_created");
CREATE INDEX IF NOT EXISTS "idx_type" ON "user_questions"("type");
CREATE INDEX IF NOT EXISTS "idx_final_result" ON "user_questions"("final_result");
 
COMMENT ON TABLE "user_questions" IS 'Tracks user responses to questions with voting and completion status';
COMMENT ON COLUMN "user_questions"."question_id" IS 'ID reference to questions table';
COMMENT ON COLUMN "user_questions"."username" IS 'Discord username at time of question';
COMMENT ON COLUMN "user_questions"."image_url" IS 'Profile image URL at time of question';
COMMENT ON COLUMN "user_questions"."done_count" IS 'Number of votes for successful completion';
COMMENT ON COLUMN "user_questions"."failed_count" IS 'Number of votes for failure';
COMMENT ON COLUMN "user_questions"."skipped" IS 'Whether user skipped the question';
COMMENT ON COLUMN "user_questions"."skipped" IS 'When the final result was determined (set by trigger)';
