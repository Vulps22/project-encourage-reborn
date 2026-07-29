**Project Encourage**

Analytics Dashboard — Master Plan (Draft 1)

Prepared: 29 July 2026 | Status: DRAFT — under active refinement

> This document is not an implementation plan. It captures the design decisions
> reached during scoping discussion, to be refined further and then broken up
> into individual GitHub issues under an **analytics** milestone. Nothing here
> should be built directly from this draft without that refinement pass.

---

## 1. Purpose

We want an analytics dashboard for Project Encourage. Before designing the
dashboard itself, this document audits what analytical data already exists in
the schema, identifies what's missing, and designs the one new system needed
to fill the biggest gap: a record of bot usage over time.

---

## 2. Existing analytical data (zero schema change required)

Every table below already has timestamp columns that can be bucketed
(`date_trunc('day'/'week', ...)`) and aggregated today, with no new
infrastructure. This is the first tier of the dashboard — safe to build on
immediately.

| Table | Timestamp column(s) | What it already gives us |
|---|---|---|
| `user.users` | `created_datetime`, `delete_date` | Signups/day, deletions/day, net growth |
| `server.servers` | `date_created`, `date_updated`, `datetime_banned`, `datetime_deleted` | Installs/day, uninstalls/day, ban events/day |
| `question.questions` | `created`, `datetime_approved`, `datetime_banned`, `datetime_deleted` | Submissions/day, moderation latency (`datetime_approved - created`), ban rate over time |
| `challenge.challenges` | `datetime_created` | Gameplay volume/day, truth vs dare split, skip rate, per-server activity trend |
| `vote.challenge_votes` | `finalised_datetime` | Completion/fail/skip verdict trend, time-to-verdict |
| `moderation.reports` (via `report_view`) | `created_at`, `updated_at` | Report volume/day, rough resolution latency |

`challenge.challenges` is the richest table here — it's effectively the only
existing gameplay event log, since `/truth` and `/dare` both write a row to
it with a timestamp and outcome.

---

## 3. Known dead or redundant fields

Found while auditing the schema — worth cleaning up independently of the
dashboard work, not analytics assets themselves:

- **`users.vote_count`** — never written anywhere in the current codebase.
  The top.gg vote webhook (`bot-service/src/routes/api/v1/vote.ts`) only
  grants a "skip" inventory item; it never touches this column. Dead field,
  migrated in from the old schema.
- **`users.banned_questions`** — redundant. Fully derivable from
  `COUNT(*) FROM question.questions WHERE user_id = X AND is_banned = true`,
  and `datetime_banned` gives the trend for free.
- **`question.given_questions`** — table exists in the schema but no DS
  service reads or writes it. Only referenced by the one-off MySQL migration
  script. Currently dead.
- **`analytics`** and **`premium`` schemas** — named in `CLAUDE.md`
  ("leaderboard views", "entitlements, purchasables") but no route or
  service in the codebase touches either. Either aspirational or exist in
  the live DB unused — needs confirming against prod directly.

---

## 4. Counters explicitly excluded from historical tracking

Decision: **do not** build longitudinal tracking for these fields.

- `users.global_level` / `global_level_xp`
- `server_users.server_level` / `server_level_xp`
- `user.inventory.qty`

Rationale: these are running totals updated in place, with no history
recoverable retroactively. Longitudinal XP tracking was considered and
rejected — completed-challenge counts per user/server per week (already
fully derivable from `challenge.challenges` + `challenge_votes.final_result`,
both timestamped) are a better engagement signal anyway: they're not
sensitive to per-server XP-config changes over time, and they're the real
behavioural signal we'd actually want to chart. The one edge case a true XP
ledger would add — exact XP delta per event, accounting for config drift —
was judged not worth the extra write-path complexity.

`vote.user_votes` (individual votes on challenge outcomes) was also
considered for time-based tracking and rejected for the same reason:
voting is a reaction to a challenge that's already timestamped in
`challenges.datetime_created`; it doesn't add usage-pattern information that
table doesn't already give us.

---

## 5. New system: Interaction Event Log

### 5.1 Why

None of the tables above capture bot *usage* in general — only the subset of
usage that happens to also be a domain event (a challenge played, a question
submitted). Commands like `/profile`, `/leaderboard`, `/inventory`, and all
button interactions touch nothing durable today. There's no way to answer
basic questions like "how many unique users interacted with the bot this
hour" or "what does usage look like by time of day."

Raw event rows (not pre-aggregated counts) were chosen deliberately.
Pre-aggregating at write time (e.g. an hourly `(command, guild_id) → count`
bucket) permanently forecloses any question that wasn't anticipated in the
bucket's dimensions — most notably **distinct counts** (unique users/guilds
per hour) and any future correlation analysis, which can never be recovered
once only a count has been stored. Raw rows preserve the ability to ask
questions we haven't thought of yet.

### 5.2 What counts as a loggable interaction

**In scope**: chat-input commands and button presses — the two interaction
types that can ever originate a new "chain" of user action.

**Explicitly excluded**, with reasoning:

| Interaction type | Excluded because |
|---|---|
| Autocomplete | Fires on every keystroke while typing a command; not a completed user action, just noise |
| Modal submits | Always a continuation of a button/command that's already logged. Confirmed against the only modal in the codebase (`reportModal`, opened by the `report_confirmed` button) — the button click is the "chain start", and the actual outcome (a report row) already lands in `moderation.reports` with its own timestamp regardless. Skipping modal submits only loses abandonment/funnel data ("opened the modal but never submitted"), which isn't a current goal |
| Select menus (string & channel) | Never serve as the initial interaction in any flow — always a follow-up to something already logged |
| top.gg vote webhook | Not a Discord interaction at all — arrives on a separate route with a different auth path and shape. Kept entirely out of this log |

### 5.3 Data captured per row (draft — needs refinement)

At minimum: timestamp, `service` (`bs` | `ms` — distinguishes player
activity in bot-service from moderation-staff activity in
moderator-service), interaction identifier (command name or button action),
`user_id`, `guild_id`. Exact final field list still TBD in refinement.

### 5.4 Storage: TimescaleDB

Decision: replace the plain Postgres Docker image with the TimescaleDB
image. This is a low-risk swap, not a database replacement — Timescale is a
Postgres extension distributed via a wire-compatible image; existing tables
and DS service code need no changes. Only the new interaction-log table
becomes a hypertable.

This directly replaces two pieces of fragile hand-rolled infrastructure we'd
otherwise need to build ourselves:
- **Continuous aggregates** instead of a cron-based rollup job
- **Native retention policies** (`add_retention_policy`) instead of a
  hand-rolled purge job

Because BS, DS, and MS all share one Postgres instance, this is a real
production migration (pin a compatible Postgres major version, backup, cut
over, verify) and should be treated as a deliberate, confirmed step — tested
on stage first — not a casual change.

### 5.5 Capture points

Confirmed against the actual code, both services have exactly one
`interactionCreate` entry point:

- **`bot-service/src/events/interactionCreate.ts`** — already calls
  `userTrackingService.trackInteraction(interaction)` near the top (before
  ban checks, before routing). The event-log call slots in alongside this
  existing call.
- **`moderator-service/src/bot/events/interactionCreate.ts`** — structurally
  identical dispatch logic, but currently has **no** tracking call at all
  (the file explicitly notes tracking is "intentionally absent" since MS is
  moderation-focused). This is new instrumentation for MS, not an extension
  of existing logic.

Write path (batching mechanism, whether BS/MS call a new DS endpoint or
something else, exact flush interval) is not yet decided — flagged for
refinement. Given the architecture principle that all DB access goes
through DS, the default assumption is a new DS endpoint accepting a batch
of events, but this needs confirming.

### 5.6 Retention & privacy

- **Raw rows**: 90-day retention, enforced via Timescale's native retention
  policy. Rationale: raw rows carry `user_id`/`guild_id` — identifiable data
  — and retaining identifiable data past the point it offers decision-making
  value is an unjustified liability. 90 days (one quarter) is judged
  sufficient for granular investigation and quarterly review cycles.
- **Aggregates**: kept indefinitely. Day/week rollups aren't identifiable in
  the way raw rows are, so they don't carry the same retention pressure.

### 5.7 Rollup requirement (must-have, not optional)

The continuous aggregates that raw rows roll into **must** include
`COUNT(DISTINCT user_id)` and `COUNT(DISTINCT guild_id)` per bucket, not
just `COUNT(*)`. If the rollup only stores row counts, "unique users per
hour" — the example that justified choosing raw events over pre-aggregation
in the first place — becomes unanswerable for any data older than 90 days,
silently reintroducing the exact problem this design was meant to avoid.

---

## 6. Open questions (need resolving before issue breakdown)

- Exact row schema / final field list for the interaction log
- Write path: new DS endpoint vs. some other mechanism; batching/flush
  interval and batch size
- Timescale migration plan for the shared production instance: version
  pinning, backup/rollback strategy, stage-first validation
- The dashboard/query layer itself — not yet discussed at all. This
  document only covers data capture, not presentation
- Whether `analytics`/`premium` schemas mentioned in `CLAUDE.md` actually
  exist in the live prod DB, and if so what they currently contain
  (needs direct DB access to confirm — not reachable from this environment)

---

## 7. Next steps

1. Continue refining this document until the open questions above are
   resolved.
2. Break the finalised plan into individual GitHub issues under a new
   **analytics** milestone, following repo convention (`gh issue develop`,
   branch-per-issue off `current-release`).
