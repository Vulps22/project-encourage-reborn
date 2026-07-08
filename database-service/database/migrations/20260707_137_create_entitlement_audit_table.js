/**
 * #137 - Rename the "premium" schema to "entitlement" and add the entitlement.audit table.
 *
 * The "premium" schema (entitlements, purchasables) is renamed to "entitlement" since
 * premium access *is* an entitlement - "entitlement" is the more accurate name for the
 * schema now that it's gaining an audit table dedicated to entitlement lifecycle events.
 *
 * The new entitlement.audit table is an append-only, uninterpreted history of every
 * entitlement lifecycle event Discord sends (both gateway-captured and
 * reconciliation-backfilled). It is deliberately decoupled from entitlement.entitlements -
 * no FK, and this migration never writes to that table.
 *
 * @param {import('pg').PoolClient} client
 */
async function apply(client) {
  // Rename the schema only if "premium" still exists and "entitlement" doesn't already
  // (fresh installs create the schema directly as "entitlement" via schemas/entitlement/,
  // so this migration is a no-op for them).
  const { rows } = await client.query(`
    SELECT
      EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'premium') AS premium_exists,
      EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'entitlement') AS entitlement_exists
  `);

  if (rows[0].premium_exists && !rows[0].entitlement_exists) {
    await client.query(`ALTER SCHEMA "premium" RENAME TO "entitlement"`);
  }

  await client.query(`
    DO $$ BEGIN
        CREATE TYPE entitlement.audit_event_type AS ENUM ('create', 'update', 'delete');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
        CREATE TYPE entitlement.audit_event_source AS ENUM ('gateway', 'reconciliation');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "entitlement"."audit" ("id" BIGSERIAL,
      "entitlement_id" BIGINT NOT NULL,
      "type" entitlement.audit_event_type NOT NULL,
      "source" entitlement.audit_event_source NOT NULL DEFAULT 'gateway',
      "data" JSONB NOT NULL,
      "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY ("id")
    );

    CREATE INDEX IF NOT EXISTS "audit_entitlement_id_idx" ON "entitlement"."audit"("entitlement_id");
    CREATE INDEX IF NOT EXISTS "audit_created_at_idx" ON "entitlement"."audit"("created_at");

    COMMENT ON TABLE "entitlement"."audit" IS 'Append-only raw history of every entitlement lifecycle event Discord has sent, uninterpreted';
    COMMENT ON COLUMN "entitlement"."audit"."id" IS 'Unique identifier for the audit row';
    COMMENT ON COLUMN "entitlement"."audit"."entitlement_id" IS 'Discord entitlement ID this event relates to. No FK to entitlements.id - deliberately decoupled';
    COMMENT ON COLUMN "entitlement"."audit"."type" IS 'Which lifecycle event this row records: create, update, or delete';
    COMMENT ON COLUMN "entitlement"."audit"."source" IS 'Whether this row was captured live from the gateway or backfilled by reconciliation';
    COMMENT ON COLUMN "entitlement"."audit"."data" IS 'Snapshot of the entitlement payload at the time of the event';
    COMMENT ON COLUMN "entitlement"."audit"."created_at" IS 'When this audit row was recorded';
  `);
}

/**
 * @param {import('pg').PoolClient} client
 */
async function revert(client) {
  await client.query(`DROP TABLE IF EXISTS "entitlement"."audit"`);
  await client.query(`DROP TYPE IF EXISTS entitlement.audit_event_type`);
  await client.query(`DROP TYPE IF EXISTS entitlement.audit_event_source`);

  const { rows } = await client.query(`
    SELECT
      EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'entitlement') AS entitlement_exists,
      EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'premium') AS premium_exists
  `);

  if (rows[0].entitlement_exists && !rows[0].premium_exists) {
    await client.query(`ALTER SCHEMA "entitlement" RENAME TO "premium"`);
  }
}

module.exports = { apply, revert };
