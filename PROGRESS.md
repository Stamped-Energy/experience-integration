# Stamped L6 — Progress

## Current phase

**Cutover — AWS Mumbai pilot** (blocked on human credentials / `cdk diff`)

Phases 0–H Auto + enterprise definitions are in place. `validate.sh`, Playwright,
and GitHub Actions cover quality / postgres / browser / infra jobs.

## Four-outcome prescription system (2026-09-28)

**Phase A complete — model and fixtures**

- Added optional live-compatible outcome and mixed-value fields.
- Classified all demo prescription, alarm, and evidence chains across the four
  Stamped outcomes while preserving existing IDs and historical records.
- Typecheck and 119 unit tests pass.
- Phase B is replacing Maintenance/Management filters and INR-first decision
  presentation across the linked experience.

## L6 Control Room Redesign (2026-09-27)

**Status: Complete**

The first approved redesign slice is implemented and verified:

- Overview now leads with seven decision signals, then next operating actions,
  owner/proof links, and separate value/evidence context.
- Overview, Alarms, Prescriptions, and Ask Analyst are the persistent operating
  anchors; deeper insights and administration remain reveal/role-gated.
- Analyst is a dedicated `/analyst` workspace with history, cited fixture/live
  paths, related actions, and a responsive composer.
- Contextual Analyst has removable context, keyboard containment, Escape close,
  and return focus to the topbar trigger.
- Shared Forge surfaces use tighter radii, flatter tonal layers, and reduced
  shadows without lowering accessibility or touch-target floors.

Validated with web typecheck, 114 unit tests, production build, and 38 desktop /
mobile Playwright tests. The next UI phase is human visual review followed by
supporting-screen polish; live BFF/Postgres validation remains part of pilot
cutover.

## Phase status

| Phase | Status | Exit gate |
|-------|--------|-----------|
| 0 — Authority | Complete | Approved artifacts |
| A — Foundation | Complete | Frozen install, migrations, builds |
| B — Auth / tenancy | Complete | Invite/login/plant-switch/RBAC |
| C — Forge UX | Complete | Shell + a11y baseline |
| D — Upstream / SSE | Complete | Adapters + resumable SSE |
| E — Ops product | Complete | Today/alarms/Rx/evidence/ledger/CSV |
| F — Analytics / analyst | Complete | Charts + confirm handoff |
| G — Reports | Complete | Jobs + HTML/BRSR + Export Centre |
| H — Enterprise | Complete* | Public `/v1`, webhooks, Entra/PBI defs, CDK |
| N — Hardening | Complete | validate + Playwright + security review |
| Cutover | Blocked | Credentials + human approval |

\* Live Entra/Power BI tenants and ECR image are cutover inputs, not code gaps.

## Immediate next work

1. Human: register Entra app + Power BI workspace; approve `cdk diff`.
2. Replace CDK placeholder image with ECR; run smoke on Mumbai.
3. Optional: axe Playwright project + self-hosted fonts.
4. Implement the L3 → L6 handoff in
   [`docs/L3_TO_L6_BUILD_GUIDE.md`](docs/L3_TO_L6_BUILD_GUIDE.md), starting
   with the intentional platform-pin and contract compatibility check.

## Admin + WhatsApp wiring (2026-08-26)

Branch `feat/admin-assignments-whatsapp`:

- Administration pages load members / assignments / integrations from BFF (no fixtures).
- Rx assign uses `notify_people` + `POST /api/assignments/notify`; WhatsApp log rows are dry_run/accepted/failed.
- **DEC-014:** L6 remains the pilot WhatsApp sender until an L5 relay exists (`docs/runbooks/whatsapp-connect.md`).

## Demo fixtures (2026-07-22)

Jaipur Works Auto demo is thorough across all Forge screens via
`packages/web/src/fixtures/demo.ts` (assets, alarms, Rx, ledger, members, API
keys, webhooks, report jobs, investigations, energy KPIs). Today tiles derive
from the same helpers so shell banners stay consistent.

## Ops IA polish (2026-07-24)

Accepted **DEC-013 Option B**: Prescriptions chrome rename, Alarm Signal
snapshot, Evidence parent chips, ForgeButton API adapted from shadcn patterns.
Follow-on: Evidence under Operations; compact Rx (action+why → full detail);
Evidence cards headed by issue with Alarm/Prescription links; CTAs are short
nouns (Evidence / Prescription / Alarm). Overview / Live untouched.

## Visual + IA redesign (2026-07-22)

Branch `cursor/l6-full-visual-redesign`: Overview composition, icon nav +
collapse, Tools hub, Assignments routing screen, expandable Rx/alarms with
inline evidence, Script-style Ask Analyst, 2D energy twin on Plant Map.
Gates: `pnpm --filter @stamped/l6-web typecheck` + `test` (65 passing).

## Documentation (2026-07-22)

Root [`README.md`](README.md) is the extensive onboarding / reference manual
(vision, architecture, config, route catalogs, demo plant, testing, CI, cookbook).
