# Docker → Native PostgreSQL Cutover Runbook

Full procedure for switching prod from the Dockerized `encourage_db` container
to the native PostgreSQL instance: freeze writes, take a live dump, load it
onto the native instance, fix ownership/grants, repoint prod, unfreeze.

## Prerequisites

- Target Postgres instance already has the `postgres`, `awesome_vd_user`, and
  `bot_user` roles plus the `project-encourage` database bootstrapped (one-time
  cluster setup — see `database-service/database/scripts/bootstrap-native-db.sql`).

## 1. Enable maintenance mode

The real mechanism is a **separate bot process**, not a config flag:
`scripts/maintenance-bot.js` (+ `scripts/maintenance-worker.js`) is its own
Discord.js `ShardingManager` process that logs in with `PE_DISCORD_TOKEN`,
sets presence to "🔧 Under Maintenance", and replies ephemerally to every
interaction with a fixed message pointing to status.vulps.co.uk.

```bash
# Run this on a device that is NOT THE PRODUCTION VPS
# Use the production bot token for BS
node scripts/maintenance-bot.js
```

- There's also a DB-backed `core.config.is_locked` flag toggled via
  `POST /config/lockdown` on database-service — **do not rely on this**,
  bot-service fetches `core.config` but never actually reads `is_locked`
  anywhere, so flipping it has no effect. The maintenance-bot swap above is
  the only mechanism that actually stops traffic.
- all services should be disabled during this window to prevent any data loss caused by changes after the dump and to allow `DS` to accept the new environment variables

## 2. Dump the live prod database

Same connection pattern as the existing backup cron (`scripts/backup-postgres.sh`)
— host's `postgresql-client-18`, hitting the container's published port:

```bash
PGPASSWORD="$DB_PASSWORD" pg_dump -h 127.0.0.1 -p 5432 -U bot_user -d project-encourage \
  -Fc -f /opt/backups/project-encourage/cutover_$(date +%Y%m%d_%H%M%S).dump
```

Take this fresh, not the daily cron backup — anything written between last
night's backup and now would otherwise be lost. This dump file is what gets
loaded in step 4.

## 3. Reset the target database to empty

Run as `postgres` via socket (peer auth) — avoids all ownership/permission
edge cases a restricted role would hit:

```bash
sudo -u postgres psql -p <port> -d postgres \
  -c 'DROP DATABASE IF EXISTS "project-encourage";' \
  -c "CREATE DATABASE \"project-encourage\" OWNER postgres ENCODING 'UTF8';" \
  -c 'GRANT CREATE ON DATABASE "project-encourage" TO awesome_vd_user;'
```

## 4. Restore the dump (full clone: schema + data)

```bash
sudo cat /opt/backups/project-encourage/cutover_<timestamp>.dump | \
  sudo -u postgres pg_restore -v --no-owner --no-privileges --single-transaction --disable-triggers \
  -p <port> -d project-encourage
```

- `--no-owner --no-privileges`: strips the dump's original ownership/grants —
  prod's dump has everything owned by `bot_user` (the old single-role model).
  Restoring that as-is would hand `bot_user` full DDL rights again. Objects
  land owned by whoever connects to do the restore (`postgres`, via
  `sudo -u postgres`).
- `--single-transaction`: all-or-nothing restore; also lets the schema's
  `DEFERRABLE INITIALLY DEFERRED` FK constraints resolve at final commit
  regardless of per-table load order.
- `--disable-triggers`: requires superuser to disable the auto-generated
  `RI_ConstraintTrigger_*` FK-enforcement triggers — works here since we're
  `postgres`. Not actually required for a full schema+data restore (unlike a
  `--data-only` restore into an already-existing schema), but harmless.
- Socket + `sudo -u postgres` (peer auth) rather than password auth over TCP,
  since `awesome_vd_user`/`bot_user` are deliberately too restricted to run
  ownership-bearing operations like this anyway.
- **Known gap, not a bug**: the dump's `premium` schema doesn't exist in the
  repo's current schema files — it's been renamed to `entitlement` there but
  not yet migrated on real prod. Restore proceeds fine; `premium` just isn't
  reconciled with the new name yet (see Open Items).

## 5. Reassign ownership from postgres to awesome_vd_user

`REASSIGN OWNED BY postgres TO awesome_vd_user;` fails ("cannot reassign
ownership of objects owned by role postgres because they are required by the
database system") — `postgres` also owns core catalog objects, so a blanket
reassign is refused. Scope it to just the application schemas instead:

```sql
\c project-encourage
DO $$
DECLARE
  r RECORD;
  schemas TEXT[] := ARRAY['analytics','challenge','core','entitlement','moderation','premium','question','server','system','user','vote','public'];
BEGIN
  FOR r IN SELECT nspname FROM pg_namespace WHERE nspname = ANY(schemas) LOOP
    EXECUTE format('ALTER SCHEMA %I OWNER TO awesome_vd_user', r.nspname);
  END LOOP;

  FOR r IN
    SELECT c.relname, n.nspname, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = ANY(schemas) AND c.relkind IN ('r','v','m')
  LOOP
    EXECUTE format('ALTER %s %I.%I OWNER TO awesome_vd_user',
      CASE r.relkind WHEN 'v' THEN 'VIEW' WHEN 'm' THEN 'MATERIALIZED VIEW' ELSE 'TABLE' END,
      r.nspname, r.relname);
  END LOOP;

  FOR r IN
    SELECT p.proname, n.nspname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = ANY(schemas)
  LOOP
    EXECUTE format('ALTER FUNCTION %I.%I(%s) OWNER TO awesome_vd_user', r.nspname, r.proname, r.args);
  END LOOP;
END $$;
```

- Sequences are deliberately excluded from the relation loop (`relkind` list
  has no `'S'`) — `SERIAL`/`BIGSERIAL`-linked sequences can't be reassigned
  independently ("Sequence is linked to table"); `ALTER TABLE ... OWNER TO`
  cascades ownership to any sequences it owns automatically.
- This is a one-time console step, **not a tracked migration** — ownership
  doesn't affect `bot_user`'s ability to read/write data at all (that's
  governed entirely by grants, applied separately in step 6).

## 6. Apply any outstanding migrations

```bash
cd database-service && npm run db:migrate -- --prod
```

- This should include 2 migrations, one to grant bot_user the permissions it needs. Another to apply the new timescaleDB extension and hypertable
- Grants are defined per-table at the bottom of each
  `database/schemas/**/*.sql` file (source of truth for `db:install` fresh
  builds) and mirrored into a tracked migration
  (`database/migrations/20260807_162_grant_bot_user_permissions.js`) so the
  same grants can also apply to a database that already has data, not just a
  from-scratch install.
- That migration currently **excludes `entitlement`** — it doesn't exist yet
  on a real prod-sourced database, and a single failing `GRANT` would roll
  back the whole migration (it runs inside one transaction). Add
  `entitlement`'s grants alongside whatever migration eventually performs the
  `premium` → `entitlement` rename.

## 7. Verify

```bash
PGPASSWORD='<bot_user password>' psql -h <host> -p <port> -U bot_user -d project-encourage \
  -c 'SELECT id, type, question FROM "question"."questions" ORDER BY random() LIMIT 3;'
```

## 8. Point prod at the new database

Update the root `.env.production` `DB_HOST` (and `DB_PORT` if different) to
the native instance's address, then start `ds` only (`docker compose up
-d ds` from the repo root) so it picks up the new value — `ms`/`bs` stay down
until the smoke test in step 9 passes.

- **Still open**: exactly what address `DB_HOST` should be — see Open Items,
  the container-to-host networking question was deliberately deferred and
  needs resolving before this step is real. `encourage_db` (the current
  Docker-internal hostname) won't resolve once Postgres isn't a container on
  the same compose network.
- Once this is confirmed working, the `db` service in the root
  `docker-compose.yml` is no longer used and can be removed.

## 9. Verify with smoke test

Ask Claude Code to execute a few Curl requests to DS to fetch data from at least 3 tables to verify the change has worked

## 10. Disable maintenance mode
Start `ms` and `bs`.
Stop `maintenance-bot.js`.

## Open items (not yet resolved)

- `premium` → `entitlement` schema rename not yet migrated on real prod.
- Network restriction (`pg_hba.conf` / `listen_addresses`) is still an open
  design question — currently reached via SSH tunnel plus a firewalled
  non-default port, not a finished "localhost-only" setup.
- What `DB_HOST` in prod's `.env` should actually resolve to once containers
  can no longer reach Postgres via Docker-internal DNS (step 8).
- `entitlement`'s `bot_user` grants deferred until the rename lands.
