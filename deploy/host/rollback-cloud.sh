#!/usr/bin/env bash
# Rollback stamped-cloud to the previously recorded image tag.
# Usage (on the EC2 host): sudo /opt/stamped/bin/rollback-cloud.sh
set -euo pipefail

PREV_FILE="${PREVIOUS_IMAGE_FILE:-/opt/stamped/state/PREVIOUS_IMAGE_TAG}"
CUR_FILE="${CURRENT_IMAGE_FILE:-/opt/stamped/state/CURRENT_IMAGE_TAG}"

if [[ ! -s "$PREV_FILE" ]]; then
  echo "No previous image tag at $PREV_FILE — cannot roll back." >&2
  exit 1
fi

PREV="$(grep -v '^#' "$PREV_FILE" | head -n1 | tr -d '[:space:]')"
if [[ -z "$PREV" || "$PREV" == *"stamped-cloud:"* && "$PREV" == *"<"* ]]; then
  echo "Previous image tag file is empty or still a placeholder." >&2
  exit 1
fi

START_TS="$(date +%s)"
echo "Rolling back to: $PREV"

aws ecr get-login-password --region "${AWS_REGION:-ap-south-1}" \
  | docker login --username AWS --password-stdin "$(echo "$PREV" | cut -d/ -f1)"

docker pull "$PREV"
export STAMPED_CLOUD_IMAGE="$PREV"
systemctl restart stamped-cloud

# Swap tags: current becomes previous of this rollback (optional audit trail)
if [[ -s "$CUR_FILE" ]]; then
  cp "$CUR_FILE" "${PREV_FILE}.pre-rollback"
fi
echo "$PREV" > "$CUR_FILE"

END_TS="$(date +%s)"
ELAPSED=$((END_TS - START_TS))
echo "Rollback complete in ${ELAPSED}s — record this duration in the runbook."
