/**
 * Database migration runner.
 *
 * Reads all *.js files from database/migrations/ in alphabetical order,
 * checks system.migrations to see which have already been applied,
 * and runs each pending migration's apply() inside a transaction.
 *
 * Each migration file must export:
 *   apply(client)  — forward migration (required)
 *   revert(client) — undo migration (required; absence triggers a webhook warning)
 *
 * A migration may also export:
 *   requiresSuperUser = '<reason>' — if set, the migration is skipped (not
 *     applied, not recorded in system.migrations) unless --force-skipped is
 *     passed. Use this for migrations that need a manual step (e.g. a
 *     superuser-only DDL statement) performed out-of-band first.
 *   skipTransaction = true — if set, apply() runs without the runner's
 *     BEGIN/COMMIT wrapper (each statement auto-commits on its own). Use
 *     this for migrations containing DDL that TimescaleDB/Postgres refuse
 *     to run inside an explicit transaction (e.g. creating a continuous
 *     aggregate and registering its refresh policy in the same statement
 *     batch). There is no automatic rollback on failure — revert() is the
 *     only recovery path.
 *
 * Usage:
 *   node database/scripts/migrate.js            # env vars already set (CI / VPS)
 *   node database/scripts/migrate.js --dev      # loads .env.development
 *   node database/scripts/migrate.js --stage    # loads .env.staging
 *   node database/scripts/migrate.js --prod     # loads .env.production
 *   node database/scripts/migrate.js --force-skipped  # also apply migrations gated by requiresSuperUser
 */

const envFlag = process.argv.find(a => ['--dev', '--stage', '--prod'].includes(a));
if (envFlag) {
  require('./env-loader');
}

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

async function sendWebhookWarning(message) {
  const url = process.env.DISCORD_ERROR_WEBHOOK_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `⚠️ **Migration Warning**\n${message}` }),
    });
  } catch (err) {
    console.error('Failed to send webhook warning:', err.message);
  }
}

async function migrate() {
  const forceSkipped = process.argv.includes('--force-skipped');

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_ROLLOUT_USER,
    password: process.env.DB_ROLLOUT_PASSWORD,
    database: process.env.DB_NAME,
  });

  const client = await pool.connect();

  try {
    console.log('Connecting to database...');

    // Bootstrap: create tracking table if this is the first run
    await client.query(`
      CREATE TABLE IF NOT EXISTS system.migrations (
        name        VARCHAR(255) PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Determine which migrations have already been applied
    const { rows } = await client.query('SELECT name FROM system.migrations ORDER BY name');
    const applied = new Set(rows.map(r => r.name));

    if (applied.size > 0) {
      console.log(`Already applied: ${applied.size} migration(s)`);
    }

    // Read top-level .js migration files only (applied/ subfolder excluded by filter)
    const migrationsDir = path.join(__dirname, '../migrations');
    const allFiles = await fs.readdir(migrationsDir);
    const pending = allFiles
      .filter(f => f.endsWith('.js') && !applied.has(f))
      .sort();

    if (pending.length === 0) {
      console.log('Nothing to migrate — database is up to date.');
      return;
    }

    console.log(`Found ${pending.length} pending migration(s):`);
    pending.forEach(f => console.log(`  - ${f}`));
    console.log('');

    const skippedMigrations = [];

    for (const file of pending) {
      const migration = require(path.join(migrationsDir, file));

      if (migration.requiresSuperUser !== undefined && !forceSkipped) {
        skippedMigrations.push({ migrationName: file, reason: migration.requiresSuperUser });
        continue;
      }

      if (typeof migration.revert !== 'function') {
        const warning = `Migration \`${file}\` has no \`revert()\` function. It has been applied but cannot be reverted automatically.`;
        console.warn(`⚠️  ${warning}`);
        await sendWebhookWarning(warning);
      }

      process.stdout.write(`Applying ${file}... `);

      if (migration.skipTransaction) {
        console.log('');
        console.log(`  ⚠️  Running outside a transaction (skipTransaction) — no automatic rollback on failure.`);
        try {
          await migration.apply(client);
          await client.query('INSERT INTO system.migrations (name) VALUES ($1)', [file]);
          console.log(`  ✓ ${file}`);
        } catch (err) {
          console.log(`  ✗ ${file}`);
          console.error(`\nFailed to apply ${file}:`);
          console.error(err.message);
          console.error(`\n⚠️  This migration ran outside a transaction (skipTransaction) — any statements that already executed were NOT rolled back. Inspect the database and manually revert with:`);
          console.error(`    node database/scripts/revert.js ${file} ${envFlag || '<--dev|--stage|--prod>'}`);
          throw err;
        }
        continue;
      }

      await client.query('BEGIN');
      try {
        await migration.apply(client);
        await client.query('INSERT INTO system.migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log('✓');
      } catch (err) {
        await client.query('ROLLBACK');
        console.log('✗');
        console.error(`\nFailed to apply ${file}:`);
        console.error(err.message);
        throw err;
      }
    }

    if (skippedMigrations.length > 0) {
      console.log('');
      skippedMigrations.forEach(({ migrationName, reason }) => {
        console.log(`Skipped migration ${migrationName} for ${reason}`);
      });
      console.log('Re-run with --force-skipped once the above steps are done.');
    }

    if (skippedMigrations.length === pending.length) {
      console.log('\n⚠️  No migrations applied — all pending migrations were skipped.');
    } else {
      console.log('\n✓ Migration complete!');
    }
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
