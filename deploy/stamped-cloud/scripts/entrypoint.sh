#!/usr/bin/env bash
# stamped-cloud entrypoint — fail closed on missing required secrets in prod.
set -euo pipefail

if [[ "${STAMPED_REQUIRE_SSM_SECRETS:-0}" == "1" ]]; then
  : "${DATABASE_URL:?DATABASE_URL required (SSM)}"
  : "${BETTER_AUTH_SECRET:?BETTER_AUTH_SECRET required (SSM)}"
  : "${L2_SERVICE_KEY:?L2_SERVICE_KEY required (SSM)}"
fi

exec "$@"
