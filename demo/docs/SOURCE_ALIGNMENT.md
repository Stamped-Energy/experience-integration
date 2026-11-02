# Source alignment: Process and Quality demo

Date: 2 Nov 2026. Gate for the Process and Quality UI/UX/copy consistency work.

## Sources compared

| Source | Role for this demo |
|---|---|
| `demo/FOUNDATION.md` | How to build the showcase: tokens, shell, components, routes, copy |
| `stamped-external/design/product-ui/PRODUCT_UI_SPEC.md` | Product IA, jobs, card/confidence, visual system (proposal status, mostly adopted) |
| `experience-integration/PRODUCT.md` | L6 energy ops product (alarms, prescriptions). **Not** the Process/Quality showcase authority |
| `experience-integration/DESIGN.md` | L6 Forge/Inter/Space Grotesk system. **Not** the showcase visual authority |

## Classification

| Rule | Status | Notes |
|---|---|---|
| Geist + Geist Mono; Space Grotesk only via `PageHeader brand` | current | Matches spec §12 and FOUNDATION §1; demo code follows |
| Tokens only in `tokens.css`; no gradients/glow; coral for decisions | current | Matches |
| Areas: Home, Inbox, Process, Quality, Plant, Ask, Settings, Activity; Planning soon; Maintenance hidden | current | Matches rail and README |
| Proof not an area; evidence on demand | current | Matches |
| Shared DecisionCard + Confidence | current | Matches |
| Illustrative tag on showcase figures | implemented differently | Spec requires visible Illustrative; `Illustrative()` returns null; some pages use warning tags or banners instead |
| FOUNDATION §6: Process/Quality/Plant/Ask/Settings/Activity as stubs | stale | All are built; hub IA (ADR-042) is live |
| Spec sitemap: Process Lines / Quality Lots as primary entry | implemented differently | Sidebar hubs (Actions, Dashboards, Plant, Reports, Analytics / Actions, Inspect, Analytics, Simulations, Setup) are the current product |
| Spec fonts vs L6 DESIGN.md (Inter / Space Grotesk / Plex Mono) | needs product decision (elsewhere) | For this demo, Geist wins per PRODUCT_UI_SPEC Revision 4 |
| L6 PRODUCT.md jobs (alarms, prescriptions, ledger) | stale for this surface | Different product; do not apply alarm/prescription vocabulary here |
| Page chrome: Workspace → PageHeader → content grid ± context column | current | Follow; fix screens that break it |
| Copy: no em dashes, British/Indian, no banned pitch words | current | Enforce; improve Process/Quality meta and labels |
| Hub tabs on every Process/Quality screen | missing / broken | Detail routes still mount no-op `ProcessTabs` / `QualityTabs` |

## Approved baseline for implementation

1. Visual and interaction authority for this demo: FOUNDATION + PRODUCT_UI_SPEC (§12), not L6 DESIGN.md.
2. Information architecture authority: current `src/lib/module/hubs.ts` + SideNav, not the older Lines/Lots-only sitemap.
3. Update FOUNDATION §6 to describe built areas and hub convention.
4. Make Illustrative/demo labeling visible and consistent.
5. Copy voice: operational, short subheads, consistent verbs (Accept, Adjust, Decline, Confirm, Sign), status words that match card states, British/Indian spelling, no em dashes.
6. Pause only if a change would rename product concepts still required by the data model (proposal, trial, lot link, proof rung, Verified/Indicative).

## Document updates in this pass

- `FOUNDATION.md` §6 routes: mark Process, Quality, Plant, Ask, Settings, Activity as built; note hub pages and evidence query convention.
- This file records the L6 PRODUCT/DESIGN mismatch so they are not used as Process/Quality constraints.
