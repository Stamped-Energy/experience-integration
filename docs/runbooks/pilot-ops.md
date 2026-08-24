# Runbook — Mumbai pilot ops (L6)

## Purpose

Operate the L6 Auto product BFF + web for the AWS `ap-south-1` pilot once
credentials and upstream contracts are available.

## Preconditions

- PostgreSQL migrated (`pnpm --filter @stamped/l6-api db:migrate`)
- `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `WEB_ORIGIN` set
- Upstream: `L5_BASE_URL` / `L2_BASE_URL` / `L4_BASE_URL` as needed; **never** `L2_DATABASE_URL`
- Feature flags remain off until contracts land (`L5_FEATURE_*`, `L2_FEATURE_*`)

## Smoke

1. `GET /health` and `GET /ready` on API (local serving)
2. `GET /health/deep` when DB is required
3. Sign-in + plant switch
4. Today loads; alarms list; prescription defer/done (fixture or live)
5. Evidence opens from alarm; ledger shows ops-confirmed ≠ bill-verified
6. SSE reconnects after pause; `Last-Event-ID` resumes
7. Export Centre: generate → approve → download HTML; CSV formula-safe

## Rollback

1. Disable live L4/L5 flags; fall back to fixture Auto
2. Redeploy previous task definition / image tag
3. Do **not** reverse migrations that drop auth tables without backup
4. Report jobs stuck in `running`: mark `failed` and retry after fix (dedupe key preserved)

## Incident notes

- Stale SSE: actions still work; show reconnect banner (shell already does)
- Upstream 501: surface partial/missing — never invent ledger/baseline
- Approval bypass: artifact download must remain gated on `approved` / review states

## Known limits

- Playwright E2E not in repo yet (`VALIDATE_E2E=1` will fail until installed)
- PDF/XLSX binary packs deferred — HTML + CSV only
- Public `/v1`, webhooks, Entra, Power BI deferred (Phase H)
