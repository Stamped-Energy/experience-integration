# Client UI audit — Aug 2026

Audit after merging PR #19 (admin wiring) and PR #20 (insights live). Goal: client-facing copy and navigation should not expose internal layer names (L2/L5/L6), BFF, fixtures, or pipeline jargon.

## Changes shipped

### Global chrome
- **Connection pill** (`client-copy.ts`, `data-source-context.tsx`): “Live plant connected”, “Offline preview” instead of L2/L5/L4 codes.
- **Demo banner** (`AppShell.tsx`): single client-safe preview message.
- **SourceIndicator**: “Live plant data”, “Live operations”, “Data unavailable”, “Preview mode”.
- **Mobile dock**: removed redundant **Tools** shortcut (still reachable via Administration if pinned).

### Navigation
- Removed **Tools** from sidebar groups (duplicate of Insights + Administration links).
- **Ask Analyst** moved to reveal tier; primary entry is topbar button (avoids duplicate nav item).

### Operations & insights pages
- Alarms, prescriptions, evidence, live, energy, equipment, plant map, intensity, reports: empty states and context lines rewritten in plain language.
- Overview board KPI hints: “From savings ledger”, “From plant telemetry”, etc.
- Machine health + plant map: removed Vinayak/L2/L1 references; consistent “plant telemetry” framing.
- Energy / sustainability boards: chart empty states no longer mention L2.

### Administration (still client-visible for admins)
- Staff plant switcher: removed BFF/API path jargon from helper text.

## Intentionally unchanged (internal / dev-only)
- Code comments, hook names (`useL2Assets`), API routes, test fixtures.
- `/tools` page still exists but is not linked in primary nav.

## Screenshots
Captured locally during audit (Playwright bypass auth): Overview, Plant Map, Machine Health, Alarms, Energy Analytics.

## Follow-ups (optional)
- Rename `L2PointsDisclosure` component file (display copy already client-safe).
- Collapse Evidence nav if cases are always reached from prescriptions/alarms.
