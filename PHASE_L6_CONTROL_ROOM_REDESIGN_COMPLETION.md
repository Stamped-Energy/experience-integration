# L6 control room redesign completion

**Status:** Complete  
**Date:** 2026-09-27

## Completed work

- Reworked the shared shell so Overview, Ask Analyst, Alarms, and Prescriptions
  are immediately reachable while Insights, Reports, and administration retain
  progressive reveal and role gating.
- Reduced shared dashboard curvature and visual noise with tighter Forge radius
  tokens, flatter surfaces, smaller shadows, and denser Overview KPI treatment.
- Made `/analyst` the primary intelligence workspace with conversation history,
  plant context, fixture/live boundary, cited answers, related links, and a
  responsive composer.
- Hardened contextual Mode A with removable context chips, a keyboard focus
  trap, Escape close, initial close-button focus, and return focus to the
  topbar trigger.
- Refocused Overview around the next operating action: seven decision signals,
  owner/proof-linked actions, and separate modeled/value context without a
  combined savings claim.
- Added production browser coverage for Overview, Mode A, and fixture Analyst
  answers across desktop and mobile.
- Removed a production hydration mismatch after demo login by using deterministic
  initial Analyst session data and a full-document post-login navigation.

## Files modified

### Product UI

- `packages/web/src/lib/navigation.ts`
- `packages/web/src/components/shell/AppTopbar.tsx`
- `packages/web/src/components/shell/AppShell.tsx`
- `packages/web/src/components/shell/SidebarNav.tsx`
- `packages/web/src/components/shell/shell.css`
- `packages/web/src/styles/tokens.css`
- `packages/web/src/styles/forge-ui.css`
- `packages/web/src/components/ui/primitives.tsx`
- `packages/web/src/app/analyst/page.tsx`
- `packages/web/src/components/analyst/AnalystWorkspace.tsx`
- `packages/web/src/components/analyst/analyst-workspace.css`
- `packages/web/src/components/analyst/ContextualAnalyst.tsx`
- `packages/web/src/components/analyst/contextual-analyst.css`
- `packages/web/src/components/today/OverviewBoard.tsx`
- `packages/web/src/components/today/overview/KpiHeroStrip.tsx`
- `packages/web/src/components/today/overview/PrescriptionsOverviewPanel.tsx`
- `packages/web/src/app/login/page.tsx`

### Tests and tracking

- `packages/web/tests/shell-nav.test.ts`
- `packages/web/tests/today-signals.test.ts`
- `packages/web/e2e/control-room.spec.ts`
- `PROGRESS.md`

The pre-existing modified `external` submodule pointer was preserved.

## Architectural changes

- Navigation hierarchy changed only at the L6 presentation layer; L5 remains
  the source of workflow and alarm truth.
- Analyst continues to use the existing BFF/live stream and explicit,
  tenant-scoped context envelope; fixture mode remains the offline fallback.
- Overview continues to consume its existing BFF/fixture data flow and keeps
  separate claim-safe values for confirmed, modeled, and unavailable states.
- No direct L3 transport, database access, autonomous control, or new runtime
  dependency was added.

## Validation performed

- `pnpm --filter @stamped/l6-web typecheck` — passed.
- `pnpm --filter @stamped/l6-web test` — 114 tests passed.
- `pnpm --filter @stamped/l6-web build` — passed.
- `pnpm --filter @stamped/l6-web test:e2e` against production `next start` —
  38 desktop/mobile tests passed.
- `ReadLints` — no errors on edited product, test, and E2E files.
- Manual production fixture smoke verified Overview, Analyst, mobile dock,
  Mode A open/close, fixture citations, and focus return.

## Known issues

- Browser smoke validates fixture mode; live BFF/L2/L4/L5 and Postgres require
  pilot credentials and services.
- The repository's existing external submodule pointer remains modified outside
  this phase and was not reset.
- The Overview's supporting-screen radius cleanup remains a later visual phase,
  as scoped by the approved plan.

## Next phase objectives

1. Conduct human visual review of the Overview and Analyst screenshots.
2. Polish reveal/admin screens using the shared tokens where the review finds
   remaining high-radius or high-noise surfaces.
3. Run live BFF and pilot cutover checks once credentials and services are
   available.

## What you learned

- A dedicated Analyst workspace can carry the deep investigation flow while a
  contextual panel keeps route-specific questioning close to the next action.
- Browser session state must not be read directly during shell render when the
  same tree is server-rendered; deferring it through the auth provider prevents
  hydration drift.
- Returning focus to the actual trigger control, rather than its wrapper,
  makes keyboard behavior testable and predictable.
- Production smoke is most useful when it checks product claims as well as
  navigation: signal caps, proof links, fixture citations, and claim-safe copy.
