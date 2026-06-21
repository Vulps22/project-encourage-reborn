#!/usr/bin/env bash
# update-project-status.sh
# Usage: update-project-status.sh <issue_number> <status_option_id>
set -euo pipefail

ISSUE_NUMBER="$1"
STATUS_OPTION_ID="$2"
REPO="${GITHUB_REPOSITORY:-Vulps22/project-encourage-reborn}"
PROJECT_ID="PVT_kwHOACitxM4BbRy3"
STATUS_FIELD_ID="PVTSSF_lAHOACitxM4BbRy3zhWDZUs"

# ── Find the project item ID for this issue ───────────────────────────────────

OWNER="${REPO%%/*}"
REPO_NAME="${REPO##*/}"

ITEM_ID=$(gh api graphql -f query="
{
  repository(owner: \"${OWNER}\", name: \"${REPO_NAME}\") {
    issue(number: ${ISSUE_NUMBER}) {
      projectItems(first: 10) {
        nodes {
          id
          project { id }
        }
      }
    }
  }
}" --jq ".data.repository.issue.projectItems.nodes[] | select(.project.id == \"${PROJECT_ID}\") | .id")

if [ -z "$ITEM_ID" ]; then
  echo "Issue #${ISSUE_NUMBER} is not on project ${PROJECT_ID} — skipping"
  exit 0
fi

echo "Found project item: $ITEM_ID"

# ── Update the status field ───────────────────────────────────────────────────

gh api graphql -f query="
mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: \"${PROJECT_ID}\"
    itemId: \"${ITEM_ID}\"
    fieldId: \"${STATUS_FIELD_ID}\"
    value: { singleSelectOptionId: \"${STATUS_OPTION_ID}\" }
  }) {
    projectV2Item { id }
  }
}" > /dev/null

echo "Issue #${ISSUE_NUMBER} status updated to option ${STATUS_OPTION_ID}"
