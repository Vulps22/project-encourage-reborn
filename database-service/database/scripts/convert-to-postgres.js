#!/usr/bin/env node

/**
 * MySQL to PostgreSQL Schema Converter
 * Converts MySQL CREATE TABLE statements to PostgreSQL syntax
 */

const fs = require('fs');
const path = require('path');

function convertMySQLToPostgreSQL(mysqlSQL) {
  let pgsql = mysqlSQL;

  // Replace backticks with double quotes
  pgsql = pgsql.replace(/`([^`]+)`/g, '"$1"');

  // Convert AUTO_INCREMENT to SERIAL
  pgsql = pgsql.replace(/(\s+)int(\s+)NOT NULL AUTO_INCREMENT/gi, '$1SERIAL');
  
  // Convert INT to INTEGER
  pgsql = pgsql.replace(/\bint\b/gi, 'INTEGER');
  
  // Convert TINYINT(1) to BOOLEAN
  pgsql = pgsql.replace(/tinyint\(1\)/gi, 'BOOLEAN');
  pgsql = pgsql.replace(/tinyint/gi, 'SMALLINT');
  
  // Convert LONGTEXT to TEXT
  pgsql = pgsql.replace(/longtext/gi, 'TEXT');
  
  // Convert DATETIME to TIMESTAMP (but preserve column names)
  pgsql = pgsql.replace(/\sdatetime(\s+)/gi, ' TIMESTAMP$1');
  
  // Convert VARCHAR to uppercase
  pgsql = pgsql.replace(/varchar/gi, 'VARCHAR');
  
  // Convert BIGINT to uppercase
  pgsql = pgsql.replace(/bigint/gi, 'BIGINT');
  
  // Convert TEXT to uppercase
  pgsql = pgsql.replace(/\btext\b/gi, 'TEXT');

  // Remove CHARACTER SET and COLLATE clauses
  pgsql = pgsql.replace(/CHARACTER SET \w+/gi, '');
  pgsql = pgsql.replace(/COLLATE \w+/gi, '');

  // Convert DEFAULT '0' to DEFAULT 0 for integers/booleans
  pgsql = pgsql.replace(/(SMALLINT|INTEGER|BIGINT)(\s+NOT NULL)?(\s+DEFAULT\s+)'0'/g, '$1$2$3 0');
  pgsql = pgsql.replace(/BOOLEAN(\s+NOT NULL)?(\s+DEFAULT\s+)'0'/g, 'BOOLEAN$1$2 FALSE');
  pgsql = pgsql.replace(/BOOLEAN(\s+NOT NULL)?(\s+DEFAULT\s+)'1'/g, 'BOOLEAN$1$2 TRUE');

  // Extract inline comments
  const comments = [];
  const tableNameMatch = pgsql.match(/CREATE TABLE IF NOT EXISTS "([^"]+)"/);
  const tableName = tableNameMatch ? tableNameMatch[1] : 'unknown';
  
  // Extract table comment
  const tableCommentMatch = pgsql.match(/\)\s+ENGINE[^']*COMMENT='([^']+)'/);
  if (tableCommentMatch) {
    comments.push(`COMMENT ON TABLE "${tableName}" IS '${tableCommentMatch[1]}';`);
  }

  // Extract column comments
  const columnCommentRegex = /"([^"]+)"\s+[^C]+?COMMENT\s+'([^']+)'/g;
  let match;
  while ((match = columnCommentRegex.exec(pgsql)) !== null) {
    const columnName = match[1];
    const comment = match[2];
    comments.push(`COMMENT ON COLUMN "${tableName}"."${columnName}" IS '${comment}';`);
  }

  // Remove inline COMMENT clauses
  pgsql = pgsql.replace(/\s+COMMENT\s+'[^']+'/g, '');

  // Remove ENGINE, CHARSET, COLLATE, AUTO_INCREMENT value
  pgsql = pgsql.replace(/\)\s+ENGINE=\w+[^;]*/,  ')');

  // Remove trailing commas before PRIMARY KEY
  pgsql = pgsql.replace(/,(\s+PRIMARY KEY)/g, '$1');
  
  // Remove MySQL-specific key definitions and convert to CREATE INDEX
  const indexes = [];
  const keyRegex = /,?\s+(UNIQUE\s+)?KEY\s+"([^"]+)"\s+\("([^"]+)"\)(\s+\/\*![^*]+\*\/)?/g;
  while ((match = keyRegex.exec(pgsql)) !== null) {
    const isUnique = match[1] ? 'UNIQUE ' : '';
    const indexName = match[2];
    const columnName = match[3];
    indexes.push(`CREATE ${isUnique}INDEX IF NOT EXISTS "${indexName}" ON "${tableName}"("${columnName}");`);
  }
  pgsql = pgsql.replace(keyRegex, '');

  // Fix PRIMARY KEY with size specifier like id(18)
  pgsql = pgsql.replace(/PRIMARY KEY\s+\("([^"]+)"\(\d+\)\)/g, 'PRIMARY KEY ("$1")');

  // Move PRIMARY KEY inline for SERIAL columns
  pgsql = pgsql.replace(/SERIAL,\s+PRIMARY KEY\s+\("[^"]+"\)/g, 'SERIAL PRIMARY KEY');

  // Clean up multiple spaces
  pgsql = pgsql.replace(/\s+/g, ' ');
  pgsql = pgsql.replace(/\s+\)/g, ')');
  pgsql = pgsql.replace(/\(\s+/g, '(');

  // Add newlines for readability
  pgsql = pgsql.replace(/,\s*"/g, ',\n  "');
  pgsql = pgsql.replace(/CREATE TABLE/g, '\nCREATE TABLE');
  pgsql = pgsql.replace(/\);/, '\n);\n');

  // Append indexes
  if (indexes.length > 0) {
    pgsql += '\n' + indexes.join('\n') + '\n';
  }

  // Append comments
  if (comments.length > 0) {
    pgsql += '\n' + comments.join('\n') + '\n';
  }

  return pgsql;
}

// Process all schema files
const schemasDir = path.join(__dirname, '../schemas');
const files = fs.readdirSync(schemasDir).filter(f => f.endsWith('.sql'));

console.log(`Converting ${files.length} schema files...`);

files.forEach(file => {
  const filePath = path.join(schemasDir, file);
  const mysqlSQL = fs.readFileSync(filePath, 'utf8');
  const pgsql = convertMySQLToPostgreSQL(mysqlSQL);
  fs.writeFileSync(filePath, pgsql);
  console.log(`✓ Converted ${file}`);
});

console.log('\nConversion complete!');
