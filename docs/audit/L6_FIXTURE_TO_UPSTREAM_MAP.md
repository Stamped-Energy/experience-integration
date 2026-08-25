# L6 Fixture → Upstream Map (LNM Factory 1)

Checklist for de-fixturing L6. Every UI tile maps to an upstream, a class, and a status.

**Plant under test:** `plant_lnm_faridabad_1` / org `org_acme` (historical)  
**Showcase plant (Insights remount):** `plant_vinayak_1` — see [Vinayak insights remount](#vinayak-insights-remount-2026-08-26)  
**Policy for Class D:** honest empty state (“No upstream data”), never invent numbers.  
**Last updated:** 2026-08-26

## Classes

| Class | Meaning |
|-------|---------|
| A | Already live-capable; remove fixture baseline |
| B | Data exists in L2/L5; add BFF route + wire page |
| C | Needs new upstream work (seed, endpoint, or pipeline) |
| D | No source anywhere → empty state |

## Status legend

| Status | Meaning |
|--------|---------|
| `todo` | Not started |
| `in_progress` | Being wired |
| `live` | Backed by L2/L5 when upstreams are up |
| `empty` | Honest empty state shipped |
| `blocked` | Waiting on Class C upstream |

---

## Route → tile matrix

| Route | Tile / dataset | Upstream | Class | Status |
|-------|----------------|----------|-------|--------|
| `/` | Confirmed savings (MTD) | L5 Rx `ledger_summary` sum → `/api/overview` | B | todo |
| `/` | Closure rate (30d) | L5 Rx statuses → `/api/overview` | B | todo |
| `/` | Critical alarms count | L5 `GET .../alarms` | A | todo |
| `/` | Needs review ₹ / count | L5 Rx list (lane/status) | B | todo |
| `/` | MD headroom % | L2 tariff `cmd_kva` + max `apparent_power_kva` | B | todo |
| `/` | Vs baseline (7d) | L2 baselines + measurements | B | todo |
| `/` | Telemetry freshness | L2 measurements max(ts) | B | todo |
| `/` | Stamped Savings This Month | L5 ledger summaries | B | todo |
| `/` | Total Energy Consumed | L2 measurements / bills | B | todo |
| `/` | Stamped AI Score | L3 `plant_intelligence_score` (no HTTP yet) | D→C | empty until P3d |
| `/` | CO₂ Equivalent (plant) | No grid emission factor | D | empty |
| `/` | KPI hero strip / 30d trend / dials / wasters / donut / demand / plant health map / alert feed | Mostly `overview-demo` fixtures | B/D | todo |
| `/live` | Assets + dials + plant MW | L2 assets + measurements | A | todo |
| `/live` | Jitter baseline (`live-telemetry`) | Remove | A | todo |
| `/equipment` | Asset list / CNC metrics | L2 assets + CNC measurements | A | todo |
| `/equipment` | Vibration / FFT / thermal | No L1 sensing | D | empty |
| `/equipment` | Health score / OEE | No computed index | D | empty |
| `/energy` | Monthly cost / comparison | L2 bills + tariff | B | todo |
| `/energy` | Source mix (renewable) | No generation table | D | empty |
| `/energy` | PF / SEC / heatmap / feeders | L2 measurements (+ SEC features) | B | todo |
| `/intensity` | SEC trend | L2 `/v1/features/sec` | B | todo |
| `/intensity` | Emissions plant rollup | No emission factor | D | empty |
| `/plant-map` | Hierarchy | L2 department-graph / assets | B | todo |
| `/plant-map` | x/y geometry + flow edges | No geometry in L2 | D | empty |
| `/alarms` | Alarm list | L5 list (strict live) | A | todo |
| `/alarms/[id]` | Alarm case + evidence | L5 alarm + Rx detail + evidence | B | todo |
| `/alarms` actions | ack / escalate / unsilence | L5 HTTP missing → add in P3 | C | blocked |
| `/alarms` actions | silence | L5 `POST .../silence` | A | todo |
| `/prescriptions` | Queue | L5 list (strict live) | A | todo |
| `/prescriptions/[id]` | Full case | L5 Rx detail | B | todo |
| `/prescriptions/[id]` | Negotiation | L5 thread accept/reject (BFF is fixture today) | C | blocked |
| `/evidence` | Index | L5 evidence bundle refs from Rx | B | todo |
| `/evidence/[id]` | Detail / charts | L5 ZIP + L2 evidence window | B | todo |
| `/evidence` | Curated dial/chart specs | No upstream | D | empty |
| `/analyst` | Chat | L4 sessions/stream | A | todo |
| `/reports` | Report jobs | L6 Postgres `report_jobs` | A | todo |
| `/reports` | Artifact HTML | Fixture sustainability HTML | D | empty |
| `/reports` | Savings ledger table | L5 per-Rx ledger / new plant ledger | B/C | todo |
| `/tools` | Nav hub only | — | — | n/a |
| `/settings/assignments` | People + routes | No read API | D | empty |
| `/settings/integrations` | API keys / webhooks | L6 Postgres (real) | A | todo |
| `/settings/admin` | Members | L6 Postgres | A | todo |
| `/settings/admin` | Audit events | Postgres write exists; add read route | B | todo |
| Shell | Plant catalog | L6 `/api/plants` (not `demo.ts`) | A | todo |
| Shell | Demo / live banner | `/api/meta/upstreams` | A | todo |

---

## BFF routes to add / change

| BFF route | Upstream | Class | Status |
|-----------|----------|-------|--------|
| `GET /api/meta/upstreams` | L2/L5/L4 head checks | A | todo |
| `GET /api/alarms` | L5; **no fixture fallback** when `L6_STRICT_LIVE` | A | todo |
| `GET /api/prescriptions` | L5; strict live | A | todo |
| `GET /api/prescriptions/:id` | L5 Rx detail | B | todo |
| `GET /api/prescriptions/:id/evidence` | L5 evidence meta | B | todo |
| `GET /api/evidence/:bundleId/download` | L5 download proxy | B | todo |
| `GET /api/l2/bills` | L2 bills | B | todo |
| `GET /api/l2/tariff` | L2 tariffs/active | B | todo |
| `GET /api/l2/baselines` | L2 plant baselines | B | todo |
| `GET /api/l2/sec` | L2 features/sec | B | todo |
| `GET /api/l2/department-graph` | L2 department-graph | B | todo |
| `GET /api/l2/production-orders` | L2 production-orders | B | todo |
| `GET /api/l2/evidence-window` | L2 evidence/window | B | todo |
| `GET /api/overview` | Derived KPIs from L2+L5 | B | todo |
| `GET /api/events` | Mirrored `l5_events` | B | todo |
| `GET /api/admin/audit-events` | L6 audit table | B | todo |
| Negotiation proxies | Real L5 threads | C | todo |
| Public `/v1/alarms`, `/v1/ledger` | Stop hardcoded fixtures | C | todo |

---

## Upstream gaps (Class C) for LNM

| Gap | Where | Status |
|-----|-------|--------|
| No L5 Rx/alarms/evidence for LNM | L3→L4→L5 pipeline never run for `plant_lnm_faridabad_1` | todo |
| LNM L2 seed thin (no bills/SEC/dept graph/POs) | `universal-repositary` seed persona | todo |
| L5 no HTTP for ack/escalate/unsilence | `closure-verification` API | todo |
| L5 no plant-level ledger list | L5 API | todo |
| L5 event poll hardcoded to Vinayak | `packages/api/src/index.ts` | todo |
| AI score not persisted | L3 lab export only | optional |

---

## Phase checklist

- [x] P1 Tell the truth (probe, strict live, banner, SourceIndicator)
- [x] P2 Wire Class B BFF + rewire pages
- [x] P3 Close Class C (seed, pipeline script, L5 API, optional score)
- [x] P4 Delete dead fixtures + lint/CI ban on app-route fixture imports

**Ops notes**
- Seed LNM L5 Rx: `python experience-integration/scripts/seed_lnm_l5_prescriptions.py`
- Re-seed L2 LNM (bills/SEC/score): `python -m seed --persona lnm-factory-1`
- Env: `L6_STRICT_LIVE=true` (default), `USE_FIXTURES=false`, live L2/L5 keys as before

---

## Vinayak insights remount (2026-08-26)

Follow-on to P1–P4: BFF Class-B routes exist, but insight pages still show raw JSON / empty shells while demo boards remain orphaned and fixture-coupled.

| Route | Demo visual to remount | Upstream | Class | Status |
|-------|------------------------|----------|-------|--------|
| `/energy` | `EnergyBoard` (Forge ECharts) | bills + tariff + measurements + SEC → `/api/insights/energy` | B | live |
| `/plant-map` | `PlantSectionMap` (SVG graph) | department-graph + assets + power → `/api/insights/plant-map` | B | live |
| `/intensity` | `SustainabilityDashboard` | SEC + derived CO₂ → `/api/insights/sustainability` | B | live |
| `/equipment` | `MachineHealthBoard` | assets + energy series → `/api/insights/equipment` | B | live |
| `/` `/live` | `PlantHealthMap`, dials, demand, alerts | overview + L2 + L5; **purge overview-demo** | A/B | todo |
| `/reports` | `ExportCentre`, `SavingsLedger` | `/api/reports` + ledger exports | A/B | todo |
| `/energy` | Source mix donut | No generation table | D | empty |
| `/equipment` | Vibration / FFT / thermal | No L1 CM sensing on Vinayak | D | empty |
| `/plant-map` | True CAD x/y | No geometry in L2 | D | empty (auto-layout instead) |

**Orphan fixture imports (must clear on remount):** see `docs/PROGRESS_INSIGHTS_LIVE.md` Phase 0 inventory.

**Plan:** `docs/IMPLEMENTATION_PLAN_INSIGHTS_LIVE.md`