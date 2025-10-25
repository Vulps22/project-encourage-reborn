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

    // Disable foreign key checks to allow any execution order
    console.log('Disabling foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

    // Read and execute table schema files
    const schemaDir = path.join(__dirname, '../schema');
    const files = await fs.readdir(schemaDir);
    const sqlFiles = files.filter(file => file.endsWith('.sql')).sort();

    if (sqlFiles.length > 0) {
      console.log(`\nFound ${sqlFiles.length} table schema files`);
      for (const file of sqlFiles) {
        console.log(`Executing ${file}...`);
        const filePath = path.join(schemaDir, file);
        const sql = await fs.readFile(filePath, 'utf8');
        await connection.query(sql);
        console.log(`✓ ${file} executed successfully`);
      }
    }

    // Read and execute view files
    const viewsDir = path.join(__dirname, '../schema/views');
    try {
      const viewFiles = await fs.readdir(viewsDir);
      const viewSqlFiles = viewFiles.filter(file => file.endsWith('.sql')).sort();
      
      if (viewSqlFiles.length > 0) {
        console.log(`\nFound ${viewSqlFiles.length} view files`);
        for (const file of viewSqlFiles) {
          console.log(`Executing ${file}...`);
          const filePath = path.join(viewsDir, file);
          const sql = await fs.readFile(filePath, 'utf8');
          await connection.query(sql);
          console.log(`✓ ${file} executed successfully`);
        }
      }
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      console.log('\nNo views directory found, skipping views');
    }

    // Read and execute trigger files
    const triggersDir = path.join(__dirname, '../schema/triggers');
    try {
      const triggerFiles = await fs.readdir(triggersDir);
      const triggerSqlFiles = triggerFiles.filter(file => file.endsWith('.sql')).sort();
      
      if (triggerSqlFiles.length > 0) {
        console.log(`\nFound ${triggerSqlFiles.length} trigger files`);
        for (const file of triggerSqlFiles) {
          console.log(`Executing ${file}...`);
          const filePath = path.join(triggersDir, file);
          const sql = await fs.readFile(filePath, 'utf8');
          await connection.query(sql);
          console.log(`✓ ${file} executed successfully`);
        }
      }
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      console.log('\nNo triggers directory found, skipping triggers');
    }

    // Re-enable foreign key checks
    console.log('\nRe-enabling foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');

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
