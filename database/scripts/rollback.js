const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

/**
 * Rollback Script
 * Revert a migration
 * 
 * Requires issue number
 * If in migrations/: Execute rollback, files stay in place
 * If in applied/: Execute rollback, move files back to migrations/
 */
async function rollback() {
  const issueNumber = process.argv[2];
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  let client;

  if (!issueNumber) {
    console.error('Error: Issue number is required');
    console.error('Usage: npm run db:rollback <issue_number>');
    process.exit(1);
  }

  try {
    console.log(`Starting rollback for migration #${issueNumber}...`);

    client = await pool.connect();
    console.log('Connected to database');

    // Check if migration was applied
    const result = await client.query(
      'SELECT * FROM migrations WHERE issue_number = $1',
      [issueNumber]
    );

    if (result.rows.length === 0) {
      throw new Error(`Migration #${issueNumber} has not been applied`);
    }

    // Find migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const appliedDir = path.join(migrationsDir, 'applied');
    const rolloutFile = `#${issueNumber}_rollout.sql`;
    const rollbackFile = `#${issueNumber}_rollback.sql`;

    let rolloutPath, rollbackPath, isInApplied;

    // Check in migrations/ first
    const migrationsRolloutPath = path.join(migrationsDir, rolloutFile);
    const migrationsRollbackPath = path.join(migrationsDir, rollbackFile);

    try {
      await fs.access(migrationsRollbackPath);
      rolloutPath = migrationsRolloutPath;
      rollbackPath = migrationsRollbackPath;
      isInApplied = false;
    } catch {
      // Check in applied/
      try {
        const appliedRolloutPath = path.join(appliedDir, rolloutFile);
        const appliedRollbackPath = path.join(appliedDir, rollbackFile);
        await fs.access(appliedRollbackPath);
        rolloutPath = appliedRolloutPath;
        rollbackPath = appliedRollbackPath;
        isInApplied = true;
      } catch {
        throw new Error(`Migration files not found for issue #${issueNumber}`);
      }
    }

    console.log(`Executing rollback for migration #${issueNumber}...`);

    // Read and execute rollback SQL
    const sql = await fs.readFile(rollbackPath, 'utf8');
    await client.query(sql);

    // Remove migration record from database
    await client.query(
      'DELETE FROM migrations WHERE issue_number = $1',
      [issueNumber]
    );

    console.log(`✓ Migration #${issueNumber} rolled back successfully`);

    // Move files if they were in applied/
    if (isInApplied) {
      await fs.rename(rolloutPath, path.join(migrationsDir, rolloutFile));
      await fs.rename(rollbackPath, path.join(migrationsDir, rollbackFile));
      console.log(`✓ Moved files back to migrations/`);
    }

    console.log('\n✓ Rollback completed successfully!');
  } catch (error) {
    console.error('\n✗ Rollback failed:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

rollback();
