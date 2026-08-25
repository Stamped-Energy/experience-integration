# Insights Live — Vinayak QA & smoke checklist

**Plant:** `plant_vinayak_1` · **Branch:** `cursor/insights-live-vinayak`  
**Last smoke:** 2026-08-26 (authenticated BFF session `demo@stamped.local`)

## Upstream probe

| Check | Result |
|-------|--------|
| `GET /api/meta/upstreams?plantId=plant_vinayak_1` | **PASS** — `l2=live`, `l5=live`, `l4=live`, `demoMode=false` |
| L2 assets (via BFF insights) | **PASS** — equipment board returned 5 assets |
| L5 prescriptions | **PASS** — 6 items |

## Insights API smoke (session required)

| Endpoint | HTTP | Notes |
|----------|------|-------|
| `/api/overview?plantId=…` | 200 | `l2`+`l5`; `energyTrend30d` length 6 |
| `/api/insights/energy` | 200 | `source=l2`, 7 KPIs |
| `/api/insights/plant-map` | 200 | `source=l2`, auto-layout levels |
| `/api/insights/sustainability` | 200 | `source=l2`, SEC 1.15 |
| `/api/insights/equipment` | 200 | `source=l2`, 5 energy-derived assets |
| `/api/prescriptions` | 200 | `source=l5`, 6 Rx |
| `/api/reports` | 200 | job list (may be empty) |

## UI visual checklist (manual)

Sign in → switch plant to **Vinayak Plant** → confirm `SourceIndicator` is never `fixture` / Preview.

| Route | Expect | Class D empty |
|-------|--------|---------------|
| `/energy` | EnergyBoard charts from bills/telemetry | Source-mix donut empty |
| `/plant-map` | PlantSectionMap auto-layout + live kW | No CAD x/y claim |
| `/intensity` | SustainabilityDashboard SEC/CO₂ | Renewable % empty |
| `/equipment` | Load dials + health register | Vibration / FFT / thermal empty |
| `/live` | Dials + demand from L2; no overview-demo | Alert feed may be thin (L5 overlay later) |
| `/` | Overview KPIs from `/api/overview` | — |
| `/reports` | ExportCentre jobs + SavingsLedger from Rx | Artifact metrics may be `not_measured_by_stamped` |

## Fixture ban

```bash
node packages/web/scripts/check-no-app-fixtures.mjs
# → ok — no banned fixture imports in insights remount files
```

Scans: `app/**` plus remounted boards (`analytics`, `equipment`, `reports`, `ledger`, `today/overview`, `live`) and live helper libs.

## Seed refresh (if smoke empties)

See [VINAYAK_SHOWCASE_SEED.md](./VINAYAK_SHOWCASE_SEED.md): L2 `vinayak-integration` persona + `scripts/seed_vinayak_l5_prescriptions.py` + `pnpm --filter @stamped/l6-api seed:vinayak`.
