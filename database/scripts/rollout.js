const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

/**
 * Rollout Script
 * Apply migrations to the database
 * 
 * With issue number: Apply specific migration, files stay in migrations/
 * Without issue number: Apply all pending migrations, move to applied/
 */
async function rollout() {
  const issueNumber = process.argv[2];
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  let client;

  try {
    console.log('Starting rollout...');

    client = await pool.connect();
    console.log('Connected to database');

    // Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        issue_number INTEGER NOT NULL,
        description VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_issue UNIQUE (issue_number)
      );
    `);

    if (issueNumber) {
      // Apply specific migration
      await applyMigration(client, issueNumber, false);
    } else {
      // Apply all pending migrations
      await applyAllPending(client);
    }

    console.log('\n✓ Rollout completed successfully!');
  } catch (error) {
    console.error('\n✗ Rollout failed:');
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

async function applyMigration(client, issueNumber, moveFiles) {
  const migrationsDir = path.join(__dirname, '../migrations');
  const appliedDir = path.join(migrationsDir, 'applied');
  const rolloutFile = `#${issueNumber}_rollout.sql`;
  const rollbackFile = `#${issueNumber}_rollback.sql`;
  const rolloutPath = path.join(migrationsDir, rolloutFile);
  const rollbackPath = path.join(migrationsDir, rollbackFile);

  // Check if migration already applied
  const result = await client.query(
    'SELECT * FROM migrations WHERE issue_number = $1',
    [issueNumber]
  );

  if (result.rows.length > 0) {
    console.log(`Migration #${issueNumber} already applied, skipping`);
    return;
  }

  // Check if files exist
  try {
    await fs.access(rolloutPath);
    await fs.access(rollbackPath);
  } catch (error) {
    throw new Error(`Migration files not found for issue #${issueNumber}`);
  }

  console.log(`Applying migration #${issueNumber}...`);

  // Read and execute rollout SQL
  const sql = await fs.readFile(rolloutPath, 'utf8');
  await client.query(sql);

  // Extract description from first comment line if present
  const lines = sql.split('\n');
  const commentLine = lines.find(line => line.trim().startsWith('--'));
  const description = commentLine 
    ? commentLine.replace(/^--\s*/, '').trim() 
    : `Migration #${issueNumber}`;

  // Record migration in database
  await client.query(
    'INSERT INTO migrations (issue_number, description) VALUES ($1, $2)',
    [issueNumber, description]
  );

  console.log(`✓ Migration #${issueNumber} applied successfully`);

  // Move files if requested (production deployment)
  if (moveFiles) {
    await fs.mkdir(appliedDir, { recursive: true });
    await fs.rename(rolloutPath, path.join(appliedDir, rolloutFile));
    await fs.rename(rollbackPath, path.join(appliedDir, rollbackFile));
    console.log(`✓ Moved files to applied/`);
  }
}

async function applyAllPending(client) {
  const migrationsDir = path.join(__dirname, '../migrations');
  
  // Get all migration files
  const files = await fs.readdir(migrationsDir);
  const rolloutFiles = files
    .filter(file => file.endsWith('_rollout.sql'))
    .sort((a, b) => {
      const issueA = parseInt(a.match(/#(\d+)_/)[1]);
      const issueB = parseInt(b.match(/#(\d+)_/)[1]);
      return issueA - issueB;
    });

  if (rolloutFiles.length === 0) {
    console.log('No pending migrations found');
    return;
  }

  console.log(`Found ${rolloutFiles.length} pending migrations`);

  for (const file of rolloutFiles) {
    const issueNumber = file.match(/#(\d+)_/)[1];
    await applyMigration(client, issueNumber, true);
  }
}

rollout();
