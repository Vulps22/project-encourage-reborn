#!/bin/bash
#
# PostgreSQL backup script for project-encourage-reborn
#
# Retention policy (grandfather-father-son rotation):
#   - Daily:     7 fixed weekday-named slots (monday.dump ... sunday.dump).
#                Self-rotating via overwrite - never exceeds 7, no pruning needed.
#   - Weekly:    each Monday, the previous day's (Sunday's) daily slot is
#                promoted - not re-dumped, just copied. Capped at 5.
#   - Monthly:   on the 1st of each month, the previous day's daily slot is
#                promoted. Capped at 12.
#   - Quarterly: on Jan/Apr/Jul/Oct 1st, the previous day's daily slot is
#                promoted. Capped at 8 (2 years).
#
# Pruning is always count-based (count what's actually on disk, delete oldest
# until back at cap) - never assumes a steady-state count, so a missed cron
# cycle can't cause a wrong deletion.
#
# Dumps use pg_dump's custom format (-Fc): compressed, and restorable with
# pg_restore (selective/parallel restore, `pg_restore -l` for a listing
# without a full restore). Not plain SQL - can't grep/less it directly, but
# the file mtime (and OVH's own object upload timestamp) still records when
# each dump was taken.
#
# Connects directly to the exposed Postgres port on the host (127.0.0.1:$DB_PORT)
# using the host's postgresql-client-18 package - this must stay version-matched
# with the server (see: apt.postgresql.org / PGDG repo).
#
# Each tier is mirrored to OVHcloud Object Storage via `rclone sync --backup-dir`,
# so a local prune (or a local disaster - accidental wipe, compromise) can never
# cascade into deleting the off-site copy: anything sync would otherwise delete
# remotely is moved into `_deleted/<tier>/` instead. That quarantine path needs a
# one-time OVH bucket lifecycle rule configured separately (console/API, not this
# script) to expire objects under `_deleted/` after 30 days, so quarantined junk
# doesn't accumulate forever.
#
# This script must run as root - it is the only account allowed to touch
# backup files (/opt/backups/project-encourage is root-owned, mode 700), so
# that reading/deleting a backup is always a deliberate sudo override, never
# something the day-to-day user account can do by accident or via compromise.
# umask 077 + an explicit chmod below make this self-enforcing rather than
# relying on whoever deploys this remembering a one-time manual chmod.
#
# Deploy to: /opt/discord-bots/project-encourage-reborn/scripts/backup-postgres.sh
# Cron (root's crontab, `sudo crontab -e`):
#   5 0 * * * /opt/discord-bots/project-encourage-reborn/scripts/backup-postgres.sh

set -euo pipefail
umask 077

BACKUP_ROOT="/opt/backups/project-encourage"
DAILY_DIR="$BACKUP_ROOT/daily"
WEEKLY_DIR="$BACKUP_ROOT/weekly"
MONTHLY_DIR="$BACKUP_ROOT/monthly"
QUARTERLY_DIR="$BACKUP_ROOT/quarterly"
LOG_FILE="$BACKUP_ROOT/backup.log"

WEEKLY_CAP=5
MONTHLY_CAP=12
QUARTERLY_CAP=8

RCLONE_REMOTE="ovh"
RCLONE_BUCKET="project-encourage-backups"
RCLONE_CONF="/root/.config/rclone/rclone.conf"

# Posts a monthly nag to the admin channel on the 20th, so someone actually
# glances at backup health occasionally rather than only finding out it broke
# at restore time. Non-fatal if this fails - hardcoded rather than sourced
# from .env; a leaked webhook here can only post a nag message to an admin
# channel, low enough stakes that the deploy-time convenience won over the
# usual env-var-for-secrets convention this repo otherwise follows.
DISCORD_BACKUP_WEBHOOK_URL="https://discord.com/api/webhooks/1532893482702733413/dVuQJZHOWd2ZPmKtaOraSZ566R53mSNOV2tlR4HT9wEzvceVqwoPnagsH_eZUPl58gse"

ENV_FILE="/opt/discord-bots/project-encourage-reborn/.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
fi

PG_HOST="127.0.0.1"
PG_PORT="${DB_PORT:-5432}"
PG_USER="${DB_USER:-bot_user}"
PG_PASSWORD="${DB_PASSWORD:-}"
PG_DB="${DB_NAME:-project-encourage}"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

mkdir -p "$DAILY_DIR" "$WEEKLY_DIR" "$MONTHLY_DIR" "$QUARTERLY_DIR"
chmod 700 "$BACKUP_ROOT"

# ---------------------------------------------------------------------------
# 1. Daily: dump into today's fixed weekday slot (overwrites - self-rotating)
# ---------------------------------------------------------------------------
TODAY_WEEKDAY=$(date +%A | tr '[:upper:]' '[:lower:]')
TODAY_FILE="$DAILY_DIR/${TODAY_WEEKDAY}.dump"
TEMP_FILE="${TODAY_FILE}.bak"

log "Starting daily backup -> daily/${TODAY_WEEKDAY}.dump"

# Write to a staging file first. Writing straight into "$TODAY_FILE" would
# truncate the previous good backup the instant pg_dump opens it, before any
# data is written - so a failed dump would destroy that slot's last known
# good backup, not just fail to update it. Only overwrite the real file once
# pg_dump has actually succeeded.
if PGPASSWORD="$PG_PASSWORD" pg_dump -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -Fc -f "$TEMP_FILE"; then
  mv "$TEMP_FILE" "$TODAY_FILE"
  SIZE=$(du -sh "$TODAY_FILE" | cut -f1)
  log "Written: daily/${TODAY_WEEKDAY}.dump ($SIZE)"
else
  log "ERROR: pg_dump failed - previous backup for ${TODAY_WEEKDAY} left untouched"
  rm -f "$TEMP_FILE"
  exit 1
fi

# ---------------------------------------------------------------------------
# 2. Promotion: weekly / monthly / quarterly
#
# Promotes YESTERDAY's daily dump - already sitting in its weekday slot from
# yesterday's run. This is a copy of existing data, never a fresh pg_dump.
# ---------------------------------------------------------------------------
YESTERDAY_WEEKDAY=$(date -d "yesterday" +%A | tr '[:upper:]' '[:lower:]')
YESTERDAY_DATE=$(date -d "yesterday" +%Y-%m-%d)
YESTERDAY_FILE="$DAILY_DIR/${YESTERDAY_WEEKDAY}.dump"

promote() {
  local tier_dir="$1"
  local cap="$2"
  local label="$3"

  if [ ! -f "$YESTERDAY_FILE" ]; then
    log "WARNING: cannot promote to ${label} - daily/${YESTERDAY_WEEKDAY}.dump missing"
    return
  fi

  local dest="$tier_dir/${YESTERDAY_DATE}.dump"
  cp "$YESTERDAY_FILE" "$dest"
  log "Promoted daily/${YESTERDAY_WEEKDAY}.dump -> ${label}/${YESTERDAY_DATE}.dump"

  # Count-based prune: always driven by what's actually on disk right now,
  # never by an assumed steady-state count.
  local files=()
  mapfile -t files < <(find "$tier_dir" -maxdepth 1 -name '*.dump' -printf '%f\n' | sort)

  local count=${#files[@]}
  local i=0
  while [ "$count" -gt "$cap" ]; do
    local oldest="${files[$i]}"
    rm -f "$tier_dir/$oldest"
    log "Pruned ${label}/${oldest} (count was $count, cap is $cap)"
    i=$((i + 1))
    count=$((count - 1))
  done
}

DAY_OF_WEEK=$(date +%u)     # 1 = Monday
DAY_OF_MONTH=$(date +%d)    # zero-padded, compare as string to avoid octal parsing
MONTH=$(date +%m)           # zero-padded, compare as string for the same reason

if [ "$DAY_OF_WEEK" -eq 1 ]; then
  promote "$WEEKLY_DIR" "$WEEKLY_CAP" "weekly"
fi

if [ "$DAY_OF_MONTH" = "01" ]; then
  promote "$MONTHLY_DIR" "$MONTHLY_CAP" "monthly"

  if [[ "$MONTH" =~ ^(01|04|07|10)$ ]]; then
    promote "$QUARTERLY_DIR" "$QUARTERLY_CAP" "quarterly"
  fi
fi

# ---------------------------------------------------------------------------
# 3. Off-site sync: mirror each tier folder to OVHcloud Object Storage.
#
# --backup-dir quarantines anything sync would otherwise delete remotely
# (e.g. if the local copy were ever wiped or corrupted) into _deleted/<tier>/
# instead of actually deleting it, so a local disaster can't cascade into
# destroying the off-site copy too. --exclude keeps a stray .bak (left behind
# only if the process was killed mid-dump, e.g. OOM/reboot) out of the sync
# entirely.
# ---------------------------------------------------------------------------
log "Syncing to OVHcloud Object Storage..."

for tier in daily weekly monthly quarterly; do
  if rclone sync "$BACKUP_ROOT/$tier" "${RCLONE_REMOTE}:${RCLONE_BUCKET}/${tier}" \
      --backup-dir "${RCLONE_REMOTE}:${RCLONE_BUCKET}/_deleted/${tier}" \
      --exclude '*.bak' \
      --config "$RCLONE_CONF" 2>>"$LOG_FILE"; then
    log "Synced ${tier}/ to OVH."
  else
    log "WARNING: OVH sync failed for ${tier}/ - local backup still intact."
  fi
done

# ---------------------------------------------------------------------------
# 4. Monthly health-check reminder: nobody actively monitors this pipeline,
# so a once-a-month nag is the cheap substitute for real alerting.
# ---------------------------------------------------------------------------
if [ "$DAY_OF_MONTH" = "20" ]; then
  log "Sending monthly backup health-check reminder to Discord..."
  HTTP_STATUS=$(curl --max-time 10 -s -o /dev/null -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -d '{"content": "somebody check the backups please \n Grab the latest backup from the VPS and load it into a local postgres database to confirm it is not borked.\n if _anything_ looks wrong that is a **critical emergency**"}' \
    "$DISCORD_BACKUP_WEBHOOK_URL" || echo "000")

  if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 300 ]; then
    log "Discord reminder sent (HTTP $HTTP_STATUS)."
  else
    log "WARNING: Discord reminder failed (HTTP $HTTP_STATUS) - non-fatal."
  fi
fi

log "Backup run complete."
