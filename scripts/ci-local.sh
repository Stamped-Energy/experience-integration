#!/usr/bin/env bash
# Local parity with .github/workflows/ci.yml quality job (no GitHub Actions required).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

git submodule update --init --recursive
corepack enable
pnpm install --frozen-lockfile
./external/scripts/contracts/contract-check.sh
pnpm contracts:upstream
pnpm validate
