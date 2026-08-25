# Progress — Insights & Reports Live Data

**Started:** 2026-08-26  
**Plant:** `plant_vinayak_1`  
**Plan:** `docs/IMPLEMENTATION_PLAN_INSIGHTS_LIVE.md`  
**QA:** `docs/QA_INSIGHTS_LIVE_VINAYAK.md`

## Phase 0 — Audit refresh

### Orphan boards / remount status

| Component | Fixture import | Status |
|-----------|----------------|--------|
| `EnergyBoard.tsx` | `@/fixtures/energy-analytics` | remounted |
| `SustainabilityDashboard.tsx` | `@/fixtures/demo` | remounted |
| `PlantSectionMap.tsx` | `@/fixtures/plant-sections` | remounted |
| `MachineHealthBoard.tsx` | `@/fixtures/machine-health` | remounted |
| `PlantHealthMap.tsx` | `@/fixtures/overview-demo` | remounted |
| `DialBank.tsx` / `DemandProfilePanel` / `AlertFeedPanel` | overview-demo | purged |
| `PrescriptionsOverviewPanel.tsx` | demo needs-review | purged |
| `live-telemetry.ts` | overview-demo | purged |
| `ExportCentre.tsx` / `SavingsLedger.tsx` | stub / evidence fixture | remounted |

### Pages today (Vinayak)

| Route | UI state | Notes |
|-------|----------|-------|
| `/energy` | EnergyBoard live | smoke 200 |
| `/plant-map` | PlantSectionMap live | smoke 200 |
| `/intensity` | SustainabilityDashboard live | smoke SEC 1.15 |
| `/equipment` | MachineHealthBoard + PlantHealthMap | 5 assets |
| `/reports` | ExportCentre + SavingsLedger | L5 Rx ledger |
| `/`, `/live` | L2 overlay | no overview-demo defaults |

### Next

Optional PR polish / merge. Plan phases E–F complete for Vinayak insights remount.

### Done this session

- [x] Phase 0–D remounts (energy → reports)
- [x] Overview/Live fixture purge
- [x] Vinayak authenticated BFF smoke (all insights routes 200, L2+L5 live)
- [x] Extended fixture ban to remount surfaces + QA checklist doc
