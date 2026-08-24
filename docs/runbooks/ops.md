# Runbook — L6 Experience Integration (ops stub)

Companion to [pilot-ops.md](./pilot-ops.md).

## Owner / escalation

- **Owner:** L6 maintainers
- **Escalate to:** product eng lead → on-call

## Bring-up order

1. Postgres migrated (`pnpm --filter @stamped/l6-api db:migrate`)
2. API → worker → web
3. Smoke: `GET /health`, `GET /ready` (local); `GET /health/deep` when `REQUIRE_DATABASE=true`

## Probes

| Path | Meaning |
|------|---------|
| `/health` | Liveness |
| `/ready` | Local serving only |
| `/health/deep` | DB when required; **503** when down |

## Security notes

- Helmet enabled (CSP report-only for pilot)
- `POST /api/telemetry` requires session when auth is wired; web vitals send `credentials: "include"`

## Secret rotation

Rotate `BETTER_AUTH_SECRET`, DB URL, upstream keys; rolling restart API + worker.

## Rollback

See [pilot-ops.md](./pilot-ops.md). Prefer feature-flag off for L4/L5 live before image rollback.

## Top failure modes

- Upstream timeouts — check forwarded `x-request-id` across L6→L5→L4→L2
- Telemetry 401 — missing session cookie
- npm audit / SBOM job failures — triage before merge
