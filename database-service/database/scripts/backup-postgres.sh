#!/bin/bash
# PostgreSQL backup script for project-encourage-reborn
#
# Retention policy:
#   - Last 7 daily backups
#   - Last 5 Sunday backups
#   - Last day of each month for the last 12 months
#
# Deploy to: /opt/discord-bots/project-encourage/backup-postgres.sh
# Cron:      0 0 * * * /opt/discord-bots/project-encourage/backup-postgres.sh

set -euo pipefail

BACKUP_DIR="/opt/discord-bots/project-encourage/backups"
LOG_FILE="$BACKUP_DIR/backup.log"

# Load .env if present so DB_* vars are available
ENV_FILE="/opt/discord-bots/project-encourage/.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
fi

PG_CONTAINER="${PG_CONTAINER:-project-encourage-reborn-db-1}"
PG_USER="${DB_USER:-bot_user}"
PG_PASSWORD="${DB_PASSWORD:-}"
PG_DB="${DB_NAME:-project-encourage}"

TODAY=$(date +%Y%m%d)
BACKUP_FILE="$BACKUP_DIR/backup_${TODAY}.sql.gz"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

mkdir -p "$BACKUP_DIR"

# ---------------------------------------------------------------------------
# Take backup
# ---------------------------------------------------------------------------
log "Starting backup → backup_${TODAY}.sql.gz"

if docker exec -e PGPASSWORD="$PG_PASSWORD" "$PG_CONTAINER" \
    pg_dump -U "$PG_USER" "$PG_DB" | gzip > "$BACKUP_FILE"; then
  SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
  log "Written: backup_${TODAY}.sql.gz ($SIZE)"
else
  log "ERROR: pg_dump failed — removing partial file"
  rm -f "$BACKUP_FILE"
  exit 1
fi

# ---------------------------------------------------------------------------
# Build retention set
# ---------------------------------------------------------------------------
declare -A KEEP=()

# 1. Last 7 days
for i in $(seq 0 6); do
  KEEP["$(date -d "$i days ago" +%Y%m%d)"]=1
done

# 2. Last 5 Sundays (day of week 7 = Sunday in ISO format)
SUNDAYS=0
OFFSET=0
while [ $SUNDAYS -lt 5 ]; do
  if [ "$(date -d "$OFFSET days ago" +%u)" -eq 7 ]; then
    KEEP["$(date -d "$OFFSET days ago" +%Y%m%d)"]=1
    SUNDAYS=$((SUNDAYS + 1))
  fi
  OFFSET=$((OFFSET + 1))
done

# 3. Last day of each of the last 12 months
for i in $(seq 0 11); do
  LAST_DAY=$(date -d "$(date +%Y-%m-01) -${i} months +1 month -1 day" +%Y%m%d)
  KEEP["$LAST_DAY"]=1
done

# ---------------------------------------------------------------------------
# Prune backups outside the retention window
# ---------------------------------------------------------------------------
DELETED=0
for FILE in "$BACKUP_DIR"/backup_????????.sql.gz; do
  [ -f "$FILE" ] || continue
  FILEDATE=$(basename "$FILE" .sql.gz | cut -d_ -f2)
  # ${KEEP[$FILEDATE]+_} expands to _ if key exists, empty string if not
  if [ -z "${KEEP[$FILEDATE]+_}" ]; then
    rm "$FILE"
    log "Pruned: backup_${FILEDATE}.sql.gz"
    DELETED=$((DELETED + 1))
  fi
done

log "Done. Pruned $DELETED old backup(s)."

# ---------------------------------------------------------------------------
# Sync to Google Drive (rclone remote: gdrive → DATABASE_BACKUPS folder)
# Apply the same retention policy: delete Drive files not in the keep set.
# ---------------------------------------------------------------------------
log "Syncing to Google Drive..."
RCLONE_CONF=/root/.config/rclone/rclone.conf

if rclone copy "$BACKUP_FILE" gdrive: --config "$RCLONE_CONF" 2>>"$LOG_FILE"; then
  log "Google Drive upload complete."
else
  log "WARNING: Google Drive upload failed — local backup still intact."
fi

# Prune Drive files outside the retention window
DRIVE_DELETED=0
while IFS= read -r DRIVE_FILE; do
  FILEDATE=$(echo "$DRIVE_FILE" | grep -oP '\d{8}')
  [ -z "$FILEDATE" ] && continue
  if [ -z "${KEEP[$FILEDATE]+_}" ]; then
    rclone delete "gdrive:${DRIVE_FILE}" --config "$RCLONE_CONF" 2>>"$LOG_FILE"
    log "Pruned from Drive: ${DRIVE_FILE}"
    DRIVE_DELETED=$((DRIVE_DELETED + 1))
  fi
done < <(rclone lsf gdrive: --config "$RCLONE_CONF" 2>>"$LOG_FILE" | grep -P '^backup_\d{8}\.sql\.gz$')

log "Google Drive pruned $DRIVE_DELETED old backup(s)."
