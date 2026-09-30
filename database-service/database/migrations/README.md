# Database migrations directory
This directory contains migration files.

Each `*.js` file exports:
- `apply(client)` — forward migration (required)
- `revert(client)` — undo migration (required; absence triggers a webhook warning)
- `requiresSuperUser = '<reason>'` (optional) — gates the migration behind a
  manual step. `db:migrate` skips it (leaving it pending, unrecorded in
  `system.migrations`) and prints the reason, until re-run with
  `--force-skipped`. Use this when a migration needs something done
  out-of-band first (e.g. a superuser-only DDL statement).
- `skipTransaction = true` (optional) — runs `apply()` without the runner's
  `BEGIN`/`COMMIT` wrapper; each statement auto-commits on its own. Use this
  when Postgres/TimescaleDB refuses to run some of the migration's DDL
  inside an explicit transaction (e.g. creating a continuous aggregate and
  registering its refresh policy together). There is no automatic rollback
  on failure — `revert()` is the only recovery path, and the runner will
  remind you to run it manually if `apply()` throws partway through.

Applied migrations are tracked in the `system.migrations` table, not by
moving files on disk.
