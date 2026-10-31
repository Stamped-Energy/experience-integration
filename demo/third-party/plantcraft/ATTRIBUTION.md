# PlantCraft adaptation (Apache-2.0)

Stamped demonstration UI files derived from or inspired by [PlantCraft](https://github.com/PlantCraft/PlantCraft) (Apache-2.0) at commit `2aff6a933c12ebb5e26da15da12d6aecb1ea2506`:

| Stamped file | PlantCraft reference | Notes |
| --- | --- | --- |
| `demo/third-party/plantcraft/diagrams/riverbend-plant.json` | `deploy/demo/diagrams/riverbend-plant.json` | Full demo process diagram (Apache-2.0) |
| `demo/third-party/plantcraft/symbols-bundle.json` | `apps/view/src/dashcraft/diagrams/symbols/**/*.json` | Symbol library bundle (85 symbols) |
| `demo/src/components/scan/pfd/model.ts` | `apps/view/frontend/src/diagrams/model.ts` | Line routing, bindings, geometry |
| `demo/src/components/scan/pfd/DiagramCanvas.tsx` | `apps/view/frontend/src/diagrams/DiagramCanvas.tsx` | Canvas, nav connectors, liquid levels |
| `demo/src/components/scan/pfd/zoom.ts` | `apps/view/frontend/src/diagrams/zoom.ts` | Viewer zoom |
| `demo/src/components/scan/pfd/riverbendPlant.ts` | Diagram fixture + demo shows | Light-theme UI naming only |
| `demo/src/components/scan/forging-plant-viewer.tsx` | `apps/view/frontend/src/diagrams/DiagramPage.tsx` | Area tabs, time bar, replay, full screen |
| `demo/src/styles/pfd-diagram.css` | `apps/view/frontend/src/diagrams/diagrams.css` | Light `--surface` background only |
| `src/components/scan/health-map.tsx` | `apps/link/src/linkcraft/api/plant_widgets.py` | Health map widget pattern |
| `src/components/scan/narrative-trend.tsx` | View dashboard narrative trend cards | Self-explaining titles |
| `src/components/improve/loop-runs.tsx` | `apps/link/frontend/src/Compare.tsx` | Compare table layout (≤4 runs) |
| `src/components/view/gauge.tsx` | `apps/view/frontend/src/CardView.tsx` (`GaugeDial`) | Single-arc loop health gauge |
| `src/components/view/pv-sp-op-chart.tsx` | `apps/view/frontend/src/CardView.tsx` | PV/SP/OP trend grid |
| `src/components/view/report-reader.tsx` | `apps/view/frontend/src/ReportPage.tsx` | Horizontal section tabs + body |
| `src/app/process/analytics/page.tsx` | `apps/link/frontend/src/OverviewPage.tsx` | Results, alarms, health map, queue |

License: `demo/third-party/plantcraft/LICENSE` and `NOTICE`. No PlantCraft trademarks in UI copy.
