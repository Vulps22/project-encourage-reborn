#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const NODE_AUTH_TOKEN = process.env.NODE_AUTH_TOKEN || (() => { console.error('NODE_AUTH_TOKEN env var is required'); process.exit(1); })();

const SERVICES = {
  bs: { dir: 'bot-service',          image: 'vulps23/project-encourage' },
  ds: { dir: 'database-service',     image: 'vulps23/project-encourage-ds' },
  ms: { dir: 'moderator-service',    image: 'vulps23/project-encourage-ms' },
};

function parseArgs(argv) {
  const selected = [];
  let labels = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--bs') selected.push('bs');
    else if (arg === '--ds') selected.push('ds');
    else if (arg === '--ms') selected.push('ms');
    else if (arg === '--labels') {
      const val = argv[++i];
      if (!val) { console.error('--labels requires a value'); process.exit(1); }
      labels = val.trim().split(/\s+/).filter(Boolean);
    }
  }

  return { selected, labels };
}

function run(cmd, args, cwd) {
  console.log(`\n$ ${cmd} ${args.join(' ')}\n`);
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: false });
  if (result.status !== 0) {
    console.error(`\nCommand failed with exit code ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

function readBuild(cwd) {
  const file = path.join(cwd, 'build.json');
  return JSON.parse(fs.readFileSync(file, 'utf8')).build;
}

function writeBuild(cwd, n) {
  const file = path.join(cwd, 'build.json');
  fs.writeFileSync(file, JSON.stringify({ build: n }, null, 2) + '\n');
}

function currentBranch(cwd) {
  const result = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd, encoding: 'utf8' });
  return result.stdout.trim();
}

function isClean(cwd) {
  const result = spawnSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' });
  return result.stdout.trim() === '';
}

function commitAndTag(cwd, key, n) {
  const tag = `${key}-build-${n}`;
  run('git', ['add', 'build.json'], cwd);
  run('git', ['commit', '-m', `build-${n}`], cwd);
  run('git', ['tag', tag], cwd);
  return tag;
}

const { selected, labels } = parseArgs(process.argv.slice(2));

if (selected.length === 0) {
  console.error('No services selected. Use --bs, --ds, and/or --ms.');
  process.exit(1);
}

if (labels.length === 0) {
  console.error('No labels provided. Use --labels "label1 label2 ..."');
  process.exit(1);
}

const root = path.resolve(__dirname, '..');

// --- Phase 0: ensure all selected services are on main ---

const offMain = selected.filter(key => currentBranch(path.join(root, SERVICES[key].dir)) !== 'main');
const dirty   = selected.filter(key => !isClean(path.join(root, SERVICES[key].dir)));

if (offMain.length > 0) {
  console.error('You are attempting to deploy the following projects from a branch other than main. Merge your changes into main before proceeding:\n');
  for (const key of offMain) console.error(`  * ${key.toUpperCase()}`);
  console.error('');
}

if (dirty.length > 0) {
  console.error('The following projects have uncommitted changes. Commit or stash them before deploying:\n');
  for (const key of dirty) console.error(`  * ${key.toUpperCase()}`);
  console.error('');
}

if (offMain.length > 0 || dirty.length > 0) process.exit(1);

// --- Phase 1: run all test suites before touching Docker ---

console.log('\n========== Running tests ==========');

const failed = [];

for (const key of selected) {
  const { dir } = SERVICES[key];
  const cwd = path.join(root, dir);

  console.log(`\n---------- ${key.toUpperCase()} tests (${dir}) ----------`);

  const result = spawnSync('npm', ['test', '--', '--forceExit'], { cwd, stdio: 'inherit', shell: false });
  if (result.status !== 0) {
    failed.push(key.toUpperCase());
  }
}

if (failed.length > 0) {
  console.error(`\nTests failed for: ${failed.join(', ')}. Aborting deploy.`);
  process.exit(1);
}

console.log('\nAll tests passed.\n');

// --- Phase 2: increment build numbers and tag each repo ---

console.log('========== Stamping builds ==========');

const buildNumbers = {};

for (const key of selected) {
  const { dir } = SERVICES[key];
  const cwd = path.join(root, dir);

  const next = readBuild(cwd) + 1;
  writeBuild(cwd, next);
  buildNumbers[key] = next;

  const tag = commitAndTag(cwd, key, next);
  console.log(`  ${key.toUpperCase()}: build ${next} → ${tag}`);
}

// --- Phase 3: build and push Docker images ---

for (const key of selected) {
  const { dir, image } = SERVICES[key];
  const cwd = path.join(root, dir);

  console.log(`\n========== Building ${key.toUpperCase()} (${image}) ==========`);

  const buildArgs = [
    'build',
    '--build-arg', `NODE_AUTH_TOKEN=${NODE_AUTH_TOKEN}`,
    ...labels.flatMap(label => ['-t', `${image}:${label}`]),
    '.',
  ];
  run('docker', buildArgs, cwd);

  console.log(`\n========== Pushing ${key.toUpperCase()} (${image}) ==========`);

  for (const label of labels) {
    run('docker', ['push', `${image}:${label}`], cwd);
  }
}

console.log('\nDone.');
console.log('\nBuild summary:');
for (const [key, n] of Object.entries(buildNumbers)) {
  console.log(`  ${key.toUpperCase()}: ${key}-build-${n}`);
}
