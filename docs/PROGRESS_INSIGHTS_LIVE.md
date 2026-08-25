# Progress — Insights & Reports Live Data

**Started:** 2026-08-26  
**Plant:** `plant_vinayak_1`  
**Plan:** `docs/IMPLEMENTATION_PLAN_INSIGHTS_LIVE.md`

## Phase 0 — Audit refresh

### Orphan boards still importing fixtures (runtime)

| Component | Fixture import | Status |
|-----------|----------------|--------|
| `EnergyBoard.tsx` | `@/fixtures/energy-analytics` | remount pending |
| `SustainabilityDashboard.tsx` | `@/fixtures/demo` | remount pending |
| `PlantSectionMap.tsx` | `@/fixtures/plant-sections` | extract lib + remount pending |
| `MachineHealthBoard.tsx` | `@/fixtures/machine-health` | remount pending |
| `PlantHealthMap.tsx` | `@/fixtures/overview-demo` | remount pending |
| `DialBank.tsx` | `@/fixtures/overview-demo` | purge pending |
| `DemandProfilePanel.tsx` | `@/fixtures/overview-demo` | purge pending |
| `AlertFeedPanel.tsx` | `@/fixtures/overview-demo` | purge pending |
| `PrescriptionsOverviewPanel.tsx` | `@/fixtures/demo` (needs-review fallback) | purge pending |
| `live-telemetry.ts` | `@/fixtures/overview-demo` | purge pending |
| `ExportCentre.tsx` | local stub (no `@/fixtures`) | wire BFF pending |

### Pages today (Vinayak)

| Route | UI state | Notes |
|-------|----------|-------|
| `/energy` | bills/tariff text + empty chart shells | EnergyBoard not mounted |
| `/plant-map` | raw department-graph JSON | PlantSectionMap not mounted |
| `/intensity` | raw SEC JSON | SustainabilityDashboard not mounted |
| `/equipment` | L2 assets + fixture CM trends in board | hybrid |
| `/reports` | overview KPIs only | ExportCentre not mounted |
| `/`, `/live` | partial L2; subpanels still fixture-backed | purge pending |

### Next

Phase A — `GET /api/insights/energy` board DTO + remount EnergyBoard.
