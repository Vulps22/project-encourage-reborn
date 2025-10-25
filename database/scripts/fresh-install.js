const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

/**
 * Fresh Install Script
 * Creates a new database from schema files
 * Used for: new dev environment, new prod setup
 * 
 * Supports PostgreSQL schemas:
 * - Files in schema/ go to public schema
 * - Files in schema/<name>/ create schema <name> and put tables there
 */
async function freshInstall() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  let client;

  try {
    console.log('Starting fresh database installation...');

    client = await pool.connect();
    console.log('Connected to database');

    // Track schemas we need to create
    const schemasToCreate = new Set();

    // Scan schema directory structure
    const schemasDir = path.join(__dirname, '../schemas');
    const schemaEntries = await fs.readdir(schemasDir, { withFileTypes: true });

    // Find all schemas and their tables/views/triggers
    const tablesToCreate = [];
    const viewsToCreate = [];
    const triggersToCreate = [];
    
    for (const schemaEntry of schemaEntries) {
      if (schemaEntry.isDirectory()) {
        // This is a schema directory (e.g., schemas/core/)
        const schemaName = schemaEntry.name;
        schemasToCreate.add(schemaName);
        
        const schemaPath = path.join(schemasDir, schemaName);
        
        // Check for tables subdirectory
        const tablesPath = path.join(schemaPath, 'tables');
        try {
          const tableFiles = await fs.readdir(tablesPath);
          const sqlFiles = tableFiles.filter(file => file.endsWith('.sql')).sort();
          
          for (const file of sqlFiles) {
            tablesToCreate.push({
              schema: schemaName,
              file: file,
              path: path.join(tablesPath, file),
            });
          }
        } catch (err) {
          if (err.code !== 'ENOENT') throw err;
        }
        
        // Check for views subdirectory
        const viewsPath = path.join(schemaPath, 'views');
        try {
          const viewFiles = await fs.readdir(viewsPath);
          const sqlFiles = viewFiles.filter(file => file.endsWith('.sql')).sort();
          
          for (const file of sqlFiles) {
            viewsToCreate.push({
              schema: schemaName,
              file: file,
              path: path.join(viewsPath, file),
            });
          }
        } catch (err) {
          if (err.code !== 'ENOENT') throw err;
        }
        
        // Check for triggers subdirectory
        const triggersPath = path.join(schemaPath, 'triggers');
        try {
          const triggerFiles = await fs.readdir(triggersPath);
          const sqlFiles = triggerFiles.filter(file => file.endsWith('.sql')).sort();
          
          for (const file of sqlFiles) {
            triggersToCreate.push({
              schema: schemaName,
              file: file,
              path: path.join(triggersPath, file),
            });
          }
        } catch (err) {
          if (err.code !== 'ENOENT') throw err;
        }
      } else if (schemaEntry.isFile() && schemaEntry.name.endsWith('.sql')) {
        // Legacy: Table in root schemas directory (public schema)
        tablesToCreate.push({
          schema: 'public',
          file: schemaEntry.name,
          path: path.join(schemasDir, schemaEntry.name),
        });
      }
    }

    // Drop all schemas to ensure clean state
    if (schemasToCreate.size > 0) {
      console.log(`\nDropping existing schemas for fresh install...`);
      for (const schemaName of schemasToCreate) {
        await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
      }
      // Also drop public schema objects
      await client.query(`DROP SCHEMA IF EXISTS public CASCADE;`);
      await client.query(`CREATE SCHEMA public;`);
      console.log(`✓ Schemas dropped`);
    }

    // Create custom schemas
    if (schemasToCreate.size > 0) {
      console.log(`\nCreating ${schemasToCreate.size} custom schema(s)...`);
      for (const schemaName of schemasToCreate) {
        console.log(`Creating schema: ${schemaName}`);
        await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
        console.log(`✓ Schema ${schemaName} created`);
      }
    }

    // Execute table schema files (first pass: create tables without FK constraints)
    if (tablesToCreate.length > 0) {
      console.log(`\nFound ${tablesToCreate.length} table schema files`);
      // collect ALTER TABLE ... ADD CONSTRAINT statements to run after all tables exist
      const fkStatements = [];
      for (const table of tablesToCreate) {
        const displayName = table.schema === 'public' ? table.file : `${table.schema}/${table.file}`;
        console.log(`Executing ${displayName}...`);
        
        let sql = await fs.readFile(table.path, 'utf8');

        // Extract FOREIGN KEY constraints so we can add them after all tables are created.
        // This handles both named CONSTRAINT "name" FOREIGN KEY (...) REFERENCES ...
        // and anonymous FOREIGN KEY (...) REFERENCES ...
        const fkRegex = /,?\s*CONSTRAINT\s+"?([\w\-]+)"?\s+FOREIGN KEY\s*\(([^)]+)\)\s+REFERENCES\s+"?([\w\-]+)"?\s*\(([^)]+)\)([^;\n]*)/gi;
        let modifiedSql = sql;
        let match;
        while ((match = fkRegex.exec(sql)) !== null) {
          const constraintName = match[1];
          const localCols = match[2].trim();
          const refTable = match[3];
          const refCols = match[4].trim();
          const tail = match[5] ? match[5].trim() : '';

          // Build ALTER TABLE statement
          const tableName = table.file.replace(/\.sql$/i, '');
          const fullTable = table.schema === 'public' ? `\"${tableName}\"` : `\"${table.schema}\".\"${tableName}\"`;
          const alter = `ALTER TABLE ${fullTable} ADD CONSTRAINT \"${constraintName}\" FOREIGN KEY (${localCols}) REFERENCES \"${refTable}\" (${refCols}) ${tail};`;
          fkStatements.push({ schema: table.schema, statement: alter });

          // remove the matched constraint from the create statement (including leading comma if present)
          modifiedSql = modifiedSql.replace(match[0], '');
        }

        // handle anonymous FOREIGN KEY (...) REFERENCES ... (no CONSTRAINT name)
        const anonFkRegex = /,?\s*FOREIGN KEY\s*\(([^)]+)\)\s+REFERENCES\s+"?([\w\-]+)"?\s*\(([^)]+)\)([^;\n]*)/gi;
        while ((match = anonFkRegex.exec(sql)) !== null) {
          // generate a constraint name
          const localCols = match[1].trim();
          const refTable = match[2];
          const refCols = match[3].trim();
          const tail = match[4] ? match[4].trim() : '';
          const tableName = table.file.replace(/\.sql$/i, '');
          const cname = `${tableName}_fk_${Math.random().toString(36).slice(2,8)}`;
          const fullTable = table.schema === 'public' ? `\"${tableName}\"` : `\"${table.schema}\".\"${tableName}\"`;
          const alter = `ALTER TABLE ${fullTable} ADD CONSTRAINT \"${cname}\" FOREIGN KEY (${localCols}) REFERENCES \"${refTable}\" (${refCols}) ${tail};`;
          fkStatements.push({ schema: table.schema, statement: alter });
          modifiedSql = modifiedSql.replace(match[0], '');
        }
        
        // If not in public schema, set search_path for this execution
        if (table.schema !== 'public') {
          await client.query(`SET search_path TO "${table.schema}", public;`);
        }
        
        // Run the CREATE TABLE (without FK constraints)
        await client.query(modifiedSql);
        
        // Reset search_path
        if (table.schema !== 'public') {
          await client.query('SET search_path TO public;');
        }
        
        console.log(`✓ ${displayName} executed successfully`);
      }

      // Second pass: add all foreign key constraints
      if (fkStatements.length > 0) {
        console.log('\nAdding foreign key constraints...');
        for (const fk of fkStatements) {
          console.log(`Executing FK: ${fk.statement.split('REFERENCES')[0].trim()}...`);
          // Execute using the schema's search_path so relative table names resolve
          if (fk.schema !== 'public') {
            await client.query(`SET search_path TO "${fk.schema}", public;`);
          }
          await client.query(fk.statement);
          if (fk.schema !== 'public') {
            await client.query('SET search_path TO public;');
          }
        }
        console.log('✓ Foreign key constraints added');
      }
    }

    // Read and execute view files
    if (viewsToCreate.length > 0) {
      console.log(`\nFound ${viewsToCreate.length} view files`);
      for (const view of viewsToCreate) {
        const displayName = `${view.schema}/${view.file}`;
        console.log(`Executing ${displayName}...`);
        
        let sql = await fs.readFile(view.path, 'utf8');
        
        if (view.schema !== 'public') {
          await client.query(`SET search_path TO "${view.schema}", public;`);
        }
        
        await client.query(sql);
        
        if (view.schema !== 'public') {
          await client.query('SET search_path TO public;');
        }
        
        console.log(`✓ ${displayName} executed successfully`);
      }
    }

    // Read and execute trigger files
    if (triggersToCreate.length > 0) {
      console.log(`\nFound ${triggersToCreate.length} trigger files`);
      for (const trigger of triggersToCreate) {
        const displayName = `${trigger.schema}/${trigger.file}`;
        console.log(`Executing ${displayName}...`);
        
        let sql = await fs.readFile(trigger.path, 'utf8');
        
        if (trigger.schema !== 'public') {
          await client.query(`SET search_path TO "${trigger.schema}", public;`);
        }
        
        await client.query(sql);
        
        if (trigger.schema !== 'public') {
          await client.query('SET search_path TO public;');
        }
        
        console.log(`✓ ${displayName} executed successfully`);
      }
    }

    console.log('\n✓ Fresh installation completed successfully!');
  } catch (error) {
    console.error('\n✗ Fresh installation failed:');
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

freshInstall();
