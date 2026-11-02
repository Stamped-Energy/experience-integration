# Process and Quality UI / UX / copy contract

Approved after source alignment (`docs/SOURCE_ALIGNMENT.md`).

## Visual

- Fonts: Geist body/UI; Geist Mono for ids, tags, timers; Space Grotesk only via `PageHeader brand`.
- Type sizes and spacing: CSS tokens only (`--type-*`, `--space-*`). Prefer utility classes over inline `fontSize` / `padding`.
- Layout: `Workspace` → `PageHeader` → hub tabs → `.grid`. Default `span-8` + `span-4.ctx`. Full-width only for plant diagrams and dense single tables.
- Coral only for decisions and abnormal state. Every colour has a word.
- Demo data: one visible marker. Prefer `<Illustrative />` (neutral tag) or a single `.pfd-demo-banner`, not both.

## Navigation

- Eyebrow on hub screens: `Process · {hub.sidebarLabel}` or `Quality · {hub.sidebarLabel}`.
- Detail screens: same hub eyebrow; entity name stays in the title.
- Always render `ProcessHubTabs` / `QualityHubTabs` (including detail routes).
- Breadcrumb area links: Process → `/process/proposals`; Quality → `/quality/actions` (hub defaults), until last-screen routing is wired into crumbs.

## Audience

- **Plant roles** (operator through viewer) see client hubs only.
- **Stamped engineer** also sees Engineering hubs (campaigns, loop runs, model upkeep, monitor tuning, cause tools).
- View as uses `SHOWCASE_ROLES` today (includes Stamped engineer). Client deploys later switch to `CLIENT_ROLES`.
- Engineering URLs stay reachable; other roles get a soft guard with “Switch to Stamped engineer”.
- Engineering never flashes in the nav before the role cookie is known (hidden by default).

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
- Empty / partial / illustrative states are honest.
- Card headers stay on one line (truncate long meta).

## Copy

- British/Indian spelling; no em dashes; no banned pitch words.
- Subheads: one short sentence (aim ≤110 characters) stating what the page is for or what to do next.
- Prefer “Demonstration data” / Illustrative tag over long caveats in the subtitle.
- Status vocabulary aligned with card states (Waiting, Needs a decision, Running, Closed).
- Lot ids via `lotNo()`; run labels via shared helpers.
- Client `src/app` routes: no ADR codes (D1xx), `get_*` names, SECOM, PlantCraft, or caller-supplied. Engineering folders are allowlisted in `scripts/check-copy.mjs`.
