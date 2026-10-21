# `@stamped/l6-web`

Next.js App Router web app for **Stamped L6** (Experience & Integration). Seeded from [`external/consumers/stamped-l6`](../../external/consumers/stamped-l6/); this package is the live consumer surface.

**Authority:** [L6 UI charter](../../external/handoff/stamped-l6-ui-ux-charter.md) · [ADR-016](../../external/decisions/016-020/ADR-016-l6-bff-runtime-boundary.md) · [ADR-W023](../../external/archive/cleanup-2026-09/adrs/ADR-023-l6-ems-and-analyst-context.md) · [Forge](../../external/design/forge-industrial-design-system.md)

## Layout

```text
src/
  app/                 # Today, alarms, prescriptions, evidence, analyst, reports
  components/
    shell/             # AppShell + reveal nav + SSE banner
    alarms/            # EMS console
    prescriptions/     # Triage queue
    analyst/           # Mode A contextual + Mode B workspace
    today/             # ≤7 signal board
    charts/            # Gauge + LoadDial
    ui/                # StatusChip, Panel, buttons
  fixtures/demo.ts     # Contract-shaped mock data
  lib/                 # types, formatters, analyst context helpers
  styles/tokens.css    # Forge Industrial CSS variables
tests/
TRANSFER.md            # What came from the platform seed
```

## Setup

From the repository root:

```bash
corepack enable
pnpm install
pnpm --filter @stamped/l6-web typecheck
pnpm --filter @stamped/l6-web test
pnpm --filter @stamped/l6-web build
```

## Next

Wire BFF mutations to L5 (alarms / Rx) and L2 ledger reads per [build plan](../../external/handoff/stamped-l6-build-plan.md). Keep claim vocabulary in `lib/format.ts` aligned with ADR-014.
