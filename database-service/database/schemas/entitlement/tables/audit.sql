-- Schema role: audit = raw, uninterpreted history of every entitlement lifecycle event Discord sends
-- (both gateway-captured and reconciliation-backfilled). Deliberately decoupled from "entitlements" -
-- this table is never joined against it and this ticket never writes to "entitlements".

DO $$ BEGIN
    CREATE TYPE audit_event_type AS ENUM ('create', 'update', 'delete');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE audit_event_source AS ENUM ('gateway', 'reconciliation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "audit" ("id" BIGSERIAL,
  "entitlement_id" BIGINT NOT NULL,
  "type" audit_event_type NOT NULL,
  "source" audit_event_source NOT NULL DEFAULT 'gateway',
  "data" JSONB NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "audit_entitlement_id_idx" ON "audit"("entitlement_id");
CREATE INDEX IF NOT EXISTS "audit_created_at_idx" ON "audit"("created_at");

COMMENT ON TABLE "audit" IS 'Append-only raw history of every entitlement lifecycle event Discord has sent, uninterpreted';
COMMENT ON COLUMN "audit"."id" IS 'Unique identifier for the audit row';
COMMENT ON COLUMN "audit"."entitlement_id" IS 'Discord entitlement ID this event relates to. No FK to entitlements.id - deliberately decoupled';
COMMENT ON COLUMN "audit"."type" IS 'Which lifecycle event this row records: create, update, or delete';
COMMENT ON COLUMN "audit"."source" IS 'Whether this row was captured live from the gateway or backfilled by reconciliation';
COMMENT ON COLUMN "audit"."data" IS 'Snapshot of the entitlement payload at the time of the event';
COMMENT ON COLUMN "audit"."created_at" IS 'When this audit row was recorded';
