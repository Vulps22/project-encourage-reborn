#!/usr/bin/env node

/**
 * Fix inline PRIMARY KEY declarations
 * PostgreSQL doesn't like: column_name TYPE PRIMARY KEY (column_name)
 * Should be: column_name TYPE, PRIMARY KEY (column_name)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all SQL files
const files = execSync('find database/schemas -type f -name "*.sql"', { encoding: 'utf8' })
  .trim()
  .split('\n');

console.log(`Checking ${files.length} SQL files for inline PRIMARY KEY...`);

let fixedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;
  
  // Match: anything PRIMARY KEY ("column_name")
  // Replace with: anything, PRIMARY KEY ("column_name") on next line
  const regex = /^(.+)\s+PRIMARY KEY \(("[^"]+"|[^)]+)\)$/gm;
  
  content = content.replace(regex, (match, beforePK, columnName) => {
    return `${beforePK},\n  PRIMARY KEY (${columnName})`;
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`✓ Fixed ${file}`);
    fixedCount++;
  }
});

console.log(`\n✓ Fixed ${fixedCount} files`);
