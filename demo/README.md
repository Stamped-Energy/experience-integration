# Stamped L6 demo

A copy of the L6 control room that runs entirely on the Jaipur Works fixture
pack. It needs no API, Postgres, or upstream L1–L5 services, and opens straight
into a populated workspace: Overview, Alarms, Prescriptions, Evidence, Analyst,
Analytics, Reports, Assignments, Admin, and Integrations.

This is the UI playground. The server-backed product lives in
`packages/web` at the repo root. When a design change here is approved, port it
to `packages/web` — but do not port the demo-only pieces:

- `DEMO_WORKSPACE` in `src/lib/auth-context.tsx` (skips sign-in)
- Hidden source labels in `src/components/ui/SourceIndicator.tsx` and the
  always-live top bar in `src/components/shell/AppTopbar.tsx`

The main product must keep telling users when data is not live.

## Run

```powershell
cd demo
pnpm install
pnpm dev
```

Open <http://localhost:3010/>.

## Checks

```powershell
pnpm typecheck
pnpm test
pnpm build
```

## Deploy

Vercel project `demo-stamped`, root directory `demo`.

```powershell
cd demo
vercel deploy --prod
```
