# Source alignment: Process and Quality demo

Date: 3 Nov 2026. Gate for the design-alignment and metal-works pass.

## Sources compared

| Source | Role for this demo |
|---|---|
| `demo/FOUNDATION.md` | How to build the showcase: tokens, shell, components, routes, copy |
| `demo/docs/UI_CONTRACT.md` | Visual, demo-label, plant-story and audience rules for this pass |
| `stamped-external/design/product-ui/PRODUCT_UI_SPEC.md` | Product IA, jobs, card/confidence, visual system (proposal status, mostly adopted) |
| `stamped-external/design/operational-ui-design.md` | Operations UI v1.0: tags, min type size, shadow discipline |
| `experience-integration/PRODUCT.md` | L6 energy ops product (alarms, prescriptions). **Not** the Process/Quality showcase authority |
| `experience-integration/DESIGN.md` | L6 Forge/Inter/Space Grotesk system. **Not** the showcase visual authority |

## Classification

| Rule | Status | Notes |
|---|---|---|
| Geist for UI and titles; Geist Mono for ids, codes, readings, timers; Space Grotesk only via `PageHeader brand` and report cover | current (contract) | Code still applies `--font-display` to every `.page-head h1`; fix in the fonts commit |
| Status tags: Geist sans, 12px, 22px, sentence case | current (contract) | Code still uses mono uppercase 11px / 20px; fix in the tags commit |
| Body default 14px (`--type-small`) | current | Deliberate dense-console exception; documented in UI_CONTRACT |
| Tokens only in `tokens.css`; no gradients/glow; coral for decisions | current | Matches; hex fallbacks and chart hard-codes still to clear |
| Areas: Home, Inbox, Process, Quality, Plant, Ask, Settings, Activity; Planning soon; Maintenance hidden | current | Matches rail and README |
| Proof not an area; evidence on demand | current | Matches |
| Shared DecisionCard + Confidence | current | Matches |
| Demo-data labels: crumb only; no Illustrative tags on pages | current (contract) | `<Illustrative />` is a no-op and will be removed; README/FOUNDATION updated |
| FOUNDATION §6: Process/Quality/Plant/Ask/Settings/Activity as stubs | fixed | All are built; hub IA is live |
| Spec sitemap: Process Lines / Quality Lots as primary entry | implemented differently | Sidebar hubs in `hubs.ts` are the current product |
| Spec fonts vs L6 DESIGN.md (Inter / Space Grotesk / Plex Mono) | decided | For this demo, Geist wins per PRODUCT_UI_SPEC Revision 4 |
| L6 PRODUCT.md jobs (alarms, prescriptions, ledger) | stale for this surface | Different product; do not apply alarm/prescription vocabulary here |
| Page chrome: Workspace → PageHeader → hub tabs → content grid ± context column | current | Action detail still missing hub tabs; fix in the hub-tabs commit |
| Copy: no em dashes, British/Indian, no banned pitch words | current | Enforce |
| Hub tabs on every Process/Quality screen | open | Lot/investigation detail use hub tabs via wrappers; action detail does not yet |
| Demonstration plant = metal works (forge, HT, foundry, machining, small moulding) | current (contract) | Dataset still mixing/moulding until the plant-model commits |
| No Faridabad proof figures or incumbent product names in `src/` | current (contract) | Enforced by test in the actions commit |

## Approved baseline for implementation

1. Visual and interaction authority for this demo: FOUNDATION + UI_CONTRACT + PRODUCT_UI_SPEC (§12) + operational-ui-design.md, not L6 DESIGN.md.
2. Information architecture authority: current `src/lib/module/hubs.ts` + SideNav, not the older Lines/Lots-only sitemap.
3. Demo labelling: breadcrumb only. No Illustrative component on pages.
4. Plant story: fictional metal works matching the customer-deck spine; modelled figures only; banned deck numbers listed in UI_CONTRACT.
5. Copy voice: operational, short subheads, consistent verbs (Accept, Adjust, Decline, Confirm, Sign), status words that match card states, British/Indian spelling, no em dashes.
6. Pause only if a change would rename product concepts still required by the data model (proposal, trial, lot link, proof rung, Verified/Indicative).

## Nov 2026 audience decision

Plant roles see client hubs (Actions / Lines / Performance / Reports / Setup and Actions / Lots / Analytics / Setup). Campaign and loop consoles live under Engineering, gated to `stamped-engineer`, with a soft guard for other roles. Agent at work is the plant-facing proof of continuous work. Authority: `docs/UI_CONTRACT.md` Audience + Agent at work sections; hub definitions in `src/lib/module/hubs.ts`.
