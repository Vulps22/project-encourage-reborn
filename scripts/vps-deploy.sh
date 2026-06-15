#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/discord-bots/project-encourage-reborn"
cd "$APP_DIR"

# Load env vars so we have access to DISCORD_ERROR_WEBHOOK_URL
set -a
source .env
set +a

notify_failure() {
  curl -s -X POST "$DISCORD_ERROR_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d '{"content": "⚠️ **Deploy failed.** Shit hit the fan with the most recent release. Project Encourage is in an idle state awaiting human correction."}' || true
}

trap notify_failure ERR

echo "=== Stopping services ==="
docker compose stop bs ms ds

echo "=== Pulling new images ==="
docker compose pull ds ms bs

echo "=== Running migrations ==="
docker compose run --rm ds npm run db:migrate

echo "=== Starting services ==="
docker compose up -d ds
docker compose up -d ms
docker compose up -d bs

echo "=== Deploy complete ==="
