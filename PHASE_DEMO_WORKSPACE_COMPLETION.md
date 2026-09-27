# Demo Workspace Completion

## Completed work

- Added the isolated `demo/control-room` Git worktree.
- The root route now starts directly in the fixture session; `/demo` remains a
  launcher alias.
- Reused the existing L6 shell and Jaipur Works fixtures across Overview,
  Alarms, Prescriptions, Evidence, Analyst, Analytics, Reports, Assignments,
  Admin, Integrations, and Tools.
- Added fixture-backed prescription, alarm, and evidence detail resolution.
- Seeded Analyst history and replies from the local fixture pack, with no live
  Analyst call in the demo.
- Seeded administration members/audit events, assignment routes, API keys,
  webhooks, Entra status, WhatsApp history, and tool counts.
- Removed the sample-only sign-in banner and the demo's BFF/telemetry
  dependency, so pages open populated without a running server.
- Added run and porting instructions to `README.md`.

## Validation

- `pnpm --filter @stamped/l6-web typecheck`
- `pnpm --filter @stamped/l6-web test` — 114 passing
- `pnpm --filter @stamped/l6-web build`
- Browser smoke on `http://localhost:3010/`, `/prescriptions/rx_9001`,
  `/alarms/alm_1001`, `/evidence/evd_4401`, `/evidence/evd_rx_9001`,
  `/analyst`, `/settings/admin`, `/settings/assignments`, and
  `/settings/integrations`
- No linter errors in changed source files

## Deliberate boundary

The demo is fixture-only. Actions and UI interactions can be explored, but
they do not connect to live L1–L5 services.

## What was learned

- The existing demo session already supplies the complete Jaipur Works fixture
  path; a second data model was unnecessary.
- A Git worktree keeps exploratory UI edits separate from the server-backed
  `main` checkout.
