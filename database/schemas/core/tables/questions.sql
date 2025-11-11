
CREATE TABLE IF NOT EXISTS "questions" (
  "id" SERIAL,
  "type" VARCHAR(10) NOT NULL,
  "question" TEXT NOT NULL,
  "user_id" BIGINT NOT NULL,
  "is_approved" BOOLEAN NOT NULL DEFAULT FALSE,
  "approved_by" BIGINT DEFAULT NULL,
  "datetime_approved" TIMESTAMP DEFAULT NULL,
  "is_banned" BOOLEAN NOT NULL DEFAULT FALSE,
  "ban_reason" TEXT,
  "banned_by" BIGINT DEFAULT NULL,
  "datetime_banned" TIMESTAMP DEFAULT NULL,
  "created" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "server_id" BIGINT DEFAULT NULL,
  "message_id" BIGINT DEFAULT NULL,
  "is_deleted" BOOLEAN NOT NULL DEFAULT FALSE,
  "datetime_deleted" TIMESTAMP DEFAULT NULL,
  PRIMARY KEY ("id")
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS "idx_type_approved" ON "questions"("type", "is_approved", "is_banned");
CREATE INDEX IF NOT EXISTS "idx_server" ON "questions"("server_id");
CREATE INDEX IF NOT EXISTS "idx_user_id" ON "questions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_created" ON "questions"("created");
 
COMMENT ON TABLE "questions" IS 'Stores all truth and dare questions submitted by users';
COMMENT ON COLUMN "questions"."id" IS 'Unique identifier for the question';
COMMENT ON COLUMN "questions"."question" IS 'The question TEXT';
COMMENT ON COLUMN "questions"."is_approved" IS 'Whether question has been approved by moderators';
COMMENT ON COLUMN "questions"."datetime_approved" IS 'When the question was approved (set by trigger)';
COMMENT ON COLUMN "questions"."is_banned" IS 'Whether question has been banned';
COMMENT ON COLUMN "questions"."ban_reason" IS 'Reason for banning the question';
COMMENT ON COLUMN "questions"."datetime_banned" IS 'When the question was banned (set by trigger)';
COMMENT ON COLUMN "questions"."is_deleted" IS 'Whether question has been soft deleted';
COMMENT ON COLUMN "questions"."datetime_deleted" IS 'When the question was soft deleted';
