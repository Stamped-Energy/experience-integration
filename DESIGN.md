# Stamped L6 — Design Context

## Scene

A plant supervisor works at a bright office desk around 10am. They glance
between a phone and a 27-inch monitor to clear alarms and prescriptions before
lunch. The room is practical, noisy, and well lit. The interface must remain
calm, legible, and immediately actionable.

## Authority

- Human design guide: `external/design/forge-industrial-design-system.md`
- Machine tokens: `external/design/forge-industrial-v2.tokens.yaml`
- Product behavior: `external/handoff/stamped-l6-ui-ux-charter.md`

Local components implement these sources; they do not redefine the brand.

## Theme and color

- Light industrial surface (`#f7faf5`) for primary work.
- Dark forest structural chrome (`#051f13`) for topbar and anchors.
- Coral primary (`#f75440`) on no more than 10% of the surface, reserved for
  critical actions and abnormal state.
- Tinted neutrals, never pure black or white.
- Normal operation is grayscale. Warning/critical/good/offline always includes
  text or iconography, never color alone.
- No gradients, glass, decorative glow, or fake live pulse.

## Typography

- Plus Jakarta Sans for page titles and display values.
- Public Sans for body, controls, and data.
- Tabular numerals for ₹, energy, demand, percentages, and tables.
- Minimum 1.25 scale ratio between hierarchy levels.
- Body copy remains within 65–75 characters where it is read sequentially.

## Layout

```text
Desktop
┌─────────────────────────────────────────────────────────────┐
│ Topbar: plant · connection · Ask Analyst · account          │
├──────────┬───────────────────────────────┬──────────────────┤
│ Sidebar  │ Main work surface             │ Mode A optional  │
│ Primary  │ Page head + decisions         │ visible context  │
│ More     │ tables/charts/evidence        │ citations/chat   │
└──────────┴───────────────────────────────┴──────────────────┘

Mobile
┌──────────────────────────────┐
│ Topbar: plant · connection   │
├──────────────────────────────┤
│ Single-column work surface   │
│                              │
├──────────────────────────────┤
│ Contextual bottom action(s)  │
└──────────────────────────────┘
```

- Content max width is 1440px.
- Sidebar becomes a labelled sheet on mobile.
- Ack, defer, and done actions remain reachable at the bottom on mobile.
- Today contains at most seven linked signals.
- Cards exist only around interactive units such as an alarm or prescription.
  Do not wrap headings, charts, and tables in nested cards.
- Spacing varies by hierarchy; identical padding everywhere is not a system.

## Route structure

### Primary

`/` (Overview), `/alarms`, `/alarms/[id]`, `/prescriptions`,
`/prescriptions/[id]`, `/analyst` (Ask Analyst), `/reports`,
`/energy`, `/equipment` (Machine Health + Plant Map), `/intensity` (Sustainability),
`/tools`, `/settings/admin`, `/settings/assignments`.

### Progressive reveal / deep-link

`/settings/integrations`.

Operations nav: **Alarms**, **Prescriptions**, **Evidence** (proof packs opened
from parents or the Evidence index under Operations).

Alarms and Prescriptions cannot be removed from primary navigation for
operational roles. Alarm expand uses a **Signal snapshot** teaser; the Evidence
route is the proof pack.
## Required states

Every primary route implements:

- **Loading:** shape-preserving skeleton, never a centered spinner alone.
- **Empty:** explains normality and the next useful action.
- **Error:** plain-language cause class, retry, and persistent page context.
- **Stale/offline:** dim affected confidence, show last update and reconnect.
- **Forbidden:** explain role limitation without revealing foreign data.
- **Partial:** name missing series/inputs and retain usable evidence.

## Canonical components

- App shell, mobile navigation sheet, plant switcher, connection indicator.
- Page head and role-aware action region.
- Status chip with icon/text, not pill decoration.
- KPI strip, limited to decision signals.
- Alarm row/detail/actions and prescription card/detail/actions.
- Evidence chart with scope bar and data-table alternative.
- Ledger table with claim vocabulary.
- Contextual analyst and full analyst workspace.
- Skeleton, empty, error, forbidden, stale, and partial-data surfaces.
- Toast for confirmation only; never the sole error representation.

## Interaction

- Motion lasts 150–250ms and eases out. It communicates panel, toast, or
  connection state only.
- Never animate layout properties; use opacity/transform.
- `prefers-reduced-motion` disables non-essential transitions.
- Alarms support `j/k` navigation, `a` acknowledge, `e` evidence, and Enter.
- Mode A uses a focus trap, Escape close, and returns focus to its opener.
- Destructive or irreversible effects require explicit confirmation.

## Accessibility

- WCAG AA contrast on all Forge roles.
- 2px visible focus ring in the secondary brand color.
- Touch targets at least 44×44; primary buttons target 48px.
- Semantic headings, landmarks, lists, buttons, and tables.
- Sort changes and live state updates announced without excessive chatter.
- Charts expose a concise description and togglable data table.
- Status never relies on color; icon-only controls have names.

## Data visualization

- ECharts Canvas for dense telemetry; small SVG gauges may remain.
- Baseline bands differ by fill/transparency, not competing line colors.
- TOD shading uses tariff periods; demand charts show CMD as a reference.
- Use min-max or LTTB sampling and progressive rendering for dense series.
- Heavy chart code loads only on chart routes.
- Missing factors/production/renewable/fuel data appears as missing, not zero.

## Responsive certification

- Desktop: current Chrome and Edge at 1280px and 1440px.
- Mobile: Android Chrome at 360×800 and 412×915.
- No horizontal page scroll. Data tables may use a clearly bounded scroller.
- Primary action remains visible without obscuring content or system controls.

## Performance budgets

- p75 LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 by device class.
- Primary-route JavaScript ≤350 kB gzip; target ≤250 kB.
- ECharts absent from non-chart bundles.
- Sampled 43,200-point interaction targets 60fps with a 30fps floor.

## Design review checklist

- Does the route help its role make one decision?
- Is proof one action away?
- Is abnormal state the only strong color?
- Does mobile retain the complete action, not a reduced read-only view?
- Are all non-happy states honest and useful?
- Can keyboard and screen-reader users complete the flow?
- Would removing a container/card improve hierarchy?
