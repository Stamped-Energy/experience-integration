# Demo Workspace Completion

## Completed work

- Added the isolated `demo/control-room` Git worktree.
- Added `/demo` as a fixture-session launcher.
- Reused the existing L6 shell and Jaipur Works fixtures for Overview,
  Alarms, Prescriptions, and Analyst.
- Added run and porting instructions to `README.md`.

## Validation

- `pnpm --filter @stamped/l6-web typecheck`
- `pnpm --filter @stamped/l6-web build`
- Browser smoke on `http://localhost:3010/demo`, `/alarms`,
  `/prescriptions`, and `/analyst`
- No linter errors in changed source files

## Known limitation

The demo is fixture-only. Actions and UI interactions can be explored, but
they do not connect to live L1–L5 services.

## What was learned

- The existing demo session already supplies the complete Jaipur Works fixture
  path; a second data model was unnecessary.
- A Git worktree keeps exploratory UI edits separate from the server-backed
  `main` checkout.
