#!/usr/bin/env bash
# Per-process / aggregate health for the cloud container.
# Exit 0 only when required HTTP probes succeed (or stubs are healthy).
set -euo pipefail

fail=0
probe() {
  local name="$1" url="$2"
  if curl -fsS --max-time 2 "$url" >/dev/null 2>&1; then
    echo "ok $name"
  else
    echo "fail $name ($url)" >&2
    fail=1
  fi
}

# Default pilot ports — replace with real /health paths when services land.
# Stub processes serve GET /health (and any path) with 200.
probe l2-query-api "http://127.0.0.1:8091/health"
probe l5-api "http://127.0.0.1:8080/health"
probe l6-bff "http://127.0.0.1:3001/health"

exit "$fail"
