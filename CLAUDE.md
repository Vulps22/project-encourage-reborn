# Project Encourage — Root CLAUDE.md

## Working Agreement

**Always present a plan and wait for explicit approval before making any code changes.**
Do not edit, create, or delete files until the user says to go ahead.

## What This Is

A Discord Truth or Dare bot platform consisting of three services in a single monorepo (`Vulps22/project-encourage-reborn`):

| Service | Directory | Docker Image | Role |
|---|---|---|---|
| **BS** — bot-service | `bot-service/` | `vulps23/project-encourage` | Primary bot (gameplay, XP, user interaction) |
| **DS** — database-service | `database-service/` | `vulps23/project-encourage-ds` | REST API over PostgreSQL — all DB access goes through here |
| **MS** — moderator-service | `moderator-service/` | `vulps23/project-encourage-ms` | Standalone moderation bot + Express webhook server |

The root `docker-compose.yml` runs only PostgreSQL. Each service has its own `docker-compose.yml` and is deployed independently on the VPS.

---

## Architecture

```
User (Discord)
     │
     ▼
  BS Bot  ──── REST ────►  DS (port 3000)  ──── pg ────►  PostgreSQL
     │                                                        (port 5432)
     │
     └── POST /question ──►  MS (port 4001)
              Bearer auth       │
                                ▼
                         #mod-log channel (Discord)
                         Approve/Ban buttons → back to DS
```

- PE and MS talk to DS using Bearer tokens (`PE_API_SECRET` / `MS_API_SECRET`)
- MS talks back to DS using `MS_API_SECRET`
- All services share the same PostgreSQL instance
- Services communicate via container hostnames (`encourage_ds`, `encourage_ms`) on a shared Docker network on the VPS

---

## Environment

All services share the root `.env` file. On the VPS each service's `docker-compose.yml` references it via `env_file`.

### Critical env vars

```env
# PostgreSQL
DB_HOST=encourage_db        # container name on VPS
DB_PORT=5432
DB_USER=bot_user
DB_PASSWORD=...
DB_NAME=project-encourage

# DS auth secrets (DS validates these as Bearer tokens)
PE_API_SECRET=...           # PE uses this as DS_TOKEN
MS_API_SECRET=...           # MS uses this as its DB auth token

# PE-specific
DS_TOKEN=<same as PE_API_SECRET>   # what PE sends to DS
MS_TOKEN=<same as WEBHOOK_SECRET>  # what PE sends to MS
ENVIRONMENT=prod                   # MUST be 'prod', 'stage', or 'dev' — NOT 'production'
PE_DISCORD_TOKEN=...
PE_CLIENT_ID=...
WEBHOOK_PORT=3006
TOPGG_WEBHOOK_AUTH=...

# DS-specific
NODE_ENV=production
PORT=3000

# MS-specific
MS_PORT=4001                # MS reads MS_PORT first, falls back to PORT
WEBHOOK_SECRET=...          # MS validates incoming requests from PE with this
MS_DISCORD_TOKEN=...
DS_URL=http://encourage_ds:3000/api/v1
ENVIRONMENT=prod
```

### Legacy MySQL source (migration only)
```env
MYSQL_HOST=84.247.164.151
MYSQL_PORT=3309
MYSQL_USER=root
MYSQL_PASSWORD=...
MYSQL_DATABASE=tord
```

---

## Production Database Access

**PostgreSQL (target)**
```bash
PGPASSWORD=<DB_PASSWORD> psql -h 84.247.164.151 -p 5432 -U bot_user -d project-encourage
```

**MySQL (legacy source — read only)**
```bash
mysql -h 84.247.164.151 -P 3309 -u root -p'<MYSQL_PASSWORD>' tord
```

---

## Build & Deploy

### NPM auth
GitHub Packages token is in `~/.npmrc`:
```
//npm.pkg.github.com/:_authToken=<GITHUB_TOKEN>
```

### Docker builds
Run builds in a terminal, not via Claude directly.

### Tag convention
Every build gets three tags: `playtest`, `rc-<N>`, `v2026.05.1-h<N>`
- `rc-N` and `h-N` both increment with every build across all services (global counter)
- Always chain pushes with `&&`

### Build command template
```bash
cd /home/vulps/Documents/Project-Encourage/<service-dir> && \
docker build --build-arg NODE_AUTH_TOKEN=<GITHUB_TOKEN> \
  -t vulps23/<image>:playtest \
  -t vulps23/<image>:rc-<N> \
  -t vulps23/<image>:v2026.05.1-h<N> \
  . && \
docker push vulps23/<image>:playtest && \
docker push vulps23/<image>:rc-<N> && \
docker push vulps23/<image>:v2026.05.1-h<N>
```

### Current build counters (update as builds are done)
| Service | Last rc | Last h |
|---|---|---|
| BS | rc-5 | h5 |
| DS | rc-2 | h2 |
| MS | rc-6 | h6 |

---

## Service Details

### BS — bot-service
- **Entry**: `bot-service/src/index.ts` — ShardingManager + starts VoteWebhook on `WEBHOOK_PORT`
- **Config**: `bot-service/src/config/` — env-switched via `ENVIRONMENT` (`dev`/`stage`/`prod`)
- **Prod URLs**: `bot-service/src/config/prod/urls.ts` — DS on `encourage_ds:3000`, MS on `encourage_ms:4001`
- **Interaction pattern**: buttons must call `deferUpdate()` immediately before any async work, then use `ephemeralFollowUp()` (not `ephemeralReply()`) for responses
- **Components V2**: `challengeEmbed` uses `MessageFlags.IsComponentsV2` — never pass `content` alongside it; use `editReply()` not `update()` (route via `deferUpdate()` first)
- **Client auth**: `dsClient` sends `DS_TOKEN` as Bearer; `msClient` sends `MS_TOKEN` as Bearer

### DS — database-service
- **Entry**: `database-service/src/index.ts` — Express REST API on `PORT` (3000)
- **Auth middleware**: `database-service/src/middleware/auth.ts` — validates `PE_API_SECRET`, `MS_API_SECRET`, `POSTMAN_SECRET` (POSTMAN blocked in production)
- **Key gotcha**: `upsert()` uses `DO NOTHING` when all columns are conflict columns (no SET clause needed)

### MS — moderator-service
- **Entry**: `moderator-service/src/index.ts` — Discord bot + Express API on `MS_PORT` (4001)
- **Auth**: incoming requests validated against `WEBHOOK_SECRET`
- **DS client**: `moderator-service/src/bot/services/DatabaseClient.ts` — sends `MS_API_SECRET` as Bearer to DS
- **Config**: `moderator-service/src/bot/config/prod/Config.ts` — all channel IDs hardcoded (not env-driven)
- **Prod channel IDs**: same Discord server as stage (`1079206786021732412`)

---

## Database Schema

PostgreSQL with named schemas:

| Schema | Purpose |
|---|---|
| `user` | Users, XP, inventory |
| `server` | Servers, server_users, level_roles |
| `question` | Questions, given_questions |
| `challenge` | Challenges (active T&D games) |
| `vote` | challenge_votes, user_votes |
| `system` | Config |
| `analytics` | Leaderboard views |
| `moderation` | Reports |
| `premium` | Entitlements, purchasables |

### DB migration scripts
```bash
cd database-service
node database/scripts/migrate-mysql-to-postgres.js   # MySQL → PostgreSQL (one-time)
npm run db:rollout                                    # apply pending migrations
npm run db:rollback                                   # revert a migration
```

---

## Playtest

- **Period**: `<t:1778299200:F>` to `<t:1780200000:F>` (5am BST 09 May 2026 → 5am BST 31 May 2026)
- **Server**: Truth or Dare Online 18+ Official Server (`1079206786021732412`)
- **Bot**: PE client ID `1079207025315164331`
- **Tag**: `:playtest` / `:rc-N`
- All data will be wiped at playtest end

---

## Open GitHub Issues

| # | Repo | Summary |
|---|---|---|
| [#105](https://github.com/Vulps22/project-encourage-reborn/issues/105) | PE | `fetch failed` error gives no context (URL, service, reason) |
| [#106](https://github.com/Vulps22/project-encourage-reborn/issues/106) | PE | GitHub Actions test workflows need `NODE_AUTH_TOKEN` for private packages |

---

## Git Conventions

### Branch naming
```
<issue_number> - <issue title>
```
Example: `105 - improve-fetch-failed-error-messages`

Unless explicitly instructed otherwise, every working branch must relate to a specific GitHub issue.

**ALWAYS branch off `current-release` — NEVER off `main`.** PRs merge into `main`. `current-release` is the production branch; branching off it means every branch starts from a known-good production state. Fixes merged into `current-release` can then flow into any in-flight branch independently, without waiting for unrelated work on `main` to land first.

### Commit message format
```
#<issue_number> - <message up to 50 characters>
```
Example: `#105 - wrap fetch errors with url and reason`

- Commit message **bodies** are reserved for particularly complex commits — omit them for routine changes
- Commits must be **single responsibility** — one logical change per commit
- If a single file contains changes belonging to two different concerns, **cherry-pick the relevant hunks** using `git add -p` rather than committing the file wholesale
- Never commit incomplete or work-in-progress code that belongs to a different concern — keep each commit self-contained and coherent

### PR title format
```
#<issue_number> - Add|Remove|Update|Revert|Refactor <short summary>
```
Examples:
- `#126 - Update all string based messages to new Components V2 views`
- `#112 - Add vote skip command for inventory`
- `#99 - Remove deprecated string overload from sendReply`

The changelog script (issue #125) strips the `#<issue> - ` prefix and uses the leading verb for Discord symbol mapping (`Add`/`Update`/`Refactor` → `+`, `Remove`/`Revert` → `-`). A `validate-pr-title.yml` workflow enforces the format — PRs that don't match are blocked. No colon after the verb.

---

## Code Standards

All code across PE, DS, and MS must follow the **SOLID principles** and be **DRY** (Don't Repeat Yourself).

- **S**ingle Responsibility — each class/module does one thing only
- **O**pen/Closed — open for extension, closed for modification
- **L**iskov Substitution — subtypes must be substitutable for their base types
- **I**nterface Segregation — prefer small, focused interfaces over large general ones
- **D**ependency Inversion — depend on abstractions, not concretions

**DRY — Don't Repeat Yourself**: every piece of logic should have a single, authoritative source. If the same code appears in more than one place, extract it. The `done`, `failed`, and `skip` button handlers are a good example of where shared logic should live in a shared function rather than being duplicated across three files.

---

## Key Patterns

### Adding a new button handler (PE)
1. Create `src/_handlers/buttons/<prefix>/<name>.ts`
2. Export a `Handler<BotButtonInteraction>` with `name` matching the customId action segment
3. Always `await interaction.deferUpdate()` as first line
4. Use `ephemeralFollowUp()` for all user-facing responses (not `ephemeralReply()`)

### Adding a new DS route
1. Create `database-service/src/routes/<resource>/index.ts`
2. Add Bearer auth via `bearerAuth` middleware
3. Consumers are `PE`, `MS`, `POSTMAN` — `req.consumer` is set after auth

### Running dev locally
```bash
# Root — starts all three services with prefixed logs
./run.sh
```
