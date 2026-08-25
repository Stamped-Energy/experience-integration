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
| `DialBank.tsx` | `@/fixtures/overview-demo` | purged |
| `DemandProfilePanel.tsx` | `@/fixtures/overview-demo` | purged |
| `AlertFeedPanel.tsx` | `@/fixtures/overview-demo` | purged |
| `PrescriptionsOverviewPanel.tsx` | `@/fixtures/demo` (needs-review fallback) | purged |
| `live-telemetry.ts` | `@/fixtures/overview-demo` | purged (empty baseline) |
| `ExportCentre.tsx` | local stub (no `@/fixtures`) | remounted on `/api/reports` |

### Pages today (Vinayak)

| Route | UI state | Notes |
|-------|----------|-------|
| `/energy` | EnergyBoard live | done |
| `/plant-map` | PlantSectionMap live | done |
| `/intensity` | SustainabilityDashboard live | done |
| `/equipment` | MachineHealthBoard + PlantHealthMap live | energy-derived; CM empty |
| `/reports` | ExportCentre + SavingsLedger live | L5 Rx → ledger; report jobs Postgres |
| `/`, `/live` | L2 overlay; no overview-demo defaults | done |

### Next

Vinayak seed smoke · Hardening (fixture ban + QA).

### Done this session

- [x] Phase 0 audit docs
- [x] `GET /api/insights/energy` + EnergyBoard props remount on `/energy`
- [x] Plant-map + sustainability remounts
- [x] `GET /api/insights/equipment` + MachineHealthBoard / PlantHealthMap remount
- [x] Overview/Live overview-demo purge
- [x] Reports ExportCentre + SavingsLedger remount
