const fs = require('fs');
const path = require('path');

const envMap = {
  '--dev':   '.env.development',
  '--stage': '.env.staging',
  '--prod':  '.env.production',
};

const envFlag = process.argv.find(a => envMap[a]);

if (!envFlag) {
  console.error('No environment selected. Use --dev, --stage, or --prod.');
  process.exit(1);
}

const envFile = envMap[envFlag];

const repoRoot = path.resolve(__dirname, '../../..');
const envPath = path.resolve(repoRoot, envFile);

// The env file is a convenience for local work, not a requirement. CI supplies
// DB_* as job environment variables, and the Docker images ship without any env
// file because compose injects them via env_file. Exiting here would break both.
// The environment must still be chosen explicitly via the flag above.
if (!fs.existsSync(envPath)) {
  console.warn(`[env] ${envFile} not found at ${envPath} — using ambient environment`);
  return;
}

const lines = fs.readFileSync(envPath, 'utf8').split('\n');

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;

  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) continue;

  const key   = trimmed.slice(0, eqIndex).trim();
  const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '');

  if (key && !(key in process.env)) {
    process.env[key] = value;
  }
}

console.log(`[env] Loaded ${envFile}`);
