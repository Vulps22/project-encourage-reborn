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
 * Usage:
 *   node database/scripts/migrate.js            # env vars already set (CI / VPS)
 *   node database/scripts/migrate.js --dev      # loads .env.development
 *   node database/scripts/migrate.js --stage    # loads .env.staging
 *   node database/scripts/migrate.js --prod     # loads .env.production
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
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
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

    for (const file of pending) {
      const migration = require(path.join(migrationsDir, file));

      if (typeof migration.revert !== 'function') {
        const warning = `Migration \`${file}\` has no \`revert()\` function. It has been applied but cannot be reverted automatically.`;
        console.warn(`⚠️  ${warning}`);
        await sendWebhookWarning(warning);
      }

      process.stdout.write(`Applying ${file}... `);

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

    console.log('\n✓ Migration complete!');
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
