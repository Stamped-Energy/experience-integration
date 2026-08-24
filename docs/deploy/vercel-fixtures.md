# Phase H0 lean — L6 on Vercel (fixture mode)

Laptop on the plant LAN remains the primary demo. This path is the **backup** when
that laptop fails: L6 loads from Vercel with **no AWS backend**.

## Why fixtures only

A browser loading L6 from Vercel **cannot** reach a BFF on the presenter's laptop.
There is no middle option. Lean backup = fixture-backed UI walkthrough.

## Package for Vercel

| File | Role |
|------|------|
| [`vercel.json`](../../vercel.json) (repo root) | Preferred Root Directory = repo root |
| [`packages/web/vercel.json`](../../packages/web/vercel.json) | Alternate if Root Directory = `packages/web` |

### Vercel project settings

1. **Framework:** Next.js  
2. **Root Directory:** repository root (uses root `vercel.json`)  
3. **Install:** `pnpm install --frozen-lockfile`  
4. **Build:** `pnpm --filter @stamped/l6-web build`  
5. **Node:** match `.nvmrc` (≥22.14)

### Environment variables (lean / fixture)

| Variable | Value | Notes |
|----------|-------|--------|
| `USE_FIXTURES` | `true` | Forces BFF offline/fixture path if a BFF is ever linked |
| `NEXT_PUBLIC_BFF_URL` | *(omit or empty)* | Same-origin; lean backup has no BFF — screens fall back to fixtures |
| `NEXT_PUBLIC_ANALYST_LIVE` | `false` | Optional; keeps analyst offline |

Do **not** set `L2_BASE_URL` / live service keys on the lean Vercel project.

### Local verification

```bash
pnpm --filter @stamped/l6-web build
# Fixture walkthrough: pnpm --filter @stamped/l6-web start
# Source indicators must stay visible (Preview · fixture / Demo fixture).
```

### Honesty rule

Fixture-backed screens must keep the hybrid **source indicator**. Say out loud in
the room that this backup shows the product shape, not the customer's live plant.

## Rollback (L6 web)

Promote the previous Vercel deployment in the Vercel dashboard (Instant Rollback).
No container image involved for this lean path.

## Not in lean path

AWS VPC/EC2/RDS, Mosquitto, `stamped-cloud`, and pointing Vercel at a real BFF are
Phase H / H0-full. See [`deploy/README.md`](../../deploy/README.md).
