# L6 on Vercel — web-only Jaipur demo vs live BFF

## Two deployment modes

| Mode | Login | `NEXT_PUBLIC_BFF_URL` | Data |
|------|-------|------------------------|------|
| **Jaipur demo (offline)** | `demo@stamped.local` / `StampedDemo123!` | Omit or empty | Client fixtures — no BFF |
| **Normal (live)** | Org users via Better Auth | Public API URL (not `localhost`) | Live L2/L5 via BFF |

See [`docs/demo-login.md`](../demo-login.md) for credential details and security notes.

## Vercel project settings

1. **Framework:** Next.js  
2. **Root Directory:** repository root (uses root `vercel.json`)  
3. **Install:** `pnpm install --frozen-lockfile`  
4. **Build:** `pnpm --filter @stamped/l6-web build`  
5. **Node:** match `.nvmrc` (≥22.14)

### Environment variables — demo-only Vercel

| Variable | Value | Notes |
|----------|-------|--------|
| `NEXT_PUBLIC_BFF_URL` | *(omit or empty)* | Demo login never calls the BFF |
| `NEXT_PUBLIC_ANALYST_LIVE` | `false` | Optional |

Do **not** set `USE_FIXTURES` — demo data is client-side for the hardcoded login only.

### Environment variables — normal login + live data

| Variable | Value | Notes |
|----------|-------|--------|
| `NEXT_PUBLIC_BFF_URL` | `https://your-api.example.com` | Must be reachable from the browser |
| API `WEB_ORIGIN` | Exact Vercel web origin | CORS / Better Auth |
| API `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | As per API deploy | Required for sign-in |

## Local verification

```bash
pnpm --filter @stamped/l6-web build
pnpm --filter @stamped/l6-web start
# Demo: sign in with demo@stamped.local — no API required
# Normal: set NEXT_PUBLIC_BFF_URL=http://localhost:3001 and run the API
```

### Honesty rule

Demo session screens show **Preview mode** and a Jaipur demo banner. Say in the room that this path shows product shape with sample data, not the customer's live plant.

## Rollback

Promote the previous Vercel deployment in the Vercel dashboard (Instant Rollback).

## Not in lean path

AWS VPC/EC2/RDS, Mosquitto, `stamped-cloud` — see [`deploy/README.md`](../../deploy/README.md).
