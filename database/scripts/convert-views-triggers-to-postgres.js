#!/usr/bin/env node

/**
 * MySQL to PostgreSQL Views and Triggers Converter
 */

const fs = require('fs');
const path = require('path');

function convertViewToPostgreSQL(mysqlView) {
  let pgsql = mysqlView;

  // Remove MySQL-specific view options first (before replacing backticks)
  pgsql = pgsql.replace(/ALGORITHM=UNDEFINED\s*/gi, '');
  pgsql = pgsql.replace(/DEFINER=`[^`]+`@`[^`]+`\s*/gi, '');
  pgsql = pgsql.replace(/DEFINER="[^"]+"@"[^"]+"\s*/gi, '');
  pgsql = pgsql.replace(/SQL SECURITY DEFINER\s*/gi, '');

  // Replace backticks with double quotes
  pgsql = pgsql.replace(/`([^`]+)`/g, '"$1"');

  // Clean up extra spaces
  pgsql = pgsql.replace(/\s+/g, ' ');
  pgsql = pgsql.replace(/CREATE OR REPLACE\s+VIEW/g, 'CREATE OR REPLACE VIEW');

  return pgsql;
}

function convertTriggerToPostgreSQL(mysqlTrigger) {
  // First replace all backticks
  let content = mysqlTrigger.replace(/`([^`]+)`/g, '"$1"');
  
  // PostgreSQL triggers are much different - need function + trigger
  // Extract trigger details
  const triggerNameMatch = content.match(/CREATE TRIGGER IF NOT EXISTS "?([^"\s]+)"?\s+(BEFORE|AFTER)\s+(INSERT|UPDATE|DELETE)\s+ON\s+"?([^"\s]+)"?/i);
  
  if (!triggerNameMatch) {
    console.error('Could not parse trigger');
    return content;
  }

  const triggerName = triggerNameMatch[1];
  const timing = triggerNameMatch[2].toUpperCase();
  const event = triggerNameMatch[3].toUpperCase();
  const tableName = triggerNameMatch[4];

  // Extract the body between BEGIN and END
  const bodyMatch = content.match(/BEGIN\s+([\s\S]+)\s+END/i);
  if (!bodyMatch) {
    console.error('Could not extract trigger body');
    return content;
  }

  let body = bodyMatch[1];

  // Convert MySQL syntax to PostgreSQL
  body = body.replace(/SET\s+NEW\.(\w+)\s*=/gi, 'NEW.$1 :=');
  body = body.replace(/\bNOW\(\)/gi, 'CURRENT_TIMESTAMP');
  body = body.replace(/\bIF\b/gi, 'IF');
  body = body.replace(/\bTHEN\b/gi, 'THEN');
  body = body.replace(/\bEND IF;/gi, 'END IF;');
  body = body.replace(/\bAND\b/gi, 'AND');

  // Build PostgreSQL trigger
  const functionName = `${triggerName}_func`;
  
  const pgsql = `-- Trigger function
CREATE OR REPLACE FUNCTION "${functionName}"()
RETURNS TRIGGER AS $$
BEGIN
${body}
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS "${triggerName}" ON "${tableName}";
CREATE TRIGGER "${triggerName}"
  ${timing} ${event} ON "${tableName}"
  FOR EACH ROW
  EXECUTE FUNCTION "${functionName}"();
`;

  return pgsql;
}

// Convert views
const viewsDir = path.join(__dirname, '../views');
if (fs.existsSync(viewsDir)) {
  const viewFiles = fs.readdirSync(viewsDir).filter(f => f.endsWith('.sql'));
  
  console.log(`Converting ${viewFiles.length} view files...`);
  
  viewFiles.forEach(file => {
    const filePath = path.join(viewsDir, file);
    const mysqlView = fs.readFileSync(filePath, 'utf8');
    const pgsql = convertViewToPostgreSQL(mysqlView);
    fs.writeFileSync(filePath, pgsql);
    console.log(`✓ Converted view: ${file}`);
  });
}

// Convert triggers
const triggersDir = path.join(__dirname, '../triggers');
if (fs.existsSync(triggersDir)) {
  const triggerFiles = fs.readdirSync(triggersDir).filter(f => f.endsWith('.sql'));
  
  console.log(`\nConverting ${triggerFiles.length} trigger files...`);
  
  triggerFiles.forEach(file => {
    const filePath = path.join(triggersDir, file);
    const mysqlTrigger = fs.readFileSync(filePath, 'utf8');
    const pgsql = convertTriggerToPostgreSQL(mysqlTrigger);
    fs.writeFileSync(filePath, pgsql);
    console.log(`✓ Converted trigger: ${file}`);
  });
}

console.log('\nConversion complete!');
