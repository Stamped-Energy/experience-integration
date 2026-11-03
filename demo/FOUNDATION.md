# Product UI foundation

How to build on the Stamped product UI in `demo/` (deployed as showcase.stamped.work). Spec: stamped-external `design/product-ui/PRODUCT_UI_SPEC.md`. Visual basis: the technical site design system (`site/DESIGN.md`, `site/src/styles/tokens.css`, `design/operational-ui-design.md`).

Stack: Next.js 16 App Router, React 19, TypeScript, plain CSS on design tokens. No Tailwind, no shadcn (decided: matches the repo and the technical site). Pages are server components; only interactive pieces are client components.

Checks: `pnpm lint` (types plus the copy-rule check), `pnpm test` (dataset cross-links, RBAC, copy), `pnpm build`.

## 1. Tokens and theme
- `src/styles/tokens.css`: the only place hex values live. Copied from the technical site, plus type sizes (`--type-display` 28/36, `--type-title` 20/28, `--type-heading` 16/24, `--type-body` 16/26, `--type-small` 14/22, `--type-meta` 12, `--type-label` 11), `--ask-w`, `--bottom-bar-h`.
- Themes: light default. `html[data-theme="dark"]` for control rooms. `html[data-density="compact"]` (rows 32, section pad 16, body 14). Both toggled from the rail and saved in localStorage (`DISPLAY_SCRIPT` applies them before paint).
- Fonts (`src/app/layout.tsx`, next/font): Geist `--font-geist` for body, UI and page titles; Geist Mono `--font-geist-mono` for ids, codes, readings and timers; Space Grotesk `--font-brand` only via `PageHeader brand` (owner Home) and the report cover. Do not put Space Grotesk on every `.page-head h1`.
- Body default is 14px (`--type-small`) for the dense console. Deliberate; see `docs/UI_CONTRACT.md`.
- Status tags: Geist sans, 12px / 16px, height 22px, sentence case (operations `ops-tag`). Not mono, not uppercase by default. Never smaller than 11px anywhere.
- Spacing only `--space-1..8` (4 8 12 16 24 32 48 64). Radius 4 controls, 6 sections. 1px borders; 2px only for focus and active indicators. Shadows only on floating things (menus, Ask panel, dialogs). No gradients, glow or pulsing. Coral at full strength only where a decision lives.
- `src/styles/app.css`: all component classes. Add area CSS in new files under `src/styles/` and import them in `layout.tsx`; reuse tokens, never hex.

## 2. Shell (`src/components/shell/`)
| Component | File | Props | Notes |
|---|---|---|---|
| `AppShell` | Shell.tsx | `children` | Rendered by layout. Rail, bottom bar, Ask panel. |
| `Workspace` | Shell.tsx | `crumbs: Crumb[]`, `askContext?: string`, `children` | Every page renders inside one. 44px breadcrumb bar (Plant / Area / Line / Asset), search, role switcher, lease tag, Ask button. |
| `Rail` | ShellClient.tsx | `inboxCount` | 56px. Order from `src/lib/nav.ts` `NAV`; same for all roles. Planning marked soon. Maintenance absent. |
| `BottomBar` | ShellClient.tsx | none | Under 768px; items with `mobile: true`. |
| `RoleSwitcher` | ShellClient.tsx | `role`, `roles` | Sets the `stamped-role` cookie and refreshes. |
| `AskProvider`, `useAsk()`, `AskButton` | ShellClient.tsx | `AskButton { context?, label?, className?, mascot? }` | Opens the Ask side panel from any screen with the object on screen as context. The bar button passes `mascot`. |
| `Icon.*`, `StampedMark` | icons.tsx | SVG props | One line-icon family. Add icons here. |

`Crumb = { label: string; href?: string }`. Middle crumbs hide on mobile.

## 3. Shared components
| Component | File | Props |
|---|---|---|
| `DecisionCard` | components/cards/DecisionCard.tsx | `p: Proposal`, `role: RoleId`, `href?`, `variant?: "full" \| "operator" \| "compact"` |
| `CardActions` (client) | components/cards/CardActions.tsx | `actions: ActionSpec[]`, `stop?: StopSpec`, `large?` . `ActionSpec { id, label, primary?, allowed, reason?, done }`, `StopSpec { effect, allowed, reason? }` |
| `deniedReason(action, verb)` | DecisionCard.tsx | returns "Operator, Shift lead … or Plant head can decide" |
| `Confidence` | components/ui/Confidence.tsx | union `ConfidenceProps`: `prediction` (label, measure, unit, low, point, high, spec?, drivers, fit, safety?, method, evidenceIds?), `link` (label verified/estimated/unverified, score 0 to 1, threshold, status, drivers, method), `verdict` (label, verdict, rung, effect, interval, diagnostics, method, withheldNeeds?), `label` (label, note, method, evidenceIds?) |
| `LimitsBand` | components/ui/LimitsBand.tsx | `name, unit, signed: [lo, hi], narrowed?, current, proposed?, signedBy, signedAt, large?` |
| `StateStrip` | components/ui/StateStrip.tsx | `state: CardState` (spec §7.3 path; terminal states end the strip) |
| `Tag`, `ModeTag`, `LineModeTag`, `EvidenceTag`, `VerdictTag` | components/ui/primitives.tsx | `Tag { tone?: neutral/info/warning/critical/success/accent, dot?, title? }`; others take the typed value. No Illustrative tag on pages; the crumb is the demo marker. |
| `PageHeader` | primitives.tsx | `eyebrow?, title, meta?, actions?, brand?` |
| `Tabs` | primitives.tsx | `items: { href, label, count?, active? }[]`, `label` (link tabs; state in the URL) |
| `Section` | primitives.tsx | `title, meta?, actions?, flush?, id?, className?` |
| `KpiRow` | primitives.tsx | `items: { label, value, unit?, tags?, foot?, href? }[]`, `label`. Three or four figures; not a hero strip. |
| `DataTable<R>` | primitives.tsx | `columns: { key, label, align?, mono?, width?, render }[]`, `rows`, `rowKey`, `caption`. Empty rows render `EmptyState`. |
| `EmptyState`, `StaleState`, `EvidenceIds` | primitives.tsx | `{ title, body, action? }`, `{ since, what }`, `{ ids, proofHref? }` |
| `RunChart`, `PairedBars`, `Sparkline` | components/ui/charts.tsx | SVG. Subject in accent, comparison grey; `PairedBars` never stacks (Verified and Indicative are not added). |
| `AreaStub` | components/stub/AreaStub.tsx | placeholder listing planned screens; replace per area. |

Rules: confidence follows the method. Proposals and Ask answers show a label and band only, never a score. Lot links show `link_confidence`. Verdicts show verdict, rung (only R3/R4 called Verified), effect and interval. Every colour carries a word. Disabled actions name who can.

## 4. Data module (`src/lib/demo/`)
- `types.ts`: the plant object model, one interface per entity in Proto Bot's `designs/data-needs.md` (Site, Area, Line, Asset, Tag, TagReading, LinePack, Run, SetpointWrite, SignedWindow, StandingApproval, Proposal, Trial, StopEvent, RunningSetting, MeasurementPlan, HoldingCheck (holding / faded / inconclusive), ModelFit, ProofRecord, Grade, Spec, Lot, LotProperty, LabResult, LotLink, DriftSignal, AlarmBudget, Investigation, Correction, DataSource, DataGap, PlantBox, Lease, Person, Role, Permission, Assignment, NotificationRule, Integration, ApiKey, Webhook, Shift, Price, AskThread, SavedAnswer, Note, AuditEvent, Report, ValueItem, InboxItem, ShiftEvent). Every record carries `illustrative: true` in the type for honesty; the UI does not stamp an Illustrative tag.
- `data.ts`: deterministic dataset against `DEMO_NOW` (20 Oct 2026 14:00 IST). Target plant (metal works): Forge (`line-a`), Heat treatment (`line-c`), Foundry (`line-d`), Machining (`line-e`), small Moulding (`line-b`). People are "Role X.". No client names. No Faridabad proof figures and no incumbent product names (see `docs/UI_CONTRACT.md`). Use `byId.*` lookups (line, asset, proposal, trial, proof, lot, link, correction, gap, window, inbox, person, role). `at(days, hours, minutes)` makes demo times. Line wording comes from `LinePack`, not hard-coded batch/discrete branches.
- Value: `valueItems` with `status` Verified (R3/R4) or Indicative, `inrPerMonth`, `proofRecordId`. There is no total field; never add the two.
- `src/lib/format.ts`: `hhmm`, `dayMonth`, `rel`, `inr` (Indian grouping), `lakh`, `num`.
- Add data here, keep cross-links valid (`tests/data.test.ts` checks them).

## 5. Roles and RBAC
- `src/lib/rbac.ts`: the spec §3 matrix as data. `grant(role, action)` returns allow/view/hidden; `can(role, action, scope?)`; `whoCan(action)`; `ACTION_LABELS`, `ROLE_ORDER`, `permissions`.
- `src/lib/role.ts`: `await currentRole()` in server components reads the `stamped-role` cookie (default plant head).
- Showcase: every area reachable in every role; only actions and default Home view change. No "release a hold" action exists.

## 6. Routes
| Route | State |
|---|---|
| `/` Home, `?view=overview\|plant\|shift\|line\|owner` | Built. `/` opens on Overview. |
| `/inbox?tab=waiting\|tasks\|decided\|questions`, `/inbox/[id]` | Built. |
| `/process/**` | Built. Client hubs: Actions, Lines, Performance, Reports, Setup. Engineering hub (Stamped engineer): Loop dashboard, Optimisation, Simulation campaigns, Modules, Model upkeep. Hub tabs via `ProcessHubTabs`. Agent at work: `/process/agent`. Reports: index + detail with Export as. |
| `/quality/**` | Built. Client hubs: Actions, Lots, Analytics, Setup. Engineering hub (Stamped engineer): Simulation campaigns, Monitor tuning, Cause gap, Cause graphs. Agent at work: `/quality/agent`. Control and capability: `/quality/spc` (Capability redirects here). CAPA redirects into Investigations. |
| `/plant/**`, `/ask/**`, `/settings/**`, `/activity/**` | Built. |
| `/planning` | Coming soon page. |
| Old energy routes | Redirect in `next.config.ts` (spec §13). |

Conventions: one folder per area under `src/app/<area>/`; sub-screens as nested routes (`/process/lines/[id]`), view state in search params so links preview and share; evidence on demand as `?evidence=<proofId>` on the run or lot page (Proof is not an area). Every page: `Workspace` → `PageHeader` → hub tabs (Process/Quality) → content on the 12-column `.grid` with `.span-N`. Prefer main `span-8` + context `span-4` with `.ctx`. Eyebrow for hub screens: `Process · {hub.sidebarLabel}` or `Quality · {hub.sidebarLabel}`. See `docs/SOURCE_ALIGNMENT.md` when docs and code disagree.

## 7. Copy
No em dashes. British/Indian spelling. No "unlock", "superpower", "platform" as pitch, client names, WhatsApp or Maintenance. Authority line: "Stamped works inside limits set beforehand." No Illustrative tags on pages; the "Demonstration plant" crumb is the demo marker. Verified and Indicative stay separate on owner Home. `pnpm lint` enforces part of this. Full rules: `docs/UI_CONTRACT.md`.
