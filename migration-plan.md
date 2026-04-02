**Project Encourage**

MySQL → PostgreSQL & Bot Migration Plan

Prepared: 31 March 2026 \| Updated: 2 April 2026 \| Status: IN PROGRESS

> **1. Executive Summary**

Project Encourage is being replaced by a fully rewritten bot ---
project-encourage-reborn --- built in TypeScript with Discord.js v14 and
a PostgreSQL database. The old bot runs on MySQL inside a Docker
container on a Contabo VPS and has been in a degraded/deprecated state
since March 2026 due to recurring DNS failures and circular dependency
bugs that cannot be patched without touching the published image.

This document covers the full migration: schema divergences between the
two databases, a step-by-step data migration plan, the bot switchover
procedure on the VPS, rollback strategy, and a realistic timeframe.

  ---------------------------------------------------------------------------------
  Old bot: vulps23/project-encourage:latest \| MySQL 9.4 \| Docker \| Port 3002
  New bot: project-encourage-reborn \| TypeScript \| PostgreSQL \| Discord.js v14
  VPS: Contabo 84.247.164.151 \| /opt/discord-bots/project-encourage/
  Backup: backup\_pre\_migration\_20260323\_041727.sql (taken 2026-03-23)
  ---------------------------------------------------------------------------------

> **2. Current State**

**2.1 Old Bot**

The old bot (project-encourage) runs as a Docker container on the
Contabo VPS. It is stateless apart from its MySQL database. The image is
published to Docker Hub as vulps23/project-encourage:latest and cannot
be modified without a full release cycle.

  ----------------- -----------------------------------------------------------------------------------------------------------------------------------------------------
  Language          JavaScript (Node.js)
  Database          MySQL 9.4 (Docker container)
  Deployment        docker-compose on Contabo VPS
  Process manager   Docker restart policy (always)
  Known issues      DNS crash loop (Contabo blocks outbound UDP 53 to 8.8.8.x); logger.deleteServer circular dep; MySQL volume was previously misconfigured (now fixed)
  Status            Running but deprecated. No further development planned.
  ----------------- -----------------------------------------------------------------------------------------------------------------------------------------------------

**2.2 Old Database**

The MySQL database (named \'tord\') contains 18 tables. Key volume
indicators from the backup taken 2026-03-23:

  -------------------------------- -------------- -------------------------------------------------
  **Table**                        Row count      Notes
  **questions**                    4,588          Core data --- approve/ban state, all questions
  **user\_questions**              1,983,390      Active challenge tracking
  **archive\_dares**               753            Old dare archive --- discarded, no target table
  **archive\_truths**              812            Old truth archive --- discarded, no target table
  **given\_questions**             388            PvP-style questions between users
  **reports**                      \~238          Skipped --- broken system
  **users**                        69,953         Global user records
  **servers**                      20,294         702 had no owner and were skipped
  **server\_users**                52,610         Per-server user XP tracking
  **user\_dares / user\_truths**   33,091/64,184  Discarded --- data already merged into user\_questions
  -------------------------------- -------------- -------------------------------------------------

> **3. Target State**

**3.1 New Bot**

  -------------------- --------------------------------------------------------------------
  Language             TypeScript, compiled to dist/
  Database             PostgreSQL (pg driver)
  Framework            Discord.js v14, multi-shard architecture
  Deployment           Containerised — Dockerfile created. CI/CD pipeline deploys automatically to Contabo VPS.
  DB install           npm run db:install (runs database/scripts/fresh-install.js)
  DB migrations        npm run db:rollout / db:rollback
  CI                   GitHub Actions: lint + 12 test suites + DB migration validation
  Pending migrations   None --- database/migrations/applied/ is empty. Schema is at HEAD.
  -------------------- --------------------------------------------------------------------

**3.2 New Database Schema Structure**

The new schema is split into PostgreSQL schemas (namespaces) rather than
a flat table list:

-   public --- adverts, entitlements, purchasables, reports, config
    (legacy system table), leaderboard\_recent\_top10

-   challenge --- challenges (replaces user\_dares, user\_truths,
    user\_questions)

-   core --- config (singleton), storables

-   question --- questions, given\_questions

-   server --- servers, server\_users, server\_level\_roles

-   user --- users, inventory

-   vote --- challenge\_votes, user\_votes

> **4. Schema Divergences**

**4.1 Global Changes (affect every table)**

  --------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  Discord IDs     MySQL stored as VARCHAR(20). PostgreSQL uses BIGINT. All IDs are numeric strings and can be CAST --- except legacy placeholder values (\'pre-v5\', \'pre-v5-6\', \'UNSET\') which must be set to NULL.
  Booleans        MySQL used TINYINT(1) / TINYINT (0/1). PostgreSQL uses native BOOLEAN (TRUE/FALSE). Must convert during migration.
  Column naming   MySQL used camelCase (e.g. isApproved, banReason). PostgreSQL uses snake\_case (is\_approved, ban\_reason). All references in application code are already updated.
  Timestamps      MySQL DATETIME → PostgreSQL TIMESTAMP. No timezone stored in either --- behaviour unchanged.
  ON UPDATE       MySQL supported ON UPDATE CURRENT\_TIMESTAMP. PostgreSQL does not --- reborn uses triggers instead (e.g. trg\_reports\_updated\_at, trg\_adverts\_updated).
  --------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**4.2 Table-by-Table Divergences**

  -------------------------------------------------------- ------------------------------------------------------------ --------------------------------------------------------- ---------------------------------------------------------------------------------------------------------------------------------------
  **MySQL Table/Column**                                   **PostgreSQL Equivalent**                                    **Change Type**                                           **Notes / Risk**
  adverts.description                                      adverts.advert                                               Column renamed                                            Data must be remapped. Also: created column dropped.
  adverts.serverId / messageId                             adverts.serverId / messageId                                 VARCHAR(20) → BIGINT                                      Numeric cast required.
  archive\_dares (753 rows)                                NO EQUIVALENT                                                Table dropped                                             Decision required --- migrate into question.questions or discard. See Section 4.3.
  archive\_truths (812 rows)                               NO EQUIVALENT                                                Table dropped                                             Same as above.
  config (system table)                                    config                                                       Mostly same                                               Discord ID columns VARCHAR→BIGINT. top\_gg\_webhook\_secret reduced VARCHAR(500)→VARCHAR(90) --- truncation risk if value \>90 chars.
  entitlements.id                                          entitlements.id                                              VARCHAR(20) → BIGINT                                      PK type change. Discord entitlement IDs are numeric --- safe to CAST.
  given\_questions.\*Id columns                            given\_questions.\*\_id                                      camelCase → snake\_case + VARCHAR→BIGINT                  senderId→sender\_id, targetId→target\_id, etc.
  given\_questions.xpType                                  given\_questions.xp\_type                                    Column renamed                                            Data identical, just renamed.
  given\_questions.doneCount / failCount                   given\_questions.done\_count / fail\_count                   Column renamed                                            
  questions.creator                                        question.questions.user\_id                                  Column renamed + VARCHAR→BIGINT                           approvedBy has DEFAULT \'pre-v5-6\' --- non-numeric legacy rows must be set to NULL.
  questions.isApproved / isBanned / isDeleted              question.questions.is\_approved / is\_banned / is\_deleted   TINYINT→BOOLEAN + renamed                                 
  questions.approvedBy                                     question.questions.approved\_by                              VARCHAR→BIGINT + renamed                                  Many rows contain \'pre-v5-6\' string --- cannot cast. Must NULL these rows.
  questions.serverId / messageId                           question.questions.server\_id / message\_id                  VARCHAR→BIGINT + renamed                                  Rows with \'pre-v5\' placeholder must be NULLed.
  reports (no message\_id)                                 reports.message\_id                                          New column added                                          Will be NULL for all migrated rows. Fine.
  reports.moderatorId / senderId / offenderId / serverId   reports.\*\_id (snake\_case)                                 Renamed + VARCHAR→BIGINT                                  
  server\_level\_roles                                     server.server\_level\_roles                                  Moved to server schema + PK added                         MySQL had no PK. PostgreSQL has composite PK (server\_id, role\_id). Duplicate rows would fail --- check before migrating.
  server\_users                                            server.server\_users                                         Moved to server schema + PK added + FK to servers added   MySQL FK was only to users. PG adds FK to servers too.
  servers.owner                                            server.servers.user\_id                                      Column renamed + VARCHAR→BIGINT                           
  servers.hasAccepted / isBanned / isDeleted               server.servers.has\_accepted / is\_banned / is\_deleted      TINYINT→BOOLEAN + renamed                                 
  servers.can\_create (new)                                server.servers.can\_create                                   New column --- no MySQL equivalent                        Default FALSE. Backfill from has\_accepted? Decision required.
  servers.banned\_by / datetime\_banned (new)              server.servers.banned\_by / datetime\_banned                 New columns --- no MySQL equivalent                       Will be NULL for all migrated rows.
  servers.level\_up\_channel / announcement\_channel       server.servers.level\_up\_channel / announcement\_channel    VARCHAR DEFAULT \'UNSET\' → BIGINT DEFAULT NULL           Rows with \'UNSET\' string must be set to NULL before CAST.
  user\_dares + user\_truths                               challenge.challenges (partially)                             Tables merged + restructured                              See Section 4.4 --- complex restructure.
  user\_questions                                          challenge.challenges + vote.challenge\_votes                 Table split into two                                      See Section 4.4.
  user\_vote                                               vote.user\_votes                                             Restructured                                              Old table had no vote\_type --- cannot determine who voted done vs failed. vote\_type must be inferred or defaulted.
  users.globalLevel / globalLevelXp                        user.users.global\_level / global\_level\_xp                 Renamed                                                   
  users.rulesAccepted / isBanned                           user.users.rules\_accepted / is\_banned                      TINYINT→BOOLEAN + renamed                                 
  users.voteCount                                          user.users.vote\_count                                       Renamed                                                   
  users.deleteDate                                         user.users.delete\_date                                      Renamed + DATETIME→TIMESTAMP                              
  (none)                                                   core.config                                                  New table (seed data)                                     Singleton config row. No migration needed --- seeded by db:install.
  (none)                                                   core.storables                                               New table (seed data)                                     Registry of inventory item types. Seeded by db:install.
  (none)                                                   user.inventory                                               New table                                                 Tracks per-user item quantities. Starts empty --- no migration needed.
  (none)                                                   vote.challenge\_votes                                        New table                                                 Aggregate vote counts per challenge. Partially derivable from user\_questions.doneCount/failedCount.
  (none)                                                   vote.user\_votes                                             New table                                                 Individual vote records. Partially derivable from user\_vote, but vote\_type is lost.
  -------------------------------------------------------- ------------------------------------------------------------ --------------------------------------------------------- ---------------------------------------------------------------------------------------------------------------------------------------

**4.3 Archive Tables --- Resolved**

  ----------------------------------------------------------------------------------------------------------------------------
  archive\_dares (753 rows) and archive\_truths (812 rows) have been discarded. These are pre-v5 era historical
  questions with no equivalent in project-encourage-reborn. Decision: discard.
  ----------------------------------------------------------------------------------------------------------------------------

**4.4 Challenge/Vote Table Restructure**

The old schema tracked challenges across three separate tables. The new
schema consolidates them:

  --------------------------------------------------------------------------------- -------------------------------------------------------- ---------------------------------------------------------------------------------------------------------------------------------------------------
  **Old MySQL Table**                                                               New PostgreSQL Table                                     Migration Notes
  **user\_questions (PK: messageId)**                                               challenge.challenges                                     messageId becomes message\_id (UNIQUE). New SERIAL id column becomes PK. channelId added (was missing in old schema, defaulted \'PRE\_5\_7\_0\').
  **user\_questions.doneCount / failedCount / finalResult / finalised\_datetime**   vote.challenge\_votes                                    Split into separate table keyed on challenge.id.
  **user\_dares (separate dare tracking)**                                          challenge.challenges (type=\'dare\')                     Merged --- done\_count, failed\_count, skipped fields map directly.
  **user\_truths (separate truth tracking)**                                        challenge.challenges (type=\'truth\')                    Merged --- same as above.
  **user\_vote (message\_id, user\_id only)**                                       vote.user\_votes (challenge\_id, user\_id, vote\_type)   vote\_type is LOST --- old table did not record done vs failed. Can default to \'done\' or skip migrating this table.
  --------------------------------------------------------------------------------- -------------------------------------------------------- ---------------------------------------------------------------------------------------------------------------------------------------------------

> **5. Data Migration Plan**

**5.1 Migration Script --- COMPLETE**

database/scripts/migrate-mysql-to-postgres.js has been written, tested
against a local copy of the production backup, and committed to the
add-migration-script branch. Run via:

> npm run db:migrate

The script connects to MySQL and PostgreSQL simultaneously, migrates
tables in FK-safe order, handles all data transformations inline, runs
inside a single PostgreSQL transaction (rolls back on any error), and
logs row counts and skipped/nulled values.

Additional legacy placeholders discovered during testing (not in the
original plan): empty string owner in servers (702 rows --- skipped),
PRE\_5\_6\_9 in user\_questions.channelId (754,243 rows --- NULLed).

**5.2 FK-Safe Migration Order**

Tables must be inserted in this order to satisfy foreign key constraints
in PostgreSQL:

1.  users (user.users) --- no dependencies

2.  servers (server.servers) --- depends on users

3.  questions (question.questions) --- no FK constraints to above, but
    logically first

4.  given\_questions (question.given\_questions)

5.  server\_users (server.server\_users) --- depends on users + servers

6.  server\_level\_roles (server.server\_level\_roles) --- depends on
    servers

7.  challenges (challenge.challenges) --- depends on questions

8.  challenge\_votes (vote.challenge\_votes) --- depends on challenges

9.  user\_votes (vote.user\_votes) --- depends on challenges

10. reports (reports) --- no FK constraints

11. config (system --- no FK constraints; matching columns only)

Skipped (broken systems, no relevant data):

-   reports, adverts, entitlements, purchasables

**5.3 Data Integrity Fixes Required**

  -------------------------------------------------------------------------------------------
  The following non-numeric legacy placeholder values exist in the MySQL backup and MUST be
  handled before or during migration --- they cannot be CAST to BIGINT directly.
  -------------------------------------------------------------------------------------------

  ------------------------------------- ------------------------ -------------------------------------------- -------------------------------------------
  **Table.Column**                      MySQL value              Action                                       Risk
  **questions.approvedBy**              \'pre-v5-6\'             Set approved\_by = NULL                      Low --- legacy rows only
  **questions.serverId**                \'pre-v5\'               Set server\_id = NULL                        Low
  **questions.messageId**               \'pre-v5\'               Set message\_id = NULL                       Low
  **servers.level\_up\_channel**        \'UNSET\'                Set level\_up\_channel = NULL                Medium --- affects level-up notifications
  **servers.announcement\_channel**     \'UNSET\'                Set announcement\_channel = NULL             Medium --- affects announcements
  **config.top\_gg\_webhook\_secret**   Up to VARCHAR(500)       Truncate to 90 chars or NULL                 Low --- Top.gg webhook only
  **entitlements.id**                   VARCHAR(20) Discord ID   CAST to BIGINT --- Discord IDs are numeric   Low
  ------------------------------------- ------------------------ -------------------------------------------- -------------------------------------------

**5.4 Decisions (Resolved)**

-   Archive tables: Discarded.

-   user\_dares / user\_truths: Discarded --- data was already merged
    into user\_questions when that table was created.

-   servers.can\_create: Defaulted to FALSE for all rows.

-   vote.user\_votes: Skipped --- vote\_type not available in source.

-   reports / adverts / entitlements: Skipped --- broken systems with
    no relevant data to migrate.

-   system config table: Matching columns mapped to PostgreSQL config;
    non-matching columns ignored.

> **6. Bot Switchover --- Step by Step**

This is the full end-to-end procedure for taking the old bot offline and
bringing the new bot live. Steps are ordered to minimise downtime and
maximise recoverability.

**Phase A --- Preparation (before maintenance window)**

  -------- ------------------------------------ ------ ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **\#**   **Action**                           **Status**   **Detail**
  **A1**   **Finalise all open PRs**            Pending      Ensure main branch is stable. All GitHub Actions (lint + 12 test suites + DB migration tests) must be passing.
  **A2**   **Write data migration script**      DONE         Written, tested against production backup, committed to add-migration-script branch. Successfully migrated 2.1M+ rows with zero errors.
  **A3**   **Verify .env for new bot**          DONE         .env.example updated: DB\_PORT corrected to 5432, MYSQL\_\* vars added. MySQL vars documented for migration use only.
  **A4**   **Build the new bot Docker image**   DONE         Dockerfile created. CI/CD pipeline (build workflow) handles image building automatically once RELEASES\_ENABLED=true.
  **A5**   **Update VPS docker-compose.yml**    Pending      Handled in separate branch (confirm with that conversation).
  **A6**   **Test new bot on staging**          Pending      Saturday playtest will serve as staging test.
  -------- ------------------------------------ ------ ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**Phase B --- Maintenance Window (scheduled downtime)**

  ------------------------------------------------------------------------------------------------
  Estimated downtime: 30 minutes to 2 hours depending on data volume and migration script speed.
  Recommended time: Off-peak hours. Announce downtime in the Discord server in advance.
  ------------------------------------------------------------------------------------------------

  --------- -------------------------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **\#**    **Action**                       **Detail**
  **B1**    **Announce maintenance**         Post a message to the Discord server announcing scheduled downtime.
  **B2**    **Stop old bot**                 SSH into VPS. Run: docker compose stop bot Do NOT use docker compose down --- this tears down the DB too.
  **B3**    **Take final backup**            Run: docker exec \<mysql\_container\> mysqldump -u root -p tord \> /opt/discord-bots/project-encourage/backup\_final\_\$(date +%Y%m%d\_%H%M%S).sql This is the rollback point.
  **B4**    **Start PostgreSQL container**   docker compose up -d db Wait for health check to pass: docker compose ps
  **B5**    **Run db:install on new bot**    From the project-encourage-reborn directory on the VPS: npm run db:install This creates all schemas, tables, triggers, and seed data.
  **B6**    **Run data migration script**    npm run db:migrate Monitor output carefully. Confirm row counts match expectations: ~70k users, ~19.5k servers, ~4.6k questions, ~1.98M challenges.
  **B7**    **Verify migrated data**         Spot-check key tables in PostgreSQL: - question.questions row count vs backup - user.users row count - server.servers row count
  **B8**    **Start new bot**                docker compose up -d bot docker compose logs -f bot Confirm bot connects to Discord and logs show no errors.
  **B9**    **Register slash commands**      If slash commands are not auto-registered on startup, run the deploy-commands script manually.
  **B10**   **Smoke test**                   In the Discord server: run /truth, /create, check moderation dashboard, verify XP is displaying correctly.
  **B11**   **Announce bot online**          Post to Discord server that the new bot is live.
  --------- -------------------------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**Phase C --- Post-Migration (within 48 hours)**

  -------- ------------------------------------------- ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **\#**   **Action**                                  **Detail**
  **C1**   **Monitor error logs**                      Watch docker compose logs for the first 24 hours. Set up the Discord error webhook (DISCORD\_ERROR\_WEBHOOK\_URL) so errors surface in the mod channel.
  **C2**   **Update llm-messages-to-future-llms.md**   Document the migration outcome, new docker-compose layout, and any issues encountered, for future LLM sessions.
  **C3**   **Remove old MySQL container and volume**   Once confident migration succeeded, remove the old MySQL container and named volume to free disk space: docker compose down (old stack) docker volume rm project\_encourage\_db
  **C4**   **Archive old docker-compose**              Move or remove the old bot docker-compose configuration. Keep the backup SQL files on disk for at least 30 days.
  **C5**   **Set up automated PostgreSQL backup cron** Deploy backup script to VPS and register cron job. See Section 11 for full details.
  -------- ------------------------------------------- ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> **7. VPS Deployment Notes**

**7.1 Docker Compose Changes Required**

The current docker-compose.yml in /opt/discord-bots/project-encourage/
only runs the old MySQL + old bot. The new docker-compose.yml needs:

-   A PostgreSQL service (image: postgres:latest) with POSTGRES\_USER,
    POSTGRES\_PASSWORD, POSTGRES\_DB from .env.

-   A bot service for the new bot image, with env\_file pointing to
    .env.

-   No dns: override --- Contabo blocks outbound UDP 53 to external
    resolvers. Containers must inherit DNS from the host
    (systemd-resolved → Contabo\'s servers).

-   No healthcheck on the bot service that checks an endpoint no longer
    present.

-   Postgres port mapped only to 127.0.0.1:5432 (not 0.0.0.0) unless
    external access is required.

**7.2 .env Configuration**

.env.example has been updated: DB\_PORT is now 5432 and MYSQL\_\* vars
have been added (migration use only). All other .env values
(DISCORD\_TOKEN, CLIENT\_ID, etc.) carry over from the old bot\'s
environment config.

**7.3 Dockerfile**

A multi-stage Dockerfile has been created in the repository root. The
database/ directory is included in the final stage so that npm run
db:install and npm run db:rollout can be run from within the container.

> FROM node:18-alpine AS builder
>
> WORKDIR /app
>
> COPY package\*.json ./
>
> RUN npm ci
>
> COPY . .
>
> RUN npm run build
>
> FROM node:18-alpine
>
> WORKDIR /app
>
> COPY \--from=builder /app/dist ./dist
>
> COPY \--from=builder /app/node\_modules ./node\_modules
>
> COPY \--from=builder /app/database ./database
>
> COPY package.json .
>
> CMD \[\"node\", \"-r\", \"dotenv/config\", \"dist/index.js\"\]

A .dockerignore is also in the repository root, excluding: node\_modules,
dist, coverage, .env, .env.local, .git, .github, \*.docx
>
> **8. CI/CD Pipeline**

The deployment pipeline is fully automated via four chained GitHub
Actions workflows: begin\_release → build → rollout → deploy.

**Branching Model**

  Branch                   Purpose
  ------------------------ -----------------------------------------------------------------------
  main                     Protected. All development work merges here.
  freeze/vX.Y.Z            Release candidate snapshot. Created on odd weeks (1st and 3rd Wednesday).
  current-release          Mirrors deployed state. Migration files committed here post-rollout, then merged back to main.

**Workflow: begin\_release**

Triggers every Wednesday at 8pm UTC (cron) and manually for hotfixes
(workflow\_dispatch). Gated by repository variable RELEASES\_ENABLED ---
must be set to true in GitHub repo settings before any release will
proceed.

-   Odd weeks (1st and 3rd Wednesday): checks for changes since last
    tag; if found, computes next version and creates a freeze/vX.Y.Z
    branch from main.

-   Even weeks (2nd and 4th Wednesday): finds the current freeze branch,
    checks out its code, runs the full test suite (all Jest tests +
    TypeScript compilation, excluding the linter), then tags the HEAD of
    the freeze branch and creates a GitHub Release.

-   Manual trigger (hotfix): same release path as even weeks, but
    appends -H\<n\> to the previous version tag (e.g. v2026.3.2-H1,
    v2026.3.2-H2).

Version format: v\<year\>.\<month\>.\<release\> for automatic releases,
v\<year\>.\<month\>.\<release\>-H\<n\> for hotfixes.

**Workflow: build** (triggered by tag push matching v[0-9]\*)

Builds the Docker image from the tagged commit and pushes two tags to
Docker Hub (vulps23/project-encourage): :latest and :\<version\>. Then
merges main into current-release (creating the branch if it does not
exist).

**Workflow: rollout** (triggered when build completes successfully)

Checks out current-release. Opens an SSH tunnel to the VPS to reach the
PostgreSQL database on 127.0.0.1:5432. Runs npm run db:rollout through
the tunnel. Commits any migration files moved to
database/migrations/applied/ back to current-release. Merges
current-release into main.

**Workflow: deploy** (triggered when rollout completes successfully)

SSHes into the VPS and runs: docker compose pull bot && docker compose
up -d bot

**GitHub Secrets required:**
SSH\_PRIVATE\_KEY, VPS\_HOST, DB\_USER, DB\_PASSWORD, DB\_NAME,
DOCKERHUB\_USERNAME, DOCKERHUB\_TOKEN

**GitHub Repository Variable required:**
RELEASES\_ENABLED --- set to true to enable the pipeline (unset by default).

**Branch protection:** Both main and current-release should use GitHub
Rulesets (not classic branch protection) with GitHub Actions set as a
bypass actor.

> **9. Rollback Plan**

If the new bot fails during or after migration, rollback is
straightforward because the old MySQL data is preserved:

  -------- -------------------------------- ---------------------------------------------------------------------------------------------------
  **\#**   **Action**                       **Detail**
  **R1**   **Stop new bot**                 docker compose stop bot
  **R2**   **Restore old docker-compose**   Revert to the original docker-compose.yml (MySQL + old bot image).
  **R3**   **Start old bot**                docker compose up -d The MySQL volume still contains all original data (backup taken at step B3).
  **R4**   **Verify old bot**               Confirm the old bot responds to Discord commands.
  **R5**   **Investigate failure**          Review logs, fix the issue, and reschedule migration.
  -------- -------------------------------- ---------------------------------------------------------------------------------------------------

  ------------------------------------------------------------------------------
  The old MySQL volume is NOT removed until Phase C (48 hours post-migration).
  Rollback is available for the full 48-hour monitoring window.
  ------------------------------------------------------------------------------

> **10. Estimated Timeframe**

  ------------------------------------------ ----------------- -------- ----------------------------------------------------------
  **Task**                                   **Estimate**      **Status**   **Notes**
  Resolve open decisions (Section 5.4)       0.5 days          DONE     All decisions resolved.
  Write Dockerfile + update docker-compose   0.5 days          DONE     Handled in separate branch.
  Write & test data migration script         1 day             DONE     Tested against production backup. 2.1M rows, zero errors.
  Write backup script                        0.5 days          DONE     GFS retention + Google Drive sync via rclone.
  Finalise open PRs + merge to main          0.5 days          Pending  add-migration-script + dockerfile branches.
  Staging test / Saturday playtest           0.5--1 day        Pending  Saturday 5 April 2026.
  Production migration window                30 min -- 2 hrs   Pending  Actual bot downtime (steps B1--B11).
  **Total remaining**                        **\~1--2 days**            Plus 48-hour monitoring period before removing old stack.
  ------------------------------------------ ----------------- -------- ----------------------------------------------------------

> **11. Risk Register**

  ----------------------------------------------------------------------------------------- ------------ ---------------- -------- ----------------------------------------------------------------------------------------------------------
  **Risk**                                                                                  **Impact**   **Likelihood**   **Status**   **Mitigation**
  Non-numeric legacy IDs (\'pre-v5-6\', \'UNSET\', \'PRE\_5\_6\_9\', empty string)         High         High             RESOLVED     Migration script handles all variants. Tested against full production backup with zero errors.
  archive\_dares / archive\_truths data permanently lost                                    Medium       High             RESOLVED     Discarded by decision. Documented.
  vote\_type data loss from user\_vote table                                                Low          High             RESOLVED     Skipped by decision. Documented.
  Contabo DNS issue causes new bot to crash-loop                                            High         Medium           Open         Do NOT add dns: override to docker-compose. Containers must inherit host DNS via systemd-resolved.
  New bot docker-compose missing bot service definition                                     High         High             Open         Being handled in separate branch. Confirm before Phase B.
  .env DB\_PORT still set to 3306 (MySQL default)                                           High         High             RESOLVED     .env.example updated to 5432.
  top\_gg\_webhook\_secret truncated from VARCHAR(500) to VARCHAR(90)                       Low          Low              RESOLVED     Migration script truncates to 90 chars. Config row migrated successfully.
  server\_level\_roles has no PK in MySQL --- duplicate rows would fail PostgreSQL import   Medium       Low              RESOLVED     De-duplication handled in migration script. 1 duplicate found and skipped.
  slash commands not registered after new bot starts                                        Medium       Medium           Open         Ensure the bot\'s startup flow registers commands, or run deploy-commands manually.
  No Dockerfile exists yet --- bot cannot run as container                                  High         High             RESOLVED     Handled in separate branch.
  ----------------------------------------------------------------------------------------- ------------ ---------------- -------- ----------------------------------------------------------------------------------------------------------

> **12. Automated PostgreSQL Backup Strategy**

**11.1 Retention Policy (GFS rotation)**

  ------------------- ----------- -------------------------------------------------
  **Tier**            **Count**   **Which backups are kept**
  Daily               7           One per day, last 7 days
  Weekly              5           Last Sunday of each of the past 5 weeks
  Monthly             12          Last day of each of the past 12 calendar months
  ------------------- ----------- -------------------------------------------------

Backups outside these windows are deleted automatically by the script on each run.

**11.2 Backup Script**

Deploy to: /opt/discord-bots/project-encourage/backup-postgres.sh

The script should:

-   Run pg\_dump against the PostgreSQL container using PGPASSWORD and the
    credentials from the running docker-compose stack.

-   Write the dump to /opt/discord-bots/project-encourage/backups/ named
    backup\_YYYYMMDD.sql.gz (gzip compressed).

-   After writing, apply the retention rules: keep the 7 most recent
    files by date, keep files dated on a Sunday for the last 5 Sundays,
    keep files dated on the last day of their month for the last 12
    months. Delete everything else.

-   Log each run (file written, files deleted, any errors) to
    /opt/discord-bots/project-encourage/backups/backup.log.

**11.3 Setup Instructions**

1.  **Deploy the script to the VPS:**

    > scp database/scripts/backup-postgres.sh contabo:/opt/discord-bots/project-encourage/backup-postgres.sh

2.  **Make it executable:**

    > chmod +x /opt/discord-bots/project-encourage/backup-postgres.sh

3.  **Verify rclone is configured** (should already be done by cowork):

    > rclone lsf gdrive: \--config /root/.config/rclone/rclone.conf

4.  **Register the cron job** (runs at midnight server time):

    > crontab -e

    Add:

    > 0 0 \* \* \* /opt/discord-bots/project-encourage/backup-postgres.sh

5.  **Test a dry run** before relying on it:

    > /opt/discord-bots/project-encourage/backup-postgres.sh

    Check the output and confirm a file appears in both
    /opt/discord-bots/project-encourage/backups/ and in the
    DATABASE\_BACKUPS folder on Google Drive.

**11.4 Restore Procedure**

To restore from a backup:

> gunzip -c backups/backup\_YYYYMMDD.sql.gz \| docker exec -i \<postgres\_container\> psql -U \<user\> \<dbname\>

To restore from Google Drive:

> rclone copy gdrive:backup\_YYYYMMDD.sql.gz /tmp/ \--config /root/.config/rclone/rclone.conf

> gunzip -c /tmp/backup\_YYYYMMDD.sql.gz \| docker exec -i \<postgres\_container\> psql -U \<user\> \<dbname\>

> **Appendix --- Key File Locations**

  ------------------------------ ----------------------------------------------------------------------------------
  **Item**                       **Path / Value**
  MySQL backup (pre-migration)   /opt/discord-bots/project-encourage/backup\_pre\_migration\_20260323\_041727.sql
  MySQL backup (initial)         /opt/discord-bots/project-encourage/backup\_20260323\_033257.sql
  VPS docker-compose             /opt/discord-bots/project-encourage/docker-compose.yml
  New bot schema files           database/schemas/\*\*/tables/\*.sql
  New bot DB scripts             database/scripts/ (fresh-install.js, rollout.js, rollback.js)
  Data migration script          database/scripts/migrate-mysql-to-postgres.js (npm run db:migrate)
  Backup script                  database/scripts/backup-postgres.sh → deploy to VPS before Phase C
  rclone config                  /root/.config/rclone/rclone.conf (remote: gdrive → DATABASE\_BACKUPS)
  PostgreSQL backups (VPS)       /opt/discord-bots/project-encourage/backups/
  LLM context notes              /opt/discord-bots/project-encourage/llm-messages-to-future-llms.md
  VPS IP                         84.247.164.151 (Contabo)
  VPS SSH                        ssh contabo (root, key: new\_contabo)
  ------------------------------ ----------------------------------------------------------------------------------

*End of document.*
