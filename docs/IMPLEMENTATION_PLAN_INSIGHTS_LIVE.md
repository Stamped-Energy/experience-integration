# Implementation Plan — Insights & Reports Live Data (Vinayak)

> Execution contract. Full nawab plan: `.cursor/plans/insights_live_data_plan_590307e3.plan.md`  
> **Mode:** feature · **Plant:** `plant_vinayak_1` · **Branch:** `cursor/insights-live-vinayak`

## Objective

Remount demo-quality insight visuals on real L2/L5 data. Zero fixture numbers on screen.

## Visual remount map

| Component | Route | Live source |
|-----------|-------|-------------|
| EnergyBoard | `/energy` | `GET /api/insights/energy` |
| PlantSectionMap | `/plant-map` | `GET /api/insights/plant-map` |
| SustainabilityDashboard | `/intensity` | `GET /api/insights/sustainability` |
| MachineHealthBoard + PlantHealthMap | `/equipment`, `/`, `/live` | `GET /api/insights/equipment` |
| ExportCentre + SavingsLedger | `/reports` | `/api/reports` + exports |

## Hard rules

- No `@/fixtures` imports on remounted boards or app routes
- Class D (vibration, source-mix, true geometry) → `EmptyUpstreamState`
- Plant map = auto-layout into existing PlantSectionMap schema
- Conventional commits per matrix row; lead commits only

## Phase order

0 Audit → A BFF DTOs → B Energy/Map/Sust remount → C Equipment/Overview → D Reports → E Seed smoke → F Hardening
