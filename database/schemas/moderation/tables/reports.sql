
DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('pending', 'actioning', 'actioned', 'cleared');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "reports" ("id" SERIAL,
  "type" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" report_status NOT NULL DEFAULT 'pending',
  "moderator_id" VARCHAR(20) DEFAULT NULL,
  "ban_reason" TEXT,
  "sender_id" VARCHAR(20) NOT NULL,
  "offender_id" VARCHAR(20) NOT NULL,
  "server_id" VARCHAR(20) NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reports_updated_at ON "reports";
CREATE TRIGGER trg_reports_updated_at
BEFORE UPDATE ON "reports"
FOR EACH ROW
EXECUTE FUNCTION update_reports_updated_at();
 
COMMENT ON TABLE "reports" IS 'Stores user reports for inappropriate questions or behavior';
COMMENT ON COLUMN "reports"."id" IS 'Unique identifier for the report';
COMMENT ON COLUMN "reports"."type" IS 'Type of content being reported';
COMMENT ON COLUMN "reports"."reason" IS 'User-provided reason for the report';
COMMENT ON COLUMN "reports"."status" IS 'Current status of the report';
COMMENT ON COLUMN "reports"."ban_reason" IS 'Moderator-provided reason if content was banned';
