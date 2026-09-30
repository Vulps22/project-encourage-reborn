
CREATE TABLE IF NOT EXISTS "question"."questions" (
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
CREATE INDEX IF NOT EXISTS "idx_type_approved" ON "question"."questions"("type", "is_approved", "is_banned");
CREATE INDEX IF NOT EXISTS "idx_server" ON "question"."questions"("server_id");
CREATE INDEX IF NOT EXISTS "idx_user_id" ON "question"."questions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_created" ON "question"."questions"("created");
 
COMMENT ON TABLE "question"."questions" IS 'Stores all truth and dare questions submitted by users';
COMMENT ON COLUMN "question"."questions"."id" IS 'Unique identifier for the question';
COMMENT ON COLUMN "question"."questions"."question" IS 'The question TEXT';
COMMENT ON COLUMN "question"."questions"."is_approved" IS 'Whether question has been approved by moderators';
COMMENT ON COLUMN "question"."questions"."datetime_approved" IS 'When the question was approved (set by trigger)';
COMMENT ON COLUMN "question"."questions"."is_banned" IS 'Whether question has been banned';
COMMENT ON COLUMN "question"."questions"."ban_reason" IS 'Reason for banning the question';
COMMENT ON COLUMN "question"."questions"."datetime_banned" IS 'When the question was banned (set by trigger)';
COMMENT ON COLUMN "question"."questions"."is_deleted" IS 'Whether question has been soft deleted';
COMMENT ON COLUMN "question"."questions"."datetime_deleted" IS 'When the question was soft deleted';

-- bot_user privileges
GRANT SELECT, INSERT, UPDATE ON "question"."questions" TO bot_user;
GRANT USAGE, SELECT ON SEQUENCE "question"."questions_id_seq" TO bot_user;
