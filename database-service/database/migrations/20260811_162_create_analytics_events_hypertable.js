const REQUIRES_SUPERUSER_REASON =
  'Run `CREATE EXTENSION IF NOT EXISTS timescaledb;` as the postgres superuser first, then re-run `npm run db:migrate -- --force-skipped`.';

/** @param {import('pg').PoolClient} client */
async function apply(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "analytics"."events" (
      "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "service"           VARCHAR(2)  NOT NULL,
      "interaction_type"  VARCHAR(10) NOT NULL,
      "interaction_name"  TEXT        NOT NULL,
      "user_id"           BIGINT      NOT NULL,
      "guild_id"          BIGINT
    );
  `);

  // create_hypertable must run outside the CREATE TABLE statement above —
  // it needs the table to already exist.
  await client.query(`
    SELECT create_hypertable('analytics.events', 'created_at', if_not_exists => TRUE);
  `);

  await client.query(`
    SELECT add_retention_policy('analytics.events', INTERVAL '6 months', if_not_exists => TRUE);
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS "idx_events_guild_created" ON "analytics"."events"("guild_id", "created_at");
    CREATE INDEX IF NOT EXISTS "idx_events_user_created" ON "analytics"."events"("user_id", "created_at");

    COMMENT ON TABLE "analytics"."events" IS 'Raw bot usage interaction log (commands + buttons). Hypertable; rows older than 6 months are dropped by the retention policy — see analytics.events_weekly / analytics.events_monthly for the PII-free long-term record.';
    COMMENT ON COLUMN "analytics"."events"."created_at" IS 'When the interaction occurred; hypertable partition column';
    COMMENT ON COLUMN "analytics"."events"."service" IS 'Which service captured the interaction: bs or ms';
    COMMENT ON COLUMN "analytics"."events"."interaction_type" IS 'command or button';
    COMMENT ON COLUMN "analytics"."events"."interaction_name" IS 'Command name or button action id';
    COMMENT ON COLUMN "analytics"."events"."user_id" IS 'Discord user ID';
    COMMENT ON COLUMN "analytics"."events"."guild_id" IS 'Discord guild ID; interactions are never captured outside a guild, but left nullable defensively';

    GRANT USAGE ON SCHEMA "analytics" TO bot_user;
    GRANT INSERT ON "analytics"."events" TO bot_user;
  `);
}

/** @param {import('pg').PoolClient} client */
async function revert(client) {
  await client.query(`
    REVOKE INSERT ON "analytics"."events" FROM bot_user;
    REVOKE USAGE ON SCHEMA "analytics" FROM bot_user;
    DROP TABLE IF EXISTS "analytics"."events";
  `);
}

module.exports = { requiresSuperUser: REQUIRES_SUPERUSER_REASON, apply, revert };
