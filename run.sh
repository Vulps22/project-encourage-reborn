#!/usr/bin/env bash

# Cleanup: kill all child processes on exit
trap 'kill $(jobs -p) 2>/dev/null' EXIT INT TERM

prefix() {
  local label="$1"
  while IFS= read -r line; do
    printf '[%s] %s\n' "$label" "$line"
  done
}

(cd database-service && npm run dev 2>&1 | prefix "database") &
(cd project-encourage-reborn && npm run dev 2>&1 | prefix "encourage") &
(cd project-moderator && npm run dev 2>&1 | prefix "moderator") &

wait
