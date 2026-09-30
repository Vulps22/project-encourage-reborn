const REQUIRES_SUPERUSER_REASON =
  'Requires the TimescaleDB extension (see the analytics.events hypertable migration) and the timescaledb_toolkit extension (for hyperloglog distinct-count support). Run `CREATE EXTENSION IF NOT EXISTS timescaledb;` and `CREATE EXTENSION IF NOT EXISTS timescaledb_toolkit;` as the postgres superuser if not already done, then re-run `npm run db:migrate -- --force-skipped`.';

/** @param {import('pg').PoolClient} client */
async function apply(client) {
  // WITH NO DATA avoids the initial materialization, which TimescaleDB
  // requires to run outside a transaction block. skipTransaction (below)
  // additionally covers add_continuous_aggregate_policy, which needs the
  // CREATE to have already committed to recognize the aggregate.
  await client.query(`
    CREATE MATERIALIZED VIEW "analytics"."events_weekly"
    WITH (timescaledb.continuous) AS
    SELECT
      time_bucket('1 week', "created_at") AS "bucket",
      "service",
      "interaction_type",
      "interaction_name",
      COUNT(*) AS "interaction_count",
      hyperloglog(4096, "user_id") AS "user_hll",
      hyperloglog(4096, "guild_id") AS "guild_hll"
    FROM "analytics"."events"
    GROUP BY "bucket", "service", "interaction_type", "interaction_name"
    WITH NO DATA;
  `);

  await client.query(`
    SELECT add_continuous_aggregate_policy('analytics.events_weekly',
      start_offset => INTERVAL '3 weeks',
      end_offset => INTERVAL '1 hour',
      schedule_interval => INTERVAL '1 hour',
      if_not_exists => TRUE);
  `);

  await client.query(`
    COMMENT ON VIEW "analytics"."events_weekly" IS 'Weekly interaction counts by service/type/name, computed directly from raw analytics.events (not derived from events_monthly). user_hll/guild_hll are hyperloglog sketches — read them with distinct_count(user_hll) / distinct_count(guild_hll) for approximate unique user/guild counts; they hold no raw IDs, so retaining them indefinitely past the 6-month raw retention window carries no re-identification risk. Never manually refresh_continuous_aggregate() over a historical range older than the raw retention cutoff — the source rows are gone and it will zero out that bucket.';
  `);
}

/** @param {import('pg').PoolClient} client */
async function revert(client) {
  await client.query(`
    DROP MATERIALIZED VIEW IF EXISTS "analytics"."events_weekly";
  `);
}

module.exports = { requiresSuperUser: REQUIRES_SUPERUSER_REASON, skipTransaction: true, apply, revert };
