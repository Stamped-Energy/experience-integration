# Progress — Insights & Reports Live Data

**Started:** 2026-08-26  
**Plant:** `plant_vinayak_1`  
**Plan:** `docs/IMPLEMENTATION_PLAN_INSIGHTS_LIVE.md`

## Phase 0 — Audit refresh

### Orphan boards still importing fixtures (runtime)

| Component | Fixture import | Status |
|-----------|----------------|--------|
| `EnergyBoard.tsx` | `@/fixtures/energy-analytics` | remounted |
| `SustainabilityDashboard.tsx` | `@/fixtures/demo` | remounted |
| `PlantSectionMap.tsx` | `@/fixtures/plant-sections` | remounted |
| `MachineHealthBoard.tsx` | `@/fixtures/machine-health` | remounted |
| `PlantHealthMap.tsx` | `@/fixtures/overview-demo` | remounted (props-only) |
| `DialBank.tsx` | `@/fixtures/overview-demo` | purge pending |
| `DemandProfilePanel.tsx` | `@/fixtures/overview-demo` | purge pending |
| `AlertFeedPanel.tsx` | `@/fixtures/overview-demo` | purge pending |
| `PrescriptionsOverviewPanel.tsx` | `@/fixtures/demo` (needs-review fallback) | purge pending |
| `live-telemetry.ts` | `@/fixtures/overview-demo` | purge pending |
| `ExportCentre.tsx` | local stub (no `@/fixtures`) | wire BFF pending |

### Pages today (Vinayak)

| Route | UI state | Notes |
|-------|----------|-------|
| `/energy` | EnergyBoard live | done |
| `/plant-map` | PlantSectionMap live | done |
| `/intensity` | SustainabilityDashboard live | done |
| `/equipment` | MachineHealthBoard + PlantHealthMap live | energy-derived; CM empty |
| `/reports` | overview KPIs only | ExportCentre not mounted |
| `/`, `/live` | partial L2; subpanels still fixture-backed | purge pending |

### Next

Overview/Live fixture purge · Reports · Vinayak smoke · Hardening.

### Done this session

- [x] Phase 0 audit docs
- [x] `GET /api/insights/energy` + EnergyBoard props remount on `/energy`
- [x] Plant-map + sustainability remounts
- [x] `GET /api/insights/equipment` + MachineHealthBoard / PlantHealthMap remount
