/**
 * MySQL → PostgreSQL Data Migration Script
 *
 * Migrates data from the old project-encourage MySQL database (tord) to the
 * new project-encourage-reborn PostgreSQL database.
 *
 * Prerequisites:
 *   - npm run db:install must have been run on the PostgreSQL target
 *   - MySQL source must be reachable (MYSQL_HOST/PORT/USER/PASSWORD/DATABASE env vars)
 *   - PostgreSQL target must be reachable (DB_HOST/PORT/USER/PASSWORD/NAME env vars)
 *
 * Usage:
 *   node database/scripts/migrate-mysql-to-postgres.js
 *
 * Decisions applied:
 *   - archive_dares / archive_truths: discarded
 *   - servers.can_create: FALSE for all migrated rows
 *   - vote.user_votes: skipped (vote_type not available in source)
 *   - system config table: matching columns only
 */

const mysql = require('mysql2/promise');
const { Pool } = require('pg');
require('dotenv').config();

// Legacy string placeholders that cannot be cast to BIGINT.
const LEGACY_IDS = new Set(['pre-v5', 'pre-v5-6', 'UNSET', 'PRE_5_6_9', 'PRE_5_7_0']);

/** Convert a value to a BIGINT-compatible string, or null for legacy/invalid values. */
function toId(val) {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (str === '' || LEGACY_IDS.has(str)) return null;
  return str;
}

/** Convert a MySQL TINYINT(1) or boolean to a JS boolean. */
function toBool(val) {
  if (val === null || val === undefined) return false;
  return val === 1 || val === true || val === '1';
}

/** Truncate a string to a maximum length, returning null if the value is null. */
function truncate(val, len) {
  if (val === null || val === undefined) return null;
  return String(val).slice(0, len);
}

/** Check whether a table exists in the MySQL database. */
async function tableExists(conn, db, table) {
  const [rows] = await conn.query(
    'SELECT COUNT(*) AS cnt FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
    [db, table]
  );
  return rows[0].cnt > 0;
}

async function migrate() {
  const mysqlDb = process.env.MYSQL_DATABASE || 'tord';

  const mysqlConn = await mysql.createConnection({
    host:     process.env.MYSQL_HOST     || '127.0.0.1',
    port:     process.env.MYSQL_PORT     || 3306,
    user:     process.env.MYSQL_USER     || 'root',
    password: process.env.MYSQL_PASSWORD,
    database: mysqlDb,
  });

  const pgPool = new Pool({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT || 5432,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const pg = await pgPool.connect();

  try {
    console.log('Connected to MySQL and PostgreSQL.');
    await pg.query('BEGIN');
    console.log('PostgreSQL transaction started.\n');

    // -------------------------------------------------------------------------
    // 1. user.users
    // -------------------------------------------------------------------------
    console.log('=== Migrating user.users ===');
    const [users] = await mysqlConn.query('SELECT * FROM `users`');
    let userCount = 0;
    for (const u of users) {
      await pg.query(
        `INSERT INTO "user"."users" (
          id, username, global_level, global_level_xp, banned_questions,
          rules_accepted, is_banned, ban_reason, vote_count, ban_message_id,
          can_create, delete_date, created_datetime
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (id) DO NOTHING`,
        [
          toId(u.id),
          u.username ?? null,
          u.globalLevel        ?? u.global_level        ?? 0,
          u.globalLevelXp      ?? u.global_level_xp     ?? 0,
          u.bannedQuestions    ?? u.banned_questions     ?? 0,
          toBool(u.rulesAccepted ?? u.rules_accepted),
          toBool(u.isBanned      ?? u.is_banned),
          u.banReason   ?? u.ban_reason   ?? null,
          u.voteCount   ?? u.vote_count   ?? 0,
          toId(u.banMessageId ?? u.ban_message_id),
          toBool(u.canCreate ?? u.can_create ?? true),
          u.deleteDate  ?? u.delete_date  ?? null,
          u.createdDatetime ?? u.created_datetime ?? u.created ?? null,
        ]
      );
      userCount++;
    }
    console.log(`✓ ${userCount} users migrated.\n`);

    // -------------------------------------------------------------------------
    // 2. server.servers
    // -------------------------------------------------------------------------
    console.log('=== Migrating server.servers ===');
    const [servers] = await mysqlConn.query('SELECT * FROM `servers`');
    let serverCount = 0;
    let serverSkipped = 0;
    for (const s of servers) {
      if (!toId(s.owner ?? s.user_id)) { serverSkipped++; continue; }
      await pg.query(
        `INSERT INTO "server"."servers" (
          id, name, user_id, has_accepted, can_create, is_banned, ban_reason,
          banned_by, datetime_banned,
          dare_success_xp, dare_fail_xp, truth_success_xp, truth_fail_xp, message_xp,
          level_up_channel, announcement_channel,
          is_entitled, is_deleted
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
        ON CONFLICT (id) DO NOTHING`,
        [
          toId(s.id),
          s.name ?? null,
          toId(s.owner ?? s.user_id),
          toBool(s.hasAccepted  ?? s.has_accepted),
          false, // decision: default FALSE for all rows
          toBool(s.isBanned     ?? s.is_banned),
          s.banReason ?? s.ban_reason ?? null,
          null, // banned_by: new column, no source data
          null, // datetime_banned: new column, no source data
          s.dareSuccessXp  ?? s.dare_success_xp  ?? 50,
          s.dareFailXp     ?? s.dare_fail_xp      ?? 25,
          s.truthSuccessXp ?? s.truth_success_xp  ?? 40,
          s.truthFailXp    ?? s.truth_fail_xp     ?? 40,
          s.messageXp      ?? s.message_xp        ?? 0,
          toId(s.levelUpChannel      ?? s.level_up_channel),       // UNSET → null via toId
          toId(s.announcementChannel ?? s.announcement_channel),   // UNSET → null via toId
          toBool(s.isEntitled ?? s.is_entitled ?? false),
          toBool(s.isDeleted  ?? s.is_deleted  ?? false),
        ]
      );
      serverCount++;
    }
    if (serverSkipped > 0) console.log(`  (skipped ${serverSkipped} servers with no owner)`);
    console.log(`✓ ${serverCount} servers migrated.\n`);

    // -------------------------------------------------------------------------
    // 3. question.questions
    // -------------------------------------------------------------------------
    console.log('=== Migrating question.questions ===');
    const [questions] = await mysqlConn.query('SELECT * FROM `questions`');
    let questionCount = 0;
    let questionNulled = 0;
    let maxQuestionId = 0;
    for (const q of questions) {
      const userId = toId(q.creator ?? q.user_id);
      if (userId === null) questionNulled++;
      if ((q.id ?? 0) > maxQuestionId) maxQuestionId = q.id;
      await pg.query(
        `INSERT INTO "question"."questions" (
          id, type, question, user_id, is_approved, approved_by, datetime_approved,
          is_banned, ban_reason, banned_by, datetime_banned,
          created, server_id, message_id, is_deleted
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        ON CONFLICT (id) DO NOTHING`,
        [
          q.id,
          q.type ?? 'truth',
          q.question,
          userId,
          toBool(q.isApproved      ?? q.is_approved),
          toId(q.approvedBy        ?? q.approved_by),       // 'pre-v5-6' → null
          q.datetimeApproved       ?? q.datetime_approved   ?? null,
          toBool(q.isBanned        ?? q.is_banned),
          q.banReason              ?? q.ban_reason          ?? null,
          toId(q.bannedBy          ?? q.banned_by),
          q.datetimeBanned         ?? q.datetime_banned     ?? null,
          q.created                ?? null,
          toId(q.serverId          ?? q.server_id),         // 'pre-v5' → null
          toId(q.messageId         ?? q.message_id),        // 'pre-v5' → null
          toBool(q.isDeleted       ?? q.is_deleted),
        ]
      );
      questionCount++;
    }
    if (maxQuestionId > 0) {
      await pg.query(
        `SELECT setval(pg_get_serial_sequence('"question"."questions"', 'id'), $1)`,
        [maxQuestionId]
      );
    }
    console.log(`✓ ${questionCount} questions migrated (${questionNulled} had user_id NULLed due to legacy placeholders).\n`);

    // -------------------------------------------------------------------------
    // 4. question.given_questions
    // -------------------------------------------------------------------------
    console.log('=== Migrating question.given_questions ===');
    let givenCount = 0;
    let maxGivenId = 0;
    if (await tableExists(mysqlConn, mysqlDb, 'given_questions')) {
      const [gqs] = await mysqlConn.query('SELECT * FROM `given_questions`');
      for (const gq of gqs) {
        if ((gq.id ?? 0) > maxGivenId) maxGivenId = gq.id;
        await pg.query(
          `INSERT INTO "question"."given_questions" (
            id, sender_id, target_id, server_id, message_id, question,
            wager, done_count, fail_count, skipped, created, type, xp_type
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
          ON CONFLICT (id) DO NOTHING`,
          [
            gq.id,
            toId(gq.senderId ?? gq.sender_id),
            toId(gq.targetId ?? gq.target_id),
            toId(gq.serverId ?? gq.server_id),
            toId(gq.messageId ?? gq.message_id),
            gq.question,
            gq.wager ?? 0,
            gq.doneCount ?? gq.done_count ?? 0,
            gq.failCount ?? gq.fail_count ?? 0,
            toBool(gq.skipped),
            gq.created ?? null,
            gq.type ?? 'truth',
            gq.xpType ?? gq.xp_type ?? 'global',
          ]
        );
        givenCount++;
      }
      if (maxGivenId > 0) {
        await pg.query(
          `SELECT setval(pg_get_serial_sequence('"question"."given_questions"', 'id'), $1)`,
          [maxGivenId]
        );
      }
    } else {
      console.log('  (given_questions not found in MySQL, skipping)');
    }
    console.log(`✓ ${givenCount} given_questions migrated.\n`);

    // -------------------------------------------------------------------------
    // 5. server.server_users
    // -------------------------------------------------------------------------
    console.log('=== Migrating server.server_users ===');
    let serverUserCount = 0;
    let serverUserSkipped = 0;
    if (await tableExists(mysqlConn, mysqlDb, 'server_users')) {
      const [serverUsers] = await mysqlConn.query('SELECT * FROM `server_users`');
      for (const su of serverUsers) {
        const userId   = toId(su.userId   ?? su.user_id);
        const serverId = toId(su.serverId ?? su.server_id);
        if (!userId || !serverId) { serverUserSkipped++; continue; }
        await pg.query(
          `INSERT INTO "server"."server_users" (user_id, server_id, server_level, server_level_xp)
           SELECT $1, $2, $3, $4
           WHERE EXISTS (SELECT 1 FROM "server"."servers" WHERE id = $2)
             AND EXISTS (SELECT 1 FROM "user"."users" WHERE id = $1)
           ON CONFLICT (user_id, server_id) DO NOTHING`,
          [
            userId,
            serverId,
            su.serverLevel    ?? su.server_level     ?? 0,
            su.serverLevelXp  ?? su.server_level_xp  ?? 0,
          ]
        );
        serverUserCount++;
      }
    } else {
      console.log('  (server_users not found in MySQL, skipping)');
    }
    if (serverUserSkipped > 0) console.log(`  (skipped ${serverUserSkipped} server_users rows with invalid IDs)`);
    console.log(`✓ ${serverUserCount} server_users migrated.\n`);

    // -------------------------------------------------------------------------
    // 6. server.server_level_roles  (de-duplicate on (server_id, role_id))
    // -------------------------------------------------------------------------
    console.log('=== Migrating server.server_level_roles ===');
    let slrCount = 0;
    let slrDuplicates = 0;
    if (await tableExists(mysqlConn, mysqlDb, 'server_level_roles')) {
      const [roles] = await mysqlConn.query('SELECT * FROM `server_level_roles`');
      const seen = new Set();
      for (const r of roles) {
        const serverId = toId(r.serverId ?? r.server_id);
        const roleId   = toId(r.roleId   ?? r.role_id);
        if (!serverId || !roleId) { slrDuplicates++; continue; }
        const key = `${serverId}:${roleId}`;
        if (seen.has(key)) { slrDuplicates++; continue; }
        seen.add(key);
        await pg.query(
          `INSERT INTO "server"."server_level_roles" (server_id, role_id, level)
           SELECT $1, $2, $3
           WHERE EXISTS (SELECT 1 FROM "server"."servers" WHERE id = $1)
           ON CONFLICT (server_id, role_id) DO NOTHING`,
          [serverId, roleId, r.level ?? 0]
        );
        slrCount++;
      }
    } else {
      console.log('  (server_level_roles not found in MySQL, skipping)');
    }
    if (slrDuplicates > 0) console.log(`  (skipped ${slrDuplicates} duplicate/invalid server_level_roles rows)`);
    console.log(`✓ ${slrCount} server_level_roles migrated.\n`);

    // -------------------------------------------------------------------------
    // 7. challenge.challenges + vote.challenge_votes
    //    Source: user_questions only.
    //    user_dares and user_truths are dropped — their data was merged into
    //    user_questions when that table was created.
    // -------------------------------------------------------------------------
    console.log('=== Migrating challenge.challenges + vote.challenge_votes ===');
    let challengeCount = 0;
    let challengeSkipped = 0;
    const BATCH_SIZE = 500;

    if (await tableExists(mysqlConn, mysqlDb, 'user_questions')) {
      const [uqs] = await mysqlConn.query('SELECT * FROM `user_questions`');

      for (let i = 0; i < uqs.length; i += BATCH_SIZE) {
        const batch = uqs.slice(i, i + BATCH_SIZE);

        const challengeRows = [];
        const challengeVoteData = [];

        for (const uq of batch) {
          const userId     = toId(uq.userId     ?? uq.user_id);
          const serverId   = toId(uq.serverId   ?? uq.server_id);
          const questionId = uq.questionId      ?? uq.question_id;
          if (!userId || !serverId || !questionId) { challengeSkipped++; continue; }

          challengeRows.push([
            toId(uq.messageId    ?? uq.message_id),
            userId,
            questionId,
            serverId,
            toId(uq.channelId   ?? uq.channel_id),  // PRE_5_6_9 / PRE_5_7_0 → null
            uq.username         ?? '',
            uq.imageUrl         ?? uq.image_url      ?? null,
            toBool(uq.skipped),
            uq.type             ?? 'truth',
            uq.datetime_created ?? new Date(),
          ]);
          challengeVoteData.push([
            uq.doneCount        ?? uq.done_count     ?? 0,
            uq.failedCount      ?? uq.failed_count   ?? 0,
            uq.finalResult      ?? uq.final_result   ?? null,
            uq.finalisedDatetime ?? uq.finalised_datetime ?? null,
          ]);
        }

        if (challengeRows.length === 0) continue;

        // Batch insert challenges, get back IDs in order
        const challengePlaceholders = challengeRows.map((_, idx) => {
          const base = idx * 10;
          return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8},$${base+9},$${base+10})`;
        }).join(', ');

        const challengeValues = challengeRows.flat();
        const insertedChallenges = await pg.query(
          `INSERT INTO "challenge"."challenges" (
            message_id, user_id, question_id, server_id, channel_id,
            username, image_url, skipped, type, datetime_created
          ) VALUES ${challengePlaceholders} RETURNING id`,
          challengeValues
        );

        // Batch insert challenge_votes using the returned IDs
        const voteRows = insertedChallenges.rows.map((r, idx) => [
          r.id,
          ...challengeVoteData[idx],
        ]);
        const votePlaceholders = voteRows.map((_, idx) => {
          const base = idx * 5;
          return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5})`;
        }).join(', ');

        await pg.query(
          `INSERT INTO "vote"."challenge_votes" (challenge_id, done_count, failed_count, final_result, finalised_datetime)
           VALUES ${votePlaceholders}`,
          voteRows.flat()
        );

        challengeCount += challengeRows.length;
        if (challengeCount % 50000 === 0) console.log(`  ... ${challengeCount.toLocaleString()} rows inserted`);
      }
    }

    if (challengeSkipped > 0) console.log(`  (skipped ${challengeSkipped} challenge rows missing required IDs)`);
    console.log(`✓ ${challengeCount} challenges (+ matching challenge_votes rows) migrated.\n`);

    // reports, adverts, entitlements: skipped — broken systems, no relevant data to migrate.

    // -------------------------------------------------------------------------
    // 11. config  (map matching columns only; truncate top_gg_webhook_secret)
    // -------------------------------------------------------------------------
    console.log('=== Migrating config (matching columns only) ===');
    if (await tableExists(mysqlConn, mysqlDb, 'config')) {
      const [configs] = await mysqlConn.query('SELECT * FROM `config`');
      if (configs.length > 0) {
        const src = configs[0];

        // Each entry: [pgColumn, mysqlAliases[], transform?]
        const mappings = [
          ['maintenance_mode',      ['maintenance_mode', 'maintenanceMode'],          toBool],
          ['maintenance_reason',    ['maintenance_reason', 'maintenanceReason'],       null],
          ['dares_log',             ['dares_log', 'daresLog'],                         toId],
          ['truths_log',            ['truths_log', 'truthsLog'],                       toId],
          ['servers_log',           ['servers_log', 'serversLog'],                     toId],
          ['reports_log',           ['reports_log', 'reportsLog'],                     toId],
          ['banned_users_log',      ['banned_users_log', 'bannedUsersLog'],            toId],
          ['errors_log',            ['errors_log', 'errorsLog'],                       toId],
          ['advertChannel',         ['advertChannel', 'advert_channel'],               toId],
          ['required_votes',        ['required_votes', 'requiredVotes'],               null],
          ['environment',           ['environment'],                                   null],
          ['client',                ['client'],                                        toId],
          ['secret',                ['secret'],                                        (v) => truncate(v, 90)],
          ['guildId',               ['guildId', 'guild_id'],                           toId],
          ['logs',                  ['logs'],                                          toId],
          ['top_gg_token',          ['top_gg_token', 'topGgToken'],                   (v) => truncate(v, 200)],
          ['top_gg_webhook_secret', ['top_gg_webhook_secret', 'topGgWebhookSecret'],  (v) => truncate(v, 90)],
          ['announce_password',     ['announce_password', 'announcePassword'],         (v) => truncate(v, 90)],
          ['bot_invite_url',        ['bot_invite_url', 'botInviteUrl'],                null],
          ['discord_invite_code',   ['discord_invite_code', 'discordInviteCode'],      (v) => truncate(v, 10)],
          ['announcementChannelId', ['announcementChannelId', 'announcement_channel_id'], toId],
          ['updateChannelId',       ['updateChannelId', 'update_channel_id'],          toId],
        ];

        const cols = [];
        const vals = [];
        for (const [pgCol, aliases, transform] of mappings) {
          let raw;
          for (const alias of aliases) {
            if (src[alias] !== undefined) { raw = src[alias]; break; }
          }
          if (raw === undefined) continue;
          cols.push(`"${pgCol}"`);
          vals.push(transform ? transform(raw) : raw);
        }

        if (cols.length > 0) {
          const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
          await pg.query(
            `INSERT INTO "system"."config" (${cols.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            vals
          );
          console.log(`✓ Config row migrated (${cols.length} columns mapped).\n`);
        } else {
          console.log('  (no matching config columns found, skipping)\n');
        }
      } else {
        console.log('  (config table is empty in MySQL, skipping)\n');
      }
    } else {
      console.log('  (config not found in MySQL, skipping)\n');
    }

    // -------------------------------------------------------------------------
    await pg.query('COMMIT');
    console.log('✓ Migration committed successfully!\n');
    console.log('Decisions applied:');
    console.log('  - archive_dares / archive_truths: discarded');
    console.log('  - user_dares / user_truths: discarded (merged into user_questions)');
    console.log('  - servers.can_create: FALSE for all rows');
    console.log('  - vote.user_votes: skipped (vote_type unavailable in source)');
    console.log('  - reports / adverts / entitlements: skipped (broken systems)');
    console.log('  - config: matching columns only');

  } catch (err) {
    await pg.query('ROLLBACK');
    console.error('\n✗ Migration failed — transaction rolled back.');
    console.error(err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    pg.release();
    await pgPool.end();
    await mysqlConn.end();
  }
}

migrate();
