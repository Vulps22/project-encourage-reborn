#!/usr/bin/env bash
set -euo pipefail

TYPE="$1"         # freeze | release | hotfix
VERSION="$2"      # e.g. v2026.6.2 or v2026.6.2-H1
WEBHOOK_URL="$3"
REPO="$4"

# ── Determine last tag ────────────────────────────────────────────────────────

if [ "$TYPE" = "hotfix" ]; then
  # Strip -HN suffix: v2026.6.1-H1 → v2026.6.1, v2026.6.1-H2 → v2026.6.1
  LAST_TAG=$(echo "$VERSION" | sed 's/-H[0-9]*$//')
else
  # freeze or release: last non-H release tag, excluding the version just tagged
  LAST_TAG=$(git tag -l 'v[0-9]*' | grep -v '\-H' | sort -V | grep -v "^${VERSION}$" | tail -1)
fi

if [ -z "$LAST_TAG" ]; then
  echo "No previous tag found — collecting all merged PRs"
  MERGE_RANGE="HEAD"
else
  echo "Collecting PRs since $LAST_TAG"
  MERGE_RANGE="${LAST_TAG}..HEAD"
fi

# ── Collect PR numbers from git log merge commits ─────────────────────────────

PR_NUMBERS=$(git log "$MERGE_RANGE" --merges --format="%s" \
  | grep -oE 'pull request #[0-9]+' \
  | grep -oE '[0-9]+' \
  | sort -n) || true

if [ -z "$PR_NUMBERS" ]; then
  echo "No merged PRs found since ${LAST_TAG:-beginning} — skipping Discord notification"
  exit 0
fi

# ── Build changelog lines ─────────────────────────────────────────────────────

TITLE_PATTERN='^#[0-9]+ - (Add|Remove|Update|Revert|Refactor) .+'
CHANGELOG_LINES=""

for PR_NUM in $PR_NUMBERS; do
  PR_JSON=$(gh pr view "$PR_NUM" --repo "$REPO" --json number,title 2>/dev/null) || {
    echo "Could not fetch PR #$PR_NUM — skipping"
    continue
  }
  PR_TITLE=$(echo "$PR_JSON" | jq -r '.title')

  if ! echo "$PR_TITLE" | grep -qE "$TITLE_PATTERN"; then
    echo "Skipping PR #$PR_NUM — title does not match format: $PR_TITLE"
    continue
  fi

  # Extract issue number and summary from PR title: "#126 - Update foo bar"
  ISSUE_NUM=$(echo "$PR_TITLE" | grep -oE '^#[0-9]+' | tr -d '#')
  SUMMARY=$(echo "$PR_TITLE" | sed 's/^#[0-9]* - //')
  VERB=$(echo "$SUMMARY" | awk '{print $1}')

  case "$VERB" in
    Add|Update|Refactor) SYMBOL="+" ;;
    Remove|Revert)       SYMBOL="-" ;;
    *)                   SYMBOL="~" ;;
  esac

  ISSUE_URL="https://github.com/${REPO}/issues/${ISSUE_NUM}"
  LINE="${SYMBOL} ${SUMMARY} ([#${ISSUE_NUM}](${ISSUE_URL}))"

  if [ -n "$CHANGELOG_LINES" ]; then
    CHANGELOG_LINES="${CHANGELOG_LINES}\n${LINE}"
  else
    CHANGELOG_LINES="$LINE"
  fi
done

if [ -z "$CHANGELOG_LINES" ]; then
  echo "No conforming PRs found — skipping Discord notification"
  exit 0
fi

# ── Build embed title, description, and colour per type ──────────────────────

case "$TYPE" in
  freeze)
    EMBED_TITLE="Freeze Preview — ${VERSION}"
    EMBED_COLOR=3447003
    DESCRIPTION="The following changes are queued for release in **${VERSION}**:"
    ;;
  release)
    EMBED_TITLE="Release ${VERSION}"
    EMBED_COLOR=3066993
    DESCRIPTION="The following changes shipped in **${VERSION}**:"
    ;;
  hotfix)
    EMBED_TITLE="Hotfix ${VERSION}"
    EMBED_COLOR=15158332
    DESCRIPTION="The following hotfix changes shipped in **${VERSION}**:"
    ;;
esac

# ── POST to Discord ───────────────────────────────────────────────────────────

CHANGELOG_BODY=$(printf '%b' "$CHANGELOG_LINES")

PAYLOAD=$(jq -n \
  --arg title "$EMBED_TITLE" \
  --arg desc "$DESCRIPTION" \
  --arg body "$CHANGELOG_BODY" \
  --argjson color "$EMBED_COLOR" \
  '{embeds: [{title: $title, description: ($desc + "\n\n" + $body), color: $color}]}')

echo "Posting changelog to Discord..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "$WEBHOOK_URL")

if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 300 ]; then
  echo "Discord notification sent (HTTP $HTTP_STATUS)"
else
  echo "ERROR: Discord webhook returned HTTP $HTTP_STATUS" >&2
  exit 1
fi
