
CREATE TABLE IF NOT EXISTS "questions" ("id" SERIAL,
  "type" VARCHAR(10) NOT NULL,
  "question" TEXT NOT NULL,
  "creator" VARCHAR(20) NOT NULL,
  "is_approved" SMALLINT NOT NULL DEFAULT 0,
  "approved_by" VARCHAR(20) NOT NULL DEFAULT 'pre-v5-6',
  "datetime_approved" TIMESTAMP DEFAULT NULL,
  "is_banned" SMALLINT NOT NULL DEFAULT 0,
  "ban_reason" TEXT,
  "banned_by" VARCHAR(20) DEFAULT NULL,
  "datetime_banned" TIMESTAMP DEFAULT NULL,
  "created" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "server_id" VARCHAR(20) NOT NULL DEFAULT 'pre-v5',
  "message_id" VARCHAR(20) DEFAULT 'pre-v5',
  "is_deleted" SMALLINT NOT NULL DEFAULT 0,
  "datetime_deleted" TIMESTAMP DEFAULT NULL,
  PRIMARY KEY ("id")
);
 
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
