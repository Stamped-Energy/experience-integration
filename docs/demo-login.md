# Jaipur demo login (offline)

Public showcase login that **bypasses the BFF** and loads **Jaipur Works** fixture data entirely in the browser.

## Credentials

| Field | Value |
|-------|--------|
| Email | `demo@stamped.local` |
| Password | `StampedDemo123!` |

These are **hardcoded in the web client** ([`packages/web/src/lib/demo-session.ts`](../packages/web/src/lib/demo-session.ts)). They are not stored in Postgres and do not create a Better Auth session.

## What happens

1. Login page matches credentials before any network call.
2. A `sessionStorage` flag is set (`stamped.demo.session`).
3. `AuthContext` synthesizes a demo user and skips `/api/me`.
4. Plant switcher locks to **Jaipur Works** (`plant_jaipur_01`).
5. Product pages load from [`demo-data.ts`](../packages/web/src/lib/demo-data.ts) adapters (fixtures under `packages/web/src/fixtures/`).
6. `SourceIndicator` shows **Preview mode**; shell banner: *Jaipur demo — sample data only*.

## Normal login (everyone else)

Any other email/password uses Better Auth via the BFF:

- `POST {BFF}/api/auth/sign-in/email`
- `GET {BFF}/api/me` on refresh

If the BFF is unreachable, the login form shows:

> Unable to reach the sign-in service. The server may be offline — try again later.

Normal users never receive client-side fixtures.

## Surfaces

| Works in demo | BFF-only |
|---------------|----------|
| Overview, alarms, prescriptions, evidence index | Settings → Admin (members, invites) |
| Energy, equipment, plant map, live, intensity, reports | Org audit APIs |

## Vercel

- **Demo only:** deploy web; omit `NEXT_PUBLIC_BFF_URL` or leave empty. Use demo credentials.
- **Real users:** set `NEXT_PUBLIC_BFF_URL` to your public API; configure API `WEB_ORIGIN`, `DATABASE_URL`, `BETTER_AUTH_*`.

See also [`docs/deploy/vercel-fixtures.md`](./deploy/vercel-fixtures.md).

## Security note

The demo password is intentional for a public product walkthrough. Do not reuse it for production accounts. Real plant data requires authenticated BFF access.
