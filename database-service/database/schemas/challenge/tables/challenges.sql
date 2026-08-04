CREATE TABLE IF NOT EXISTS "challenge"."challenges" (
  "id" SERIAL NOT NULL,
  "message_id" BIGINT UNIQUE DEFAULT NULL,
  "user_id" BIGINT NOT NULL,
  "question_id" INTEGER NOT NULL,
  "server_id" BIGINT NOT NULL,
  "channel_id" BIGINT DEFAULT NULL,
  "username" TEXT NOT NULL,
  "image_url" TEXT DEFAULT NULL,
  "skipped" BOOLEAN NOT NULL DEFAULT FALSE,
  "type" VARCHAR(10) NOT NULL,
  "datetime_created" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_challenges_message_id" ON "challenge"."challenges"("message_id");
CREATE INDEX IF NOT EXISTS "idx_challenges_user" ON "challenge"."challenges"("user_id");
CREATE INDEX IF NOT EXISTS "idx_challenges_server" ON "challenge"."challenges"("server_id");
CREATE INDEX IF NOT EXISTS "idx_challenges_question" ON "challenge"."challenges"("question_id");
CREATE INDEX IF NOT EXISTS "idx_challenges_created" ON "challenge"."challenges"("datetime_created");
CREATE INDEX IF NOT EXISTS "idx_challenges_type" ON "challenge"."challenges"("type");

COMMENT ON TABLE "challenge"."challenges" IS 'Tracks instances of questions given to users';
COMMENT ON COLUMN "challenge"."challenges"."id" IS 'Auto-incrementing primary key';
COMMENT ON COLUMN "challenge"."challenges"."message_id" IS 'Discord message ID of the challenge embed, set after posting';
COMMENT ON COLUMN "challenge"."challenges"."question_id" IS 'ID reference to question.questions table';
COMMENT ON COLUMN "challenge"."challenges"."username" IS 'Discord username at time of challenge';
COMMENT ON COLUMN "challenge"."challenges"."image_url" IS 'Profile image URL at time of challenge';
COMMENT ON COLUMN "challenge"."challenges"."user_id" IS 'Discord user ID of the user who received the challenge';
COMMENT ON COLUMN "challenge"."challenges"."server_id" IS 'Discord server ID where the challenge was issued';
COMMENT ON COLUMN "challenge"."challenges"."channel_id" IS 'Discord channel ID where the challenge was posted';
COMMENT ON COLUMN "challenge"."challenges"."type" IS 'Question type: truth or dare';
COMMENT ON COLUMN "challenge"."challenges"."datetime_created" IS 'When the challenge was created';
COMMENT ON COLUMN "challenge"."challenges"."skipped" IS 'Whether the user skipped this challenge';

-- bot_user privileges
GRANT USAGE ON SCHEMA "challenge" TO bot_user;
GRANT SELECT, INSERT, UPDATE ON "challenge"."challenges" TO bot_user;
GRANT USAGE, SELECT ON SEQUENCE "challenge"."challenges_id_seq" TO bot_user;
