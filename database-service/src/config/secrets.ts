import { randomBytes } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const CONSUMER_SECRETS = ['DS_PE_API_SECRET', 'DS_MS_API_SECRET', 'DS_POSTMAN_API_SECRET'] as const;

function generateSecret(): string {
  return randomBytes(32).toString('hex');
}

function getEnvFilePath(): string | null {
  const candidates = ['.env', '.env.development', '.env.staging', '.env.production'];
  for (const candidate of candidates) {
    const p = resolve(process.cwd(), candidate);
    if (existsSync(p)) return p;
  }
  return null;
}

function writeSecretToEnvFile(envPath: string, key: string, value: string): void {
  let contents = readFileSync(envPath, 'utf8');

  if (contents.includes(`${key}=`)) {
    // Replace empty assignment
    contents = contents.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`);
  } else {
    // Append if key doesn't exist
    contents = contents.trimEnd() + `\n${key}=${value}\n`;
  }

  writeFileSync(envPath, contents, 'utf8');
}

export function initialiseSecrets(): void {
  const envPath = getEnvFilePath();
  const generated: string[] = [];

  for (const key of CONSUMER_SECRETS) {
    if (!process.env[key]) {
      const secret = generateSecret();
      process.env[key] = secret;

      if (envPath) {
        writeSecretToEnvFile(envPath, key, secret);
      }

      generated.push(key);
    }
  }

  if (generated.length > 0) {
    console.log(`[Secrets] Generated missing secrets: ${generated.join(', ')}`);
    if (envPath) {
      console.log(`[Secrets] Saved to ${envPath} — restart to load from file next time`);
    } else {
      console.warn('[Secrets] No .env file found — generated secrets are in-memory only for this run');
    }
  }
}
