# PlantCraft adaptation (Apache-2.0)

Stamped demonstration UI files derived from or inspired by [PlantCraft](https://github.com/PlantCraft/PlantCraft) (Apache-2.0) at commit `2aff6a933c12ebb5e26da15da12d6aecb1ea2506`:

| Stamped file | PlantCraft reference | Notes |
| --- | --- | --- |
| `src/components/scan/health-map.tsx` | `apps/link/src/linkcraft/api/plant_widgets.py` (health-map widget) | Area grid, worst list pattern |
| `src/components/scan/narrative-trend.tsx` | View dashboard narrative trend cards | Self-explaining titles |
| `src/components/improve/loop-runs.tsx` | `apps/link/frontend/src/Compare.tsx` | Compare table layout (≤4 runs) |
| `src/components/scan/pfd/DiagramCanvas.tsx`, `pfd/model.ts`, `pfd/zoom.ts` | `apps/view/frontend/src/diagrams/DiagramCanvas.tsx`, `model.ts`, `zoom.ts` | PFD canvas + viewer zoom |
| `src/components/scan/forging-plant-viewer.tsx` | `apps/view/frontend/src/diagrams/DiagramPage.tsx` | Area tabs, time bar, replay, full screen |
| `src/components/view/gauge.tsx` | `apps/view/frontend/src/CardView.tsx` (`GaugeDial`) | Loop health 0–100 gauges |
| `src/components/view/pv-sp-op-chart.tsx` | `apps/view/frontend/src/CardView.tsx` (time series cards) | PV/SP/OP trend grid |
| `src/components/view/report-reader.tsx` | `apps/view/frontend/src/ReportPage.tsx` | Sections sidebar, stat strips, inline trends |
| `src/app/process/analytics/page.tsx` | `apps/link/frontend/src/OverviewPage.tsx` board layout | Results, alarms, health map, queue |

Restyled to Stamped Forge tokens (light theme). No PlantCraft trademarks in UI.
