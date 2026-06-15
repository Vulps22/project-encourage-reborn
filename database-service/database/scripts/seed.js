require('./env-loader');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Fake but valid-looking Discord snowflake IDs
const USERS = {
  alice:     '100000000000000001',
  bob:       '100000000000000002',
  banned:    '100000000000000003',
  moderator: '100000000000000099',
};

const SERVERS = {
  normal1: '200000000000000001',
  normal2: '200000000000000002',
  banned:  '200000000000000003',
};

const CHANNELS = {
  general: '400000000000000001',
  other:   '400000000000000002',
};

const MESSAGES = {
  challenge1: '300000000000000001',
  challenge2: '300000000000000002',
};

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('Clearing existing data...');
    await client.query(`
      TRUNCATE
        "vote"."user_votes",
        "vote"."challenge_votes",
        "challenge"."challenges",
        "question"."questions",
        "server"."servers",
        "user"."users"
      RESTART IDENTITY CASCADE
    `);

    // ── Users ──────────────────────────────────────────────────────────────────
    console.log('Seeding users...');
    await client.query(`
      INSERT INTO "user"."users" (id, username, rules_accepted) VALUES
        ($1, 'alice',      true),
        ($2, 'bob',        true),
        ($3, 'banneduser', true),
        ($4, 'moderator',  true)
    `, [USERS.alice, USERS.bob, USERS.banned, USERS.moderator]);

    await client.query(`
      UPDATE "user"."users"
      SET is_banned = true, ban_reason = 'Seed: test banned user'
      WHERE id = $1
    `, [USERS.banned]);

    // ── Servers ────────────────────────────────────────────────────────────────
    console.log('Seeding servers...');
    await client.query(`
      INSERT INTO "server"."servers" (id, name, user_id, has_accepted, can_create) VALUES
        ($1, 'Test Server One',    $4, true, true),
        ($2, 'Test Server Two',    $4, true, true),
        ($3, 'Banned Test Server', $5, true, true)
    `, [SERVERS.normal1, SERVERS.normal2, SERVERS.banned, USERS.alice, USERS.bob]);

    await client.query(`
      UPDATE "server"."servers"
      SET is_banned = true, ban_reason = 'Seed: test banned server', banned_by = $1, datetime_banned = NOW()
      WHERE id = $2
    `, [USERS.moderator, SERVERS.banned]);

    // ── Questions ──────────────────────────────────────────────────────────────
    console.log('Seeding questions...');
    const { rows: questions } = await client.query(`
      INSERT INTO "question"."questions" (type, question, user_id, server_id, is_approved, approved_by, is_banned, ban_reason) VALUES
        ('truth', 'What is your biggest fear?',              $1, $3, true,  $5, false, null),
        ('truth', 'What is your most embarrassing memory?',  $1, $3, true,  $5, false, null),
        ('dare',  'Do 10 push-ups right now.',               $2, $4, true,  $5, false, null),
        ('dare',  'Speak in an accent for the next round.',  $2, $4, true,  $5, false, null),
        ('truth', 'Pending question — not yet approved.',    $1, $3, false, null, false, null),
        ('dare',  'Banned dare — inappropriate content.',    $2, $4, false, null, true,  'Seed: inappropriate content')
      RETURNING id
    `, [USERS.alice, USERS.bob, SERVERS.normal1, SERVERS.normal2, USERS.moderator]);

    const [q1, , q3] = questions.map(r => r.id);

    // ── Challenges ─────────────────────────────────────────────────────────────
    console.log('Seeding challenges...');
    const { rows: challenges } = await client.query(`
      INSERT INTO "challenge"."challenges" (message_id, user_id, question_id, server_id, channel_id, username, type, skipped) VALUES
        ($3, $1, $5, $7, $9,  'alice', 'truth', false),
        ($4, $2, $6, $7, $9,  'bob',   'dare',  false),
        (null, $1, $5, $8, $10, 'alice', 'truth', true)
      RETURNING id
    `, [
      USERS.alice, USERS.bob,
      MESSAGES.challenge1, MESSAGES.challenge2,
      q1, q3,
      SERVERS.normal1, SERVERS.normal2,
      CHANNELS.general, CHANNELS.other,
    ]);

    const [c1, c2, c3] = challenges.map(r => r.id);

    // ── Vote tracking ──────────────────────────────────────────────────────────
    console.log('Seeding vote tracking...');
    await client.query(`
      INSERT INTO "vote"."challenge_votes" (challenge_id, done_count, failed_count) VALUES
        ($1, 2, 1),
        ($2, 0, 0)
    `, [c1, c2]);

    await client.query(`
      INSERT INTO "vote"."user_votes" (challenge_id, user_id, vote_type) VALUES
        ($1, $2, 'done'),
        ($1, $3, 'done'),
        ($1, $4, 'failed')
    `, [c1, USERS.alice, USERS.bob, USERS.moderator]);

    await client.query('COMMIT');

    console.log('\n✓ Seed complete!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Postman IDs');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Users:');
    console.log(`  alice     ${USERS.alice}`);
    console.log(`  bob       ${USERS.bob}`);
    console.log(`  banned    ${USERS.banned}`);
    console.log(`  moderator ${USERS.moderator}`);
    console.log('\nServers:');
    console.log(`  normal1   ${SERVERS.normal1}`);
    console.log(`  normal2   ${SERVERS.normal2}`);
    console.log(`  banned    ${SERVERS.banned}`);
    console.log('\nQuestions:');
    questions.forEach((q, i) => {
      const labels = ['approved truth', 'approved truth', 'approved dare', 'approved dare', 'pending', 'banned'];
      console.log(`  id=${q.id}  ${labels[i]}`);
    });
    console.log('\nChallenges:');
    console.log(`  id=${c1}  truth / alice / message=${MESSAGES.challenge1} / 2 done 1 failed votes`);
    console.log(`  id=${c2}  dare  / bob   / message=${MESSAGES.challenge2} / no votes`);
    console.log(`  id=${c3}  truth / alice / skipped / no message_id`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n✗ Seed failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
