
CREATE TABLE IF NOT EXISTS "archive_dares" (
  "id" SERIAL,
  "question" TEXT NOT NULL,
  "creator" VARCHAR(20) NOT NULL,
  "isApproved" BOOLEAN NOT NULL DEFAULT FALSE,
  "isBanned" BOOLEAN NOT NULL DEFAULT FALSE,
  "banReason" TEXT,
  "created" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "serverId" VARCHAR(20) NOT NULL DEFAULT 'pre-v5',
  "messageId" VARCHAR(20) DEFAULT 'pre-v5',
  PRIMARY KEY ("id")
);
 
COMMENT ON TABLE "archive_dares" IS 'DEPRECATED: Delete me';
