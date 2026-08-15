# Docker → Native PostgreSQL Cutover Runbook

Full procedure for switching prod from the Dockerized `encourage_db` container
to the native PostgreSQL instance: freeze writes, take a live dump, load it
onto the native instance, fix ownership/grants, open network access, repoint
prod, apply outstanding migrations, unfreeze.

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
- Stop `bs`, `ms`, and `ds` (`docker compose stop bs ms ds` per service, or
  equivalent) — this prevents writes during the dump and frees `ds` up to be
  restarted later against the new database.

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
- **Known gap, deliberately deferred, not a blocker**: the dump's `premium`
  schema doesn't exist in the repo's current schema files — it's been renamed
  to `entitlement` there but never migrated on real prod. Restore proceeds
  fine; `premium` just isn't reconciled with the new name yet. This cutover
  is a pure host migration (same schema in, same schema out) — the rename is
  an unrelated, orthogonal piece of work and should land as its own ordinary
  migration *after* cutover, not be bundled into it. See Open Items.

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
  governed entirely by grants, applied separately in step 7).

## 6. Open network access from the app containers to Postgres

**This is the step that was previously blocked/undecided — now resolved.**

Confirmed directly against the VPS: Postgres's `listen_addresses` is
currently `localhost` — it refuses connections from anywhere but loopback,
full stop, regardless of firewall or `pg_hba.conf` rules. `bs`/`ds`/`ms` run
on their own Docker bridge network (`project-encourage-reborn_default`,
confirmed gateway `172.22.0.1`, subnet `172.22.0.0/16`) — a different network
namespace from the host's loopback, so containers cannot reach
`127.0.0.1:49154` today no matter what `DB_HOST` is set to.

Three-tier access model — only one of these three actually needs to change:

- `postgres` (superuser) — local socket only, peer auth (`sudo -u postgres psql`,
  no network involved at all). **Unchanged.**
- `awesome_vd_user` (schema owner, runs migrations) — always connects from
  the VPS's own localhost: the repo is cloned onto the VPS and
  `npm run db:migrate` is run directly there, never remotely. Already works
  today against `listen_addresses = 'localhost'`. **Unchanged.**
- `bot_user` (app runtime credential) — this is the one that's actually
  reached from inside a Docker container (`ds`), on the bridge network. This
  is the only role that needs the new access below.

Fix (as `postgres` superuser, requires a Postgres restart):

1. In `postgresql.conf`, change:
   ```
   listen_addresses = 'localhost'
   ```
   to:
   ```
   listen_addresses = 'localhost,172.22.0.1'
   ```
   Scoped to exactly what's needed — loopback (unchanged, for `postgres`/
   `awesome_vd_user`) plus the specific Docker bridge gateway address `ds`
   reaches Postgres through. Not a wildcard `*` — no reason to bind
   interfaces nothing needs.

2. In `pg_hba.conf`, add a rule allowing `bot_user` specifically, from the
   Docker bridge subnet, with password auth:
   ```
   host    project-encourage    bot_user    172.22.0.0/16    scram-sha-256
   ```
   Not `awesome_vd_user` — it never connects from that network, so it has no
   reason to be reachable from it. `scram-sha-256` rather than `md5`: every
   password connection used while working on this (including the ones used
   to confirm this network issue in the first place) has succeeded with a
   plain password, and this is Postgres 18, where `scram-sha-256` has been
   the default for years — `md5` would only be in play if someone
   deliberately configured it otherwise.

3. Restart Postgres to apply `listen_addresses` (`pg_hba.conf` alone would
   only need a reload, but the `listen_addresses` change needs a full
   restart): `sudo systemctl restart postgresql@18-main` (confirm exact
   service name with `systemctl list-units | grep postgresql` first).

4. Verify from inside a container on that network, e.g.
   `docker exec encourage_ds sh -c "nc -zv 172.22.0.1 49154"` (or install a
   throwaway psql check) before proceeding — confirm reachability before
   trusting it in step 8.

**Resolved: `DB_HOST` for prod's `.env` is `172.22.0.1`** (this network's
Docker bridge gateway — reaches the host from any container on
`project-encourage-reborn_default`). Note this is specific to this compose
network; if it's ever recreated, re-check the gateway IP hasn't changed
(`docker network inspect project-encourage-reborn_default`).

## 7. Update `.env.production` and apply outstanding migrations

Update root `.env.production`: `DB_HOST=172.22.0.1`, `DB_PORT=49154`. Do this
now, before migrating — the migration script reads this file, and the old
`DB_HOST=encourage_db` is unresolvable outside the now-defunct Docker network
`ds` used to share with `encourage_db`.

```bash
cd database-service && npm run db:migrate -- --prod
```

This will report the TimescaleDB-dependent migrations as **skipped**, not
applied — `analytics.events`'s hypertable, weekly aggregate, and monthly
aggregate migrations are all gated behind `requiresSuperUser` (see
`database/migrations/README.md`). Before re-running:

```sql
-- as postgres superuser, via socket
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS timescaledb_toolkit;
```

Then re-run with the flag that applies superuser-gated migrations:

```bash
npm run db:migrate -- --prod --force-skipped
```

Expect **4** migrations to apply here, not 2:
- `20260807_162_grant_bot_user_permissions.js` — mirrors the per-table
  grants from `database/schemas/**/*.sql` onto a database that already has
  data. **Excludes `entitlement`** — it doesn't exist yet on a real
  prod-sourced database (see step 4's note and Open Items); a single failing
  `GRANT` would roll back the whole migration. Add `entitlement`'s grants
  alongside whatever migration eventually performs the rename.
- `20260811_162_create_analytics_events_hypertable.js` — creates
  `analytics.events`, converts it to a hypertable, 6-month retention policy.
- `20260811_162_create_analytics_events_weekly_aggregate.js` and
  `..._monthly_aggregate.js` — continuous aggregates with hyperloglog
  distinct-user/guild counts. Both run with `skipTransaction: true` (see
  `database/migrations/README.md`) — TimescaleDB refuses to create a
  continuous aggregate's refresh policy inside an explicit transaction, so
  these auto-commit statement-by-statement instead of atomically. If one
  fails partway, there's no automatic rollback: check what landed
  (`\d analytics` / `SELECT * FROM timescaledb_information.continuous_aggregates;`)
  and use `node database/scripts/revert.js <name> --prod` to clean up before
  retrying — `revert.js` can only target migrations already recorded in
  `system.migrations`, so a partially-applied, never-recorded migration
  needs the orphaned objects dropped by hand first (same recovery pattern
  used when this was worked out against staging).

## 8. Verify

```bash
PGPASSWORD='<bot_user password>' psql -h 172.22.0.1 -p 49154 -U bot_user -d project-encourage \
  -c 'SELECT id, type, question FROM "question"."questions" ORDER BY random() LIMIT 3;'
```

## 9. Start `ds` against the new database

```bash
docker compose up -d ds   # from the repo root
```

`bs`/`ms` stay down until the smoke test below passes. Once this is
confirmed working, the `db` service in the root `docker-compose.yml` is no
longer used and can be removed.

## 10. Smoke test

Curl DS directly to confirm at least 3 tables read correctly through the new
connection, then specifically exercise the reason for this whole migration —
confirm a real interaction lands in the interaction event log:

```bash
# after starting bs (still with ms down), run a real command in Discord,
# then check the row landed:
PGPASSWORD='<bot_user password>' psql -h 172.22.0.1 -p 49154 -U bot_user -d project-encourage \
  -c "SELECT created_at, service, interaction_type, interaction_name FROM analytics.events ORDER BY created_at DESC LIMIT 5;"
```

## 11. Disable maintenance mode

Start `ms` and `bs`.
Stop `maintenance-bot.js`.

## Open items (not yet resolved)

- `premium` → `entitlement` schema rename not yet migrated on real prod —
  deliberately deferred past this cutover (see step 4); needs its own
  migration afterward, including `entitlement`'s `bot_user` grants.
- **The migration deployment process itself needs a separate review.**
  Current understanding: the repo is cloned onto the VPS and
  `npm run db:migrate -- --prod` is run directly there as `awesome_vd_user`
  — but this is inferred from how things appear to work, not confirmed
  against an actual documented or automated process. Whether that's still
  accurate, whether it's manual every time, and whether it should be CI/CD
  instead, is unclear and worth its own investigation — separate from this
  cutover, not something to resolve here.

## Resolved during prep for this cutover

- ~~Network restriction (`pg_hba.conf` / `listen_addresses`)~~ — resolved in
  step 6: `listen_addresses` opened only to `localhost` (unchanged, for
  `postgres`/`awesome_vd_user`) plus the specific Docker bridge gateway IP
  (for `bot_user`); `pg_hba.conf` scoped to `bot_user` only, from that
  subnet, matching the existing firewall's boundary.
- ~~What `DB_HOST` should resolve to~~ — resolved: `172.22.0.1`, the
  `project-encourage-reborn_default` bridge network's gateway IP.
