# Process and Quality UI / UX / copy contract

Approved after source alignment (`docs/SOURCE_ALIGNMENT.md`). Updated 3 Nov 2026 for the design-alignment and metal-works pass.

## Visual

- Fonts: Geist for body, UI and page titles. Geist Mono for ids, codes, readings and timers only. Space Grotesk only via `PageHeader brand` (owner Home) and the report cover (`.rep-cover h2`). Do not put Space Grotesk on every `.page-head h1`.
- Body default is 14px (`--type-small`) for the dense console. That is deliberate; compact density keeps 14px body. Do not "fix" it up to 16px without a product decision.
- Status tags (`.tag`): Geist sans, 12px / 16px line height, height 22px, sentence case. Not mono, not uppercase by default.
- Type sizes and spacing: CSS tokens only (`--type-*`, `--space-*`). Prefer utility classes over inline `fontSize` / `padding`. Never smaller than 11px (`--type-label`).
- Layout: `Workspace` → `PageHeader` → hub tabs → `.grid`. Default `span-8` + `span-4.ctx`. Full-width only for plant diagrams and dense single tables.
- Coral only for decisions and abnormal state. Every colour has a word.
- Shadows only on floating surfaces (menus, Ask panel, dialogs). No gradients, glow or pulsing.
- Hex values live only in `tokens.css`. Charts and module CSS read tokens; no hard-coded Tailwind hex.

## Demo data labelling

- No Illustrative tags and no "Demonstration data" banners on client-facing pages.
- The breadcrumb "Demonstration plant" is the only page-level marker.
- Owner Home still shows Verified and Indicative as separate figures and never adds them.
- Figures that are modelled say so with the existing evidence / confidence vocabulary (Measured, Estimated, Modelled), not a separate Illustrative stamp.

## Navigation

- Eyebrow on hub screens: `Process · {hub.sidebarLabel}` or `Quality · {hub.sidebarLabel}`.
- Detail screens: same hub eyebrow; entity name stays in the title.
- Always render `ProcessHubTabs` / `QualityHubTabs` (including action detail routes).
- Breadcrumb area links: Process → `/process/proposals`; Quality → `/quality/actions` (hub defaults), until last-screen routing is wired into crumbs.

## Demonstration plant (metal works)

Fictional auto-component metal works. No client names. No real client results.

| Id | Line | Kind |
|----|------|------|
| `line-a` | Forge line | Induction billet heater + screw press |
| `line-c` | Heat treatment | Hardening, quench, temper (loads / baskets) |
| `line-d` | Foundry | Induction melt + mould line (heats) |
| `line-e` | Machining cell | CNC (VMC / HMC) |
| `line-b` | Moulding | Kept small; one or two example cards |

Banned in `src/`: Faridabad proof figures used in customer decks (for example ₹340 / ₹440 per part, 2.8%→1.3% overheating scrap, 2.9% / 436 kg, 142 vs 120 heats, 11→2 billets, 30→10–23 billets/h, 840 parts / 14.2%, quench +8–20 °C, 10–12% energy), and incumbent product names (Melt Manager, Foundry AI, MPAS and similar). Do not put "Stamped recommends, the plant decides" on cards.

## Audience

- **Plant roles** (operator through viewer) see client hubs only.
- **Stamped engineer** also sees Engineering hubs (campaigns, loop runs, model upkeep, monitor tuning, cause tools).
- View as uses `SHOWCASE_ROLES` today (includes Stamped engineer). Client deploys later switch to `CLIENT_ROLES`.
- Engineering URLs stay reachable; other roles get a soft guard with “Switch to Stamped engineer”.
- Engineering never flashes in the nav before the role cookie is known (hidden by default).
- Pitch preset hides OEE, SMED and Engineering; cycle time and tool life stay for the machining line.

## Agent at work

- One page per area: `/process/agent`, `/quality/agent`.
- Caps: Working on now ≤3, Waiting on you ≤3, Tried on the model ≤3, Learned this week ≤4.
- Authority line: “Stamped works inside limits set beforehand. Nothing is written until a named role accepts.”
- Keep off: campaign lists, seeds, loop chips, modules, SECOM, OEE/Cpk/value figures, full action boards.

## Numbers need verdicts

- Every plant-facing figure carries a word status vs a named target (for example Cpk vs 1.33 / 1.67, OEE parts vs 85%, %GRR bands, supplier PPM).
- Control chart and capability live together on **Control and capability** (`/quality/spc`).

## UX

- One primary job per page; next decision or evidence path visible without scrolling past noise.
- Actions use operational verbs: Accept, Adjust, Decline, Confirm, Sign, Stop.
- Disabled actions name who can act.
- Empty / partial / modelled states are honest.
- Card headers stay on one line (truncate long meta).

## Copy

- British/Indian spelling; no em dashes; no banned pitch words.
- Subheads: one short sentence (aim ≤110 characters) stating what the page is for or what to do next.
- Prefer short factual subheads. Do not stamp Illustrative tags or “Demonstration data” banners on client-facing pages.
- Status vocabulary aligned with card states (Waiting, Needs a decision, Running, Closed).
- Lot ids via `lotNo()`; run labels via shared helpers.
- Client `src/app` routes: no ADR codes (D1xx), `get_*` names, SECOM, PlantCraft, or caller-supplied. Engineering folders are allowlisted in `scripts/check-copy.mjs`.
