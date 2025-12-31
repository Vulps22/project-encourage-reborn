
CREATE TABLE IF NOT EXISTS "question"."given_questions" ("id" SERIAL,
  "sender_id" BIGINT NOT NULL,
  "target_id" BIGINT NOT NULL,
  "server_id" BIGINT NOT NULL,
  "message_id" BIGINT DEFAULT NULL,
  "question" TEXT NOT NULL,
  "wager" BIGINT NOT NULL,
  "done_count" INTEGER NOT NULL DEFAULT 0,
  "fail_count" INTEGER NOT NULL DEFAULT 0,
  "skipped" BOOLEAN NOT NULL DEFAULT FALSE,
  "created" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "type" VARCHAR(10) NOT NULL,
  "xp_type" VARCHAR(10) NOT NULL DEFAULT 'global',
  PRIMARY KEY ("id")
);
 
CREATE UNIQUE INDEX IF NOT EXISTS "id_UNIQUE" ON "question"."given_questions"("id");

-- Performance indexes
CREATE INDEX IF NOT EXISTS "idx_sender" ON "question"."given_questions"("sender_id");
CREATE INDEX IF NOT EXISTS "idx_target" ON "question"."given_questions"("target_id");
CREATE INDEX IF NOT EXISTS "idx_server" ON "question"."given_questions"("server_id");
CREATE INDEX IF NOT EXISTS "idx_created" ON "question"."given_questions"("created");

COMMENT ON TABLE "question"."given_questions" IS 'Stores questions given from one user to another with XP wager';
COMMENT ON COLUMN "question"."given_questions"."id" IS 'Unique identifier for the given question';
COMMENT ON COLUMN "question"."given_questions"."question" IS 'The question TEXT';
COMMENT ON COLUMN "question"."given_questions"."wager" IS 'Amount of XP wagered - transferred to target if completed';
COMMENT ON COLUMN "question"."given_questions"."done_count" IS 'Number of completion votes';
COMMENT ON COLUMN "question"."given_questions"."fail_count" IS 'Number of failure votes';
COMMENT ON COLUMN "question"."given_questions"."skipped" IS 'Whether the question was skipped';
