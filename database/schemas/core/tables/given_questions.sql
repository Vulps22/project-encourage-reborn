
CREATE TABLE IF NOT EXISTS "given_questions" ("id" SERIAL,
  "sender_id" VARCHAR(20) NOT NULL,
  "target_id" VARCHAR(20) NOT NULL,
  "server_id" VARCHAR(20) NOT NULL,
  "message_id" VARCHAR(20) DEFAULT NULL,
  "question" TEXT NOT NULL,
  "wager" BIGINT NOT NULL,
  "done_count" INTEGER NOT NULL DEFAULT 0,
  "fail_count" INTEGER NOT NULL DEFAULT 0,
  "skipped" SMALLINT NOT NULL DEFAULT 0,
  "created" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "type" VARCHAR(10) NOT NULL,
  "xp_type" VARCHAR(10) NOT NULL DEFAULT 'global',
  PRIMARY KEY ("id")
);
 
CREATE UNIQUE INDEX IF NOT EXISTS "id_UNIQUE" ON "given_questions"("id");

COMMENT ON TABLE "given_questions" IS 'Stores questions given from one user to another with XP wager';
COMMENT ON COLUMN "given_questions"."id" IS 'Unique identifier for the given question';
COMMENT ON COLUMN "given_questions"."question" IS 'The question TEXT';
COMMENT ON COLUMN "given_questions"."wager" IS 'Amount of XP wagered - transferred to target if completed';
COMMENT ON COLUMN "given_questions"."done_count" IS 'Number of completion votes';
COMMENT ON COLUMN "given_questions"."fail_count" IS 'Number of failure votes';
COMMENT ON COLUMN "given_questions"."skipped" IS 'Whether the question was skipped';
