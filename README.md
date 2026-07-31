# Stamped L6 — Experience & Integration

> **What it is:** The customer-facing ops control room for Indian manufacturing energy teams — Today home, EMS alarms, prescription triage, claim-safe savings, dual-mode analyst, analytics, exports, and enterprise connectors — composed over L2/L4/L5 HTTP.  
> **What it is not:** L3 detection, L5 workflow system of record, L4 RAG runtime, SCADA HMI, DISCOM bill verifier, or ESG filing system.  
> **Primary interface:** Forge web app (`packages/web`) → product BFF (`packages/api`). Secondary: scoped public `/v1` + webhooks.

**Runtime:** Node ≥22.14 · pnpm 11 · Next.js 16 · Fastify 5 · PostgreSQL 16 · AWS `ap-south-1` (Mumbai pilot definitions)  
**Platform SoT:** [`external/`](external/) git submodule → [stamped-external](https://github.com/Vinayak-RZ/stamped-external)

---

**TL;DR**

- Ops-first control room: clear the next high-value decision with proof one tap away.
- Browser never holds upstream secrets — only the L6 BFF talks to L2 / L4 / L5.
- Customer-facing P0 “verified” means **`ops_confirmed`** (telemetry clearance), never invented bill verification ([ADR-020](external/decisions/ADR-020-l5-mv-claim-governance.md)).
- Fixture **Auto** mode when upstream feature gates are off — demos and CI stay green without live siblings.
- Shared Jaipur Works demo plant in [`packages/web/src/fixtures/demo.ts`](packages/web/src/fixtures/demo.ts) wires every Forge screen.
- PostgreSQL only for L6 identity, membership, audit, events, jobs, and integrations — **Redis forbidden**.
- Public `/v1` (API keys) + Standard Webhooks + Entra/Power BI contracts ship in Phase H; live tenants are cutover.
- Forge Industrial design system: calm grayscale ops, coral for action, ≤7 Today signals.
- Validate locally with `pnpm validate`; CI runs quality, Postgres integration, Playwright, and infra CDK tests.
- Agents must `git submodule update --init` before build — contracts live under `external/`.

---

## Table of contents

1. [Vision](#1-vision)
2. [Architecture](#2-architecture)
3. [Quickstart](#3-quickstart)
4. [Configuration](#4-configuration)
5. [Project structure](#5-project-structure)
6. [Interfaces](#6-interfaces)
7. [Data model](#7-data-model)
8. [Demo plant & Auto fixtures](#8-demo-plant--auto-fixtures)
9. [Testing](#9-testing)
10. [Deployment & CI](#10-deployment--ci)
11. [Cookbook](#11-cookbook)
12. [Roadmap & changelog](#12-roadmap--changelog)
13. [FAQ & glossary](#13-faq--glossary)
14. [Authority & further reading](#14-authority--further-reading)

---

## 1. Vision

### 1.1 What it is

Stamped **L6** is the Experience & Integration layer. It is where plant operators, supervisors, plant heads, energy managers, sustainability, CFO, and admins:

- triage EMS alarms and prescriptions with evidence one hop away;
- read potential, modeled, and ops-confirmed savings without conflating them with bill lines;
- investigate energy, equipment, TOD/MD, intensity, and Scope 2 disclosure;
- use Mode A (contextual) and Mode B (workspace) analyst with confirm-before-L5;
- approve sustainability packs and export claim-safe CSVs;
- manage members, API keys, webhooks, and (when configured) Entra / Power BI.

### 1.2 What it is not

| Is not | Why |
|--------|-----|
| L3 detection / rulepacks | Lives in sibling L3 repos |
| L5 workflow SoT | L5 owns alarm/Rx truth; L6 adapts |
| L4 RAG / LangGraph | L4 owns analyst runtime; L6 is the shell |
| Direct Timescale / OT writes | L6 never sets `L2_DATABASE_URL`; never writes SCADA |
| Bill-verified savings inventer | `verified` requires future bill path + line refs |
| Full BRSR / ESG filing product | Adjunct HTML packs only through P2 |
| Redis / WhatsApp / SAP / SCIM / native mobile | Explicit non-goals for this delivery |

### 1.3 Who it is for

| Role | Default landing | Core job |
|------|-----------------|----------|
| Operator | `/alarms` | Ack / escalate / silence assigned alarms |
| Supervisor | `/prescriptions` | Triage Rx by ₹ × confidence |
| Plant head | `/` (Today) | Ops health + ops-confirmed value |
| Energy manager | `/energy` | Trends, equipment, TOD/MD, intensity |
| Sustainability | `/reports` | Defensible packs + disclosure honesty |
| CFO | `/reports` (ledger) | Read value without ops controls |
| Admin | `/settings/*` | Members, keys, webhooks, SSO status |

### 1.4 Success criteria

- Clear the next high-value operational decision with proof one tap away.
- Never present `ops_confirmed` as bill-verified.
- Analyst never auto-writes L5 without explicit confirm.
- Primary routes handle loading / empty / error / stale / forbidden / partial.
- p75 LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1; primary JS ≤ 350 kB gzip hard ceiling.

---

## 2. Architecture

### 2.1 High-level diagram

```mermaid
flowchart LR
  Browser[Next.js_Forge_web] --> BFF[Fastify_L6_BFF]
  BFF --> L2[L2_query_HTTP]
  BFF --> L4[L4_analyst_HTTP]
  BFF --> L5[L5_workflow_HTTP]
  BFF --> Pg[(L6_PostgreSQL)]
  Worker[pg_boss_worker] --> Pg
  Worker --> Reports[Report_jobs]
  BFF --> Public["Public_/v1"]
  BFF --> SSE[Resumable_SSE]
  L5 --> Cursor[L5_event_cursor]
  Cursor --> Pg
```

### 2.2 Request lifecycle (product BFF)

```mermaid
sequenceDiagram
  participant U as Browser
  participant W as packages/web
  participant A as packages/api
  participant Up as L2/L4/L5
  participant Db as PostgreSQL
  U->>W: Navigate / act
  W->>A: Cookie session + plant context
  A->>A: AuthZ matrix plant role
  alt Feature gate live
    A->>Up: Bounded HTTP adapter
    Up-->>A: Domain payload
  else Fixture Auto
    A-->>W: Deterministic fixture
  end
  A->>Db: Audit / events / jobs as needed
  A-->>W: JSON / SSE / CSV / HTML
```

### 2.3 Package boundaries

| Package | Path | Responsibility | Must not |
|---------|------|----------------|----------|
| Web | `packages/web` | Forge UI, client islands, demo fixtures | DB, service secrets |
| API | `packages/api` | BFF, auth, RBAC, upstream adapters, `/v1`, SSE | Browser-facing secrets in responses |
| Contracts | `packages/contracts` | Zod schemas, claim/workflow mappings | Fork `external/contracts` fields |
| Worker | `packages/worker` | pg-boss queues on Postgres | Redis, invent domain truth |
| Infra | `infra/` | Compose + CDK Mumbai stack | Silent `cdk deploy` |
| External | `external/` | Platform ADRs, handoffs, shared contracts | Edited as a fork |

### 2.4 Claim-safety control stack

```mermaid
flowchart TD
  Raw[Ledger_or_Rx_status] --> Sanitize{sanitizeClaimStatus}
  Sanitize -->|verified without billLineRefs| Ops[Force_ops_confirmed]
  Sanitize -->|verified + bill refs| Bill[Bill_verified]
  Sanitize -->|ops_confirmed / modeled / pending / disputed| Keep[Keep_label]
  Ops --> UI[Forge_badge_not_bill_verified]
  Bill --> UI
  Keep --> UI
```

Implementation: [`packages/web/src/lib/ledger.ts`](packages/web/src/lib/ledger.ts), mirrored in API exports and contracts enums.

### 2.5 Key modules (paths)

| Concern | Path |
|---------|------|
| BFF boot | `packages/api/src/index.ts`, `packages/api/src/app.ts` |
| Env / gates | `packages/api/src/config.ts` |
| AuthZ matrix | `packages/api/src/authz/matrix.ts` |
| Upstream L2/L4/L5 | `packages/api/src/upstream/` |
| Public API + OpenAPI | `packages/api/src/public/` |
| Web nav / role matrix | `packages/web/src/lib/navigation.ts` |
| Demo plant SoT | `packages/web/src/fixtures/demo.ts` |
| Forge tokens | `packages/web/src/styles/tokens.css` |

---

## 3. Quickstart

### 3.1 Prerequisites

- Node.js **≥ 22.14**
- [pnpm](https://pnpm.io) via Corepack (`packageManager`: `pnpm@11.15.1`)
- Docker (optional, for Compose Postgres + Mailpit)
- Git with submodule support

### 3.2 Install

```bash
git clone --recurse-submodules https://github.com/Vinayak-RZ/experience-integration.git
cd experience-integration
# if clone skipped submodules:
git submodule update --init --recursive

corepack enable
pnpm install
cp .env.example .env
```

### 3.3 Run locally (fixture Auto)

**Option A — UI-only demo (no API):**

```bash
pnpm --filter @stamped/l6-web dev
# http://localhost:3000 — Jaipur Works fixtures render all screens
```

**Option B — full stack via Compose:**

```bash
docker compose -f infra/docker-compose.yml up
# web :3000 · api :3001 · postgres :5432 · mailpit UI :8025 · SMTP :1025
```

**Option C — API + web without Docker** (Postgres required):

```bash
# set DATABASE_URL in .env (local Postgres or Supabase — see [docs/SUPABASE_DEMO.md](docs/SUPABASE_DEMO.md))
pnpm --filter @stamped/l6-api db:migrate
pnpm --filter @stamped/l6-api dev   # :3001
pnpm --filter @stamped/l6-web dev   # :3000, NEXT_PUBLIC_BFF_URL=http://localhost:3001
```

### 3.4 Verify

```bash
pnpm validate                 # docs, contracts, typecheck, unit tests, build
pnpm smoke:bff                # health/ready/meta/openapi + unauth /v1 401
# with Postgres:
DATABASE_URL=postgres://stamped:stamped@127.0.0.1:5432/stamped_l6 pnpm compose:smoke
```

Contracts:

```bash
./external/scripts/contracts/contract-check.sh
pnpm contracts:upstream
```

---

## 4. Configuration

Copy [`.env.example`](.env.example) → `.env`. Never commit secrets.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_BFF_URL` | Web→API | `http://localhost:3001` | Browser BFF origin |
| `HOST` / `PORT` | API | `0.0.0.0` / `3001` | BFF listen |
| `DATABASE_URL` | API/worker | local Postgres or Supabase pooler | L6 Postgres only (never commit) |
| `DIRECT_URL` | API migrations / Prisma | Supabase session/direct URL | Prefer for drizzle migrate + Prisma CLI |
| `REQUIRE_DATABASE` | API | `false` | Fail boot if DB missing when true |
| `BETTER_AUTH_SECRET` | Auth | dev placeholder | Session signing |
| `BETTER_AUTH_URL` | Auth | `http://localhost:3001` | Auth base URL |
| `WEB_ORIGIN` | CORS | `http://localhost:3000` | Allowed web origin |
| `SMTP_*` / `MAILPIT_UI` | Invites | Mailpit locals | Fake email for Phase B |
| `L5_BASE_URL` / `L5_TIMEOUT_MS` | Upstream | `http://127.0.0.1:8080` / `5000` | L5 workflow HTTP (Vinayak live path) |
| `L5_LIVE` / `L6_L5_LIVE` | Upstream | `true` | Set either to `false` for fixture-only BFF |
| `L5_AUTH_TOKEN` | Upstream | (bootstrap key) | Sent as `X-API-Key` |
| `L5_FEATURE_ALARM_ACK` | Gate | `false` | Live ack vs fixture transition |
| `L5_FEATURE_ALARM_ESCALATE` | Gate | `false` | Live escalate |
| `L5_FEATURE_ALARM_UNSILENCE` | Gate | `false` | Live unsilence |
| `L4_BASE_URL` / `L4_TIMEOUT_MS` | Upstream | `…:8104` / `15000` | L4 analyst HTTP |
| `L4_LIVE` | Gate | `false` | Live ReAct vs fixture analyst |
| `L2_BASE_URL` / `L2_TIMEOUT_MS` | Upstream | `…:8102` / `5000` | L2 query HTTP |
| `L2_FEATURE_LEDGER` | Gate | `false` | Live ledger vs fixture CSV |
| `L2_FEATURE_BASELINES` | Gate | `false` | Live baselines |
| `L2_DATABASE_URL` | **Forbidden** | — | Must never be set in L6 |
| `ENTRA_*` | Optional | commented | Microsoft Entra identity |
| `POWERBI_*` | Optional | commented | Power BI pilot push |

See also [`packages/api/src/config.ts`](packages/api/src/config.ts).

---

## 5. Project structure

```text
experience-integration/
├── external/                 # stamped-external submodule (ADRs, handoffs, contracts)
├── packages/
│   ├── web/                  # @stamped/l6-web — Next.js 16 App Router (Forge)
│   ├── api/                  # @stamped/l6-api — Fastify BFF + /v1
│   ├── contracts/            # @stamped/l6-contracts — Zod + claim/workflow maps
│   └── worker/               # @stamped/l6-worker — pg-boss jobs
├── contracts/upstream/       # Pinned L2/L4/L5 OpenAPI snapshots
├── infra/
│   ├── docker-compose.yml    # postgres, api, worker, web, mailpit
│   └── …                     # AWS CDK Mumbai pilot (@stamped/l6-infra)
├── docs/                     # Digests, security, runbooks, Spec Kit, MCP
├── scripts/                  # validate, smoke, ci-local, contract checks
├── .cursor/                  # Coding skills/rules (ponytail, nawab-plans, …)
├── PROJECT_OVERVIEW.md
├── IMPLEMENTATION_PLAN.md
├── PROGRESS.md
├── DECISIONS.md
├── PRODUCT.md
├── DESIGN.md
└── AGENTS.md
```

### 5.1 Web routes

| Path | Screen |
|------|--------|
| `/` | Today decision strip |
| `/alarms`, `/alarms/[id]` | EMS console + detail |
| `/prescriptions`, `/prescriptions/[id]` | Rx queue + detail |
| `/evidence` | Scoped proof (`?alarmId` / `?rxId`) |
| `/analyst` | Mode B investigation workspace |
| `/energy` | Demand + top consumers |
| `/equipment` | Load dials + asset health |
| `/intensity` | TOD/MD/CMD + SEC / Scope 2 |
| `/reports` | Export Centre + savings ledger |
| `/settings/integrations` | API keys, webhooks, Entra, Power BI |
| `/settings/admin` | Members + audit |

---

## 6. Interfaces

### 6.1 Product BFF (`packages/api`) — ~33 routes

Grouped counts below. Source registration: [`packages/api/src/app.ts`](packages/api/src/app.ts).

#### Health / meta / telemetry (4)

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/health` | Public |
| `GET` | `/ready` | Public |
| `GET` | `/api/meta` | Public |
| `POST` | `/api/telemetry` | Session |

#### Auth & admin (5–8)

| Method | Path | Auth |
|--------|------|------|
| `GET`/`POST` | `/api/auth/*` | Better Auth |
| `GET` | `/api/me` | Session |
| `POST` | `/api/admin/invites` | Admin |
| `GET`/`POST`/`PATCH` | `/api/admin/orgs/:orgId/members…` | Admin |
| `GET` | `/api/dev/outbox` | Non-prod only |

#### Plants (3)

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/api/plants` | Session |
| `POST` | `/api/plants/active` | Session |
| `GET` | `/api/plants/authorized` | Session |

#### Ops / exports / reports / SSE (9)

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/api/alarms` | Session + plant |
| `POST` | `/api/alarms/:alarmId/actions` | Session + plant |
| `GET` | `/api/exports/prescriptions.csv` | Session |
| `GET` | `/api/exports/ledger.csv` | Session |
| `GET`/`POST` | `/api/reports` | Session |
| `POST` | `/api/reports/:id/approve` | Session |
| `GET` | `/api/reports/:id/artifact` | Session |
| `GET` | `/api/events/stream` | Session (SSE) |

#### Integrations (6)

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/api/integrations/api-keys` | Session |
| `GET`/`POST` | `/api/integrations/webhooks` | Session |
| `POST` | `/api/integrations/webhooks/:id/test` | Session |
| `POST` | `/api/integrations/webhooks/deliveries/:id/redrive` | Session |
| `GET` | `/api/integrations/entra` | Session |

#### Public `/v1` — API key Bearer `stk_…` (4)

| Method | Path | Scope |
|--------|------|-------|
| `GET` | `/v1/openapi.json` | OpenAPI 3.1 document |
| `GET` | `/v1/alarms` | `alarms:read` |
| `GET` | `/v1/events` | `events:read` |
| `GET` | `/v1/ledger` | `ledger:read` |

Unauthenticated `/v1/alarms` returns **401** (see smoke script).

> **Note:** There are no Fastify `/api/evidence*` or `/api/analyst*` routes. Evidence and analyst Mode A/B are composed in the web layer (fixture Auto + optional L4 client). Prescription list UI is fixture/BFF-composed; CSV export is the dedicated prescriptions HTTP surface.

### 6.2 Worker queues (`packages/worker`)

| Queue | Handler |
|-------|---------|
| `l6.fixture.ping` | Idempotent ping |
| `l6.reports.generate` | Accept by `reportJobId` (API owns artifacts) |
| `l6.webhooks.deliver` | Queue created; delivery worker path evolving |

### 6.3 Auth model

1. **Sessions** — Better Auth + Drizzle/pg (`packages/api/src/auth/`). Signup disabled; invite + email/password.
2. **Plant RBAC** — Membership roles ≠ Better Auth `user.role`. Matrix: `packages/api/src/authz/matrix.ts` (web mirror: `packages/web/src/lib/navigation.ts`).
3. **API keys** — `stk_<prefix>.<secret>`, hashed at rest, scoped reads for `/v1`.
4. **Entra** — Identity optional; L6 membership remains authorization truth.
5. **Analyst handoff** — UI `confirmActionGate` before any L5 write proposal is treated as sent.

---

## 7. Data model

L6 Postgres owns **integration state**, not upstream domain replicas.

Migrations: `packages/api/drizzle/` (`0000_foundation.sql` … `0007_enterprise.sql`).

| Area | Tables |
|------|--------|
| Tenancy | `organizations`, `plants`, `memberships`, `plant_memberships`, `user_preferences` |
| Auth | `user`, `session`, `account`, `verification`, `two_factor` |
| Ops glue | `audit_events`, `l5_event_cursors`, `l5_events`, `report_jobs` |
| Enterprise | `api_keys`, `webhook_endpoints`, `webhook_deliveries`, `powerbi_checkpoints`, `product_telemetry` |

Schema TS: [`packages/api/src/db/schema.ts`](packages/api/src/db/schema.ts).

Claim vocabulary and workflow→lane maps: [`packages/contracts`](packages/contracts).

---

## 8. Demo plant & Auto fixtures

### 8.1 Jaipur Works (UI SoT)

[`packages/web/src/fixtures/demo.ts`](packages/web/src/fixtures/demo.ts) is the single coherent demo plant (DEC-011):

- **Plant:** Jaipur Works · CMD 5,000 kVA · Rajasthan HT industrial TOD
- **Assets:** Kiln 1, Cement Mill 1, Raw Mill 2, Compressor 2, Packing, Admin HVAC, Main incomer
- **Ops:** 7 alarms, 10 prescriptions, 9 ledger rows, 7 Today signals (derived)
- **Enterprise UI:** members, API keys, webhooks, report jobs, audit events
- **Analyst:** 3 investigations with seed transcripts

Helpers (`demoCriticalAlarmCount`, `demoNeedsReviewInr`, `demoOpsConfirmedInr`, …) keep Today tiles and shell banners consistent.

### 8.2 BFF fixture Auto

When feature gates are `false` or upstream HTTP fails:

| Surface | Behavior |
|---------|----------|
| Alarm actions | Local fixture state transition |
| Ledger CSV / `/v1/ledger` | Fixture claim-safe rows |
| L4 analyst client | Fixture sessions/messages |
| Reports | Fixture sustainability HTML pending approval |

Live cutover flips gates independently without inventing telemetry.

---

## 9. Testing

| Layer | Command | Approx coverage |
|-------|---------|-----------------|
| Root gate | `pnpm validate` | Docs, no `L2_DATABASE_URL`, contracts, typecheck, unit, infra, build |
| Web unit | `pnpm --filter @stamped/l6-web test` | ~60 tests (`packages/web/tests/`) |
| API unit | `pnpm --filter @stamped/l6-api test` | ~62 tests (`packages/api/tests/`) |
| Integration | `pnpm test:integration` | API + worker + infra |
| BFF smoke | `pnpm smoke:bff` | health/ready/meta/openapi/401 |
| Playwright | `pnpm --filter @stamped/l6-web test:e2e` | `e2e/ops-journeys.spec.ts` (Today, alarms, Rx, evidence, reports, analyst) |
| CI local | `pnpm ci:local` | Mirrors quality job |

Playwright config: [`packages/web/playwright.config.ts`](packages/web/playwright.config.ts) (Chromium desktop + Pixel 5).

---

## 10. Deployment & CI

### 10.1 Local Compose

[`infra/docker-compose.yml`](infra/docker-compose.yml): `postgres` (:5432), `api` (:3001), `worker`, `web` (:3000), `mailpit` (:1025 / :8025).

### 10.2 AWS Mumbai pilot (definitions)

Package `@stamped/l6-infra` — CDK stack `StampedL6PilotMumbai` in **`ap-south-1`**:

- RDS Postgres 16, ECS Fargate API, ALB, S3 reports, Secrets Manager, CloudWatch  
- **Do not deploy** without human `cdk diff` approval (see [`docs/runbooks/pilot-ops.md`](docs/runbooks/pilot-ops.md))

### 10.3 GitHub Actions — workflow `ci`

[`.github/workflows/ci.yml`](.github/workflows/ci.yml)

| Job | Purpose |
|-----|---------|
| `quality` | Submodules, install, contracts, `SKIP_E2E=1 pnpm validate` |
| `postgres-integration` | Postgres 16 + `test:integration` + `smoke:bff` |
| `browser-e2e` | Web build + Playwright |
| `infra` | CDK unit tests |

Triggers: push `main` / `cursor/**`, all PRs.

---

## 11. Cookbook

### 11.1 Walk the Jaipur demo (UI)

1. Open `/` — Today shows ≤7 signals; MD headroom + ops-confirmed MTD.
2. `/alarms` — critical Kiln 1 / incomer; open `/alarms/alm_1001` → Evidence.
3. `/prescriptions` — sort by impact×confidence; open Rx → Evidence.
4. `/reports` — Export Centre: generate → approve → download HTML; ledger CSV keeps claim labels.
5. `/analyst` — pick “Kiln 1 MD coincidence”; send a follow-up; preview handoff → confirm (not sent upstream in fixture).
6. `/settings/integrations` & `/settings/admin` — keys, webhooks, members, audit.

### 11.2 Flip a live upstream gate

```bash
# .env
L5_FEATURE_ALARM_ACK=true
L5_BASE_URL=https://your-l5
# L5_AUTH_TOKEN=…
```

Restart API. Ack path uses live L5; other actions may still fixture until their gates flip.

### 11.3 Create a scoped API key (session)

```http
POST /api/integrations/api-keys
Cookie: <session>
Content-Type: application/json

{ "name": "Partner EMS", "scopes": ["alarms:read", "ledger:read"] }
```

Then:

```bash
curl -H "Authorization: Bearer stk_….…" "$BFF/v1/alarms"
```

### 11.4 Refresh coding config / Spec Kit

```bash
./scripts/sync-from-upstream.sh          # cursor-config-coding skills
# Spec Kit: see docs/SPEC_KIT.md
```

---

## 12. Roadmap & changelog

### 12.1 Build phases (completed)

| Phase | Theme | Status |
|-------|-------|--------|
| 0 | Authority / submodule | ✅ |
| A | Foundation (pnpm, migrations, builds) | ✅ |
| B | Auth / tenancy / invites | ✅ |
| C | Forge UX shell + a11y baseline | ✅ |
| D | Upstream adapters + resumable SSE | ✅ |
| E | Today / alarms / Rx / evidence / ledger / CSV | ✅ |
| F | Analytics + analyst Mode A/B | ✅ |
| G | Report jobs + Export Centre + sustainability HTML | ✅ |
| H | Public `/v1`, webhooks, Entra/PBI defs, CDK | ✅ |
| N | `validate.sh`, security review, Playwright, GHA | ✅ |
| Demo | Jaipur Works fixtures across all screens | ✅ |

### 12.2 Cutover (blocked)

- Register live Entra app + Power BI workspace  
- Replace CDK placeholder image with ECR  
- Human-approved `cdk diff` → Mumbai smoke  
- Optional: axe Playwright project, self-hosted fonts  

Tracked in [`PROGRESS.md`](PROGRESS.md).

### 12.3 Recent changelog

| Date | Change |
|------|--------|
| 2026-07-22 | Extensive README (this document) |
| 2026-07-22 | Jaipur Works demo fixtures wired to all Forge screens; DEC-011 |
| 2026-07-22 | CI smoke via `@stamped/l6-api` `tsx`; Playwright/CDK artifacts gitignored |
| 2026-07-22 | Phase H public `/v1` + webhooks + enterprise surfaces |
| 2026-07-22 | Phases E–G–N product + hardening docs |

---

## 13. FAQ & glossary

### FAQ

**Why do screens look “live” without L5?**  
Fixture Auto. Gates default `false` so demos and CI do not invent OT truth or block on siblings.

**Can I point L6 at the L2 database?**  
No. `L2_DATABASE_URL` is forbidden; `validate.sh` fails if product code references it as config.

**Is `ops_confirmed` the same as bill-verified?**  
No. Never. Bill-verified requires a future bill path and `billLineRefs`.

**Where is platform architecture defined?**  
`external/` submodule — not this README. Implementation choices that do not redefine platform semantics live in [`DECISIONS.md`](DECISIONS.md).

**Does public `/v1` replace the product BFF?**  
No. `/api/*` is the Forge BFF. `/v1` is a scoped read surface for partners.

### Glossary

| Term | Meaning |
|------|---------|
| **Forge** | Stamped Industrial design system (tokens + chrome) |
| **ops_confirmed** | Telemetry clearance claim — not DISCOM bill |
| **Fixture Auto** | Deterministic fallback when upstream gated/unavailable |
| **Mode A / Mode B** | Contextual sheet analyst vs full investigation workspace |
| **CMD / MD** | Contract demand / maximum demand (kVA) |
| **TOD** | Time-of-day tariff bands |
| **SEC** | Specific energy consumption (kWh/unit) |
| **pg-boss** | Postgres-backed job queue (Redis substitute) |
| **stk_** | Public API key prefix |

---

## 14. Authority & further reading

**Read in order**

1. [`external/technical/layers/L6-experience-and-integration.md`](external/technical/layers/L6-experience-and-integration.md)
2. [`external/handoff/stamped-l6-architecture-handoff.md`](external/handoff/stamped-l6-architecture-handoff.md)
3. [`external/handoff/stamped-l6-ui-ux-charter.md`](external/handoff/stamped-l6-ui-ux-charter.md)
4. [`external/handoff/stamped-l6-build-plan.md`](external/handoff/stamped-l6-build-plan.md)
5. [`AGENTS.md`](AGENTS.md) — agent coding workflow (ponytail → nawab-plans → Spec Kit)

**Repo docs**

| Doc | Purpose |
|-----|---------|
| [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md) | Purpose, constraints, experience direction |
| [`PRODUCT.md`](PRODUCT.md) | JTBD, roles, landings |
| [`DESIGN.md`](DESIGN.md) | Forge product design notes |
| [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) | Phase plan |
| [`PROGRESS.md`](PROGRESS.md) | Current status |
| [`DECISIONS.md`](DECISIONS.md) | Implementation ADRs |
| [`docs/L6_DIGEST.md`](docs/L6_DIGEST.md) | Condensed digest |
| [`docs/architecture/layer-interfaces.md`](docs/architecture/layer-interfaces.md) | Boundary snapshot |
| [`docs/SECURITY_REVIEW.md`](docs/SECURITY_REVIEW.md) | Security review |
| [`docs/runbooks/pilot-ops.md`](docs/runbooks/pilot-ops.md) | Mumbai pilot ops |
| [`docs/SPEC_KIT.md`](docs/SPEC_KIT.md) | Spec-Driven Development |
| [`docs/MCP_SETUP.md`](docs/MCP_SETUP.md) | Agent Patterns MCP |

**Upstream layers**

| Layer | Use from L6 |
|-------|-------------|
| L5 closure-verification | Alarms, workflow, SSE, ack/defer |
| L4 knowledge-reasoning | Analyst + prescription text |
| L2 universal-repositary | Ledger / timeseries reads (HTTP only) |

**Cursor coding config** — skills from [cursor-config-coding](https://github.com/Vinayak-RZ/cursor-config-coding); refresh with `./scripts/sync-from-upstream.sh`.

---

| Layer | Repo | L6 uses |
|-------|------|---------|
| L5 | closure-verification | Alarms, workflow, SSE, ack/defer |
| L4 | knowledge-reasoning | Analyst + prescription text |
| L2 | universal-repositary | Ledger / timeseries reads (HTTP only) |

## UI demo (fixture plant)

Local demo data lives in `packages/web` fixtures — Jaipur Works renders every Forge screen without Postgres or upstream siblings.

```bash
# UI-only (fastest)
pnpm --filter @stamped/l6-web exec next dev --hostname 0.0.0.0 --port 3000

# Production build (recommended for capture / Playwright)
pnpm --filter @stamped/l6-web build
pnpm --filter @stamped/l6-web exec next start --hostname 0.0.0.0 --port 3000

# Regenerate gallery + walkthrough (requires Chromium: pnpm --filter @stamped/l6-web exec playwright install chromium)
cd packages/web && node scripts/capture-ui-demo.mjs
```

Assets land in [`docs/demo/`](docs/demo/) (22 screens + 3 video formats).

### Walkthrough video

<video src="docs/demo/l6-ui-demo-fast.mp4" controls width="100%"></video>

| Format | File | Notes |
|--------|------|-------|
| Fast MP4 (embedded) | [`l6-ui-demo-fast.mp4`](docs/demo/l6-ui-demo-fast.mp4) | ~3 min — every route + core ops actions |
| Full-speed MP4 | [`l6-ui-demo.mp4`](docs/demo/l6-ui-demo.mp4) | Real-time navigation |
| WebM | [`l6-ui-demo.webm`](docs/demo/l6-ui-demo.webm) | Source recording from Playwright |

### Screens — every route (22)

| # | Screen | Route | Preview |
|---|--------|-------|---------|
| 1 | Today (Overview) | `/` | ![Today](docs/demo/01-today.png) |
| 2 | Live | `/live` | ![Live](docs/demo/02-live.png) |
| 3 | Alarms console | `/alarms` | ![Alarms](docs/demo/03-alarms.png) |
| 4 | Alarm detail | `/alarms/alm_1001` | ![Alarm detail](docs/demo/04-alarm-detail.png) |
| 5 | Prescriptions | `/prescriptions` | ![Prescriptions](docs/demo/05-prescriptions.png) |
| 6 | Prescription detail | `/prescriptions/rx_9001` | ![Prescription detail](docs/demo/06-prescription-detail.png) |
| 7 | Evidence index | `/evidence` | ![Evidence index](docs/demo/07-evidence-index.png) |
| 8 | Evidence detail | `/evidence/evd_4401` | ![Evidence](docs/demo/08-evidence.png) |
| 9 | Analyst (Mode B) | `/analyst` | ![Analyst](docs/demo/09-analyst.png) |
| 10 | Reports & ledger | `/reports` | ![Reports](docs/demo/10-reports.png) |
| 11 | Energy analytics | `/energy` | ![Energy](docs/demo/11-energy.png) |
| 12 | Machine health | `/equipment` | ![Equipment](docs/demo/12-equipment.png) |
| 13 | Plant map | `/plant-map` | ![Plant map](docs/demo/13-plant-map.png) |
| 14 | Sustainability / intensity | `/intensity` | ![Intensity](docs/demo/14-intensity.png) |
| 15 | Tools | `/tools` | ![Tools](docs/demo/15-tools.png) |
| 16 | Integrations | `/settings/integrations` | ![Integrations](docs/demo/16-integrations.png) |
| 17 | Admin & members | `/settings/admin` | ![Admin](docs/demo/17-admin.png) |
| 18 | Assignments | `/settings/assignments` | ![Assignments](docs/demo/18-assignments.png) |

### Screens — analyst overlay & ops actions (4)

| # | Screen | Preview |
|---|--------|---------|
| 19 | Analyst Mode A overlay (Ask Analyst on Today) | ![Mode A](docs/demo/19-analyst-mode-a.png) |
| 20 | Alarm acknowledge action | ![Ack](docs/demo/20-alarm-acked.png) |
| 21 | Prescription defer action | ![Defer](docs/demo/21-rx-deferred.png) |
| 22 | Export approve action | ![Approve](docs/demo/22-export-approved.png) |
