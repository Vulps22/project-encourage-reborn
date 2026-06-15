/**
 * Manual emergency migration revert.
 *
 * With no argument, reverts the last applied migration.
 * With a migration name, reverts that specific migration.
 *
 * Usage:
 *   node database/scripts/revert.js                              # revert last applied
 *   node database/scripts/revert.js 20260410_13_create_report_view.js  # revert specific
 *
 *   node database/scripts/revert.js --dev      # loads .env.development
 *   node database/scripts/revert.js --stage    # loads .env.staging
 *   node database/scripts/revert.js --prod     # loads .env.production
 */

const envFlag = process.argv.find(a => ['--dev', '--stage', '--prod'].includes(a));
if (envFlag) {
  require('./env-loader');
}

const { Pool } = require('pg');
const path = require('path');

async function revert() {
  const targetArg = process.argv.slice(2).find(a => a.endsWith('.js'));

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const client = await pool.connect();

  try {
    // Resolve which migration to revert
    let target;
    if (targetArg) {
      const { rows } = await client.query(
        'SELECT name FROM system.migrations WHERE name = $1',
        [targetArg]
      );
      if (rows.length === 0) {
        console.error(`Migration not found in system.migrations: ${targetArg}`);
        process.exit(1);
      }
      target = rows[0].name;
    } else {
      const { rows } = await client.query(
        'SELECT name FROM system.migrations ORDER BY applied_at DESC LIMIT 1'
      );
      if (rows.length === 0) {
        console.log('No applied migrations to revert.');
        return;
      }
      target = rows[0].name;
    }

    console.log(`Reverting: ${target}`);

    const migrationsDir = path.join(__dirname, '../migrations');
    const migration = require(path.join(migrationsDir, target));

    if (typeof migration.revert !== 'function') {
      console.error(`✗ Cannot revert ${target}: no revert() function defined.`);
      process.exit(1);
    }

    await client.query('BEGIN');
    try {
      await migration.revert(client);
      await client.query('DELETE FROM system.migrations WHERE name = $1', [target]);
      await client.query('COMMIT');
      console.log(`✓ Reverted: ${target}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`✗ Revert failed: ${err.message}`);
      throw err;
    }
  } catch (error) {
    console.error('\n✗ Revert failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

revert();
