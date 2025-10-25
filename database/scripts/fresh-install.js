const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

/**
 * Fresh Install Script
 * Creates a new database from schema files
 * Used for: new dev environment, new prod setup
 */
async function freshInstall() {
  let connection;

  try {
    console.log('Starting fresh database installation...');

    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true,
    });

    console.log('Connected to database');

    // Read all schema files
    const schemaDir = path.join(__dirname, '../schema');
    const files = await fs.readdir(schemaDir);
    const sqlFiles = files.filter(file => file.endsWith('.sql')).sort();

    if (sqlFiles.length === 0) {
      console.log('No schema files found in database/schema/');
      return;
    }

    console.log(`Found ${sqlFiles.length} schema files`);

    // Execute each schema file
    for (const file of sqlFiles) {
      console.log(`Executing ${file}...`);
      const filePath = path.join(schemaDir, file);
      const sql = await fs.readFile(filePath, 'utf8');
      await connection.query(sql);
      console.log(`✓ ${file} executed successfully`);
    }

    console.log('\n✓ Fresh installation completed successfully!');
  } catch (error) {
    console.error('\n✗ Fresh installation failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

freshInstall();
