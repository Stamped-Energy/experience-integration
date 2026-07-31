#!/usr/bin/env bash
# L6 completion orchestrator — sole gate for local/CI parity.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail() { echo "validate.sh FAIL: $*" >&2; exit 1; }

echo "== validate: docs drift =="
for f in \
  PROJECT_OVERVIEW.md \
  IMPLEMENTATION_PLAN.md \
  DECISIONS.md \
  PROGRESS.md \
  PHASE_E_COMPLETION.md \
  PHASE_F_COMPLETION.md \
  PHASE_G_COMPLETION.md \
  docs/SECURITY_REVIEW.md \
  docs/runbooks/pilot-ops.md \
  docs/IMPECCABLE_AUDIT.md
do
  [[ -f "$f" ]] || fail "missing $f"
done

if grep -R --line-number -E 'L2_DATABASE_URL\s*=' packages/api/src packages/web/src 2>/dev/null | grep -v 'forbidden\|refuse\|assertNo'; then
  fail "L2_DATABASE_URL must not be configured for use in L6 product code"
fi

echo "== validate: contracts =="
./external/scripts/contracts/contract-check.sh
pnpm contracts:upstream

echo "== validate: typecheck =="
pnpm typecheck

echo "== validate: unit/integration tests =="
pnpm test

echo "== validate: infra CDK assertions =="
pnpm --filter @stamped/l6-infra test

echo "== validate: build =="
pnpm build

if [[ "${VALIDATE_E2E:-0}" == "1" ]]; then
  echo "== validate: Playwright E2E =="
  pnpm --filter @stamped/l6-web build
  pnpm --filter @stamped/l6-web exec playwright install chromium
  pnpm --filter @stamped/l6-web test:e2e
else
  echo "== validate: Playwright E2E skipped (set VALIDATE_E2E=1) =="
fi

echo "validate.sh: ALL GREEN"
