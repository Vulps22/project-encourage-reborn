
CREATE TABLE IF NOT EXISTS "archive_truths" (
  "id" SERIAL,
  "question" TEXT NOT NULL,
  "creator" VARCHAR(20) DEFAULT NULL,
  "isApproved" BOOLEAN NOT NULL DEFAULT FALSE,
  "isBanned" BOOLEAN NOT NULL DEFAULT FALSE,
  "banReason" TEXT,
  "created" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "serverId" VARCHAR(20) NOT NULL DEFAULT 'pre-v5',
  "messageId" VARCHAR(45) DEFAULT 'pre-v5',
  PRIMARY KEY ("id")
);
 
COMMENT ON TABLE "archive_truths" IS 'DEPRECATED: Delete me';
