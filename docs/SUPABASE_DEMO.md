# L6 + Supabase (demo / simulations)

> **Secrets:** never commit `.env`. Local values are copied from content-os and stay gitignored.

## Why Prisma + Drizzle

| Layer | Role |
|-------|------|
| **Drizzle + Better Auth** | BFF runtime (auth adapter is Drizzle-only today) |
| **Prisma** | Same Supabase DB for Studio, typed seed/verify scripts (content-os style `DATABASE_URL` + `DIRECT_URL`) |

Both point at the same Postgres. Do **not** run `resetDatabase` / `DROP SCHEMA public` against shared Supabase — tests truncate L6 tables only.

## Setup

1. Copy connection strings into `experience-integration/.env` (already gitignored):

```env
DATABASE_URL=...   # pooler :6543 or direct
DIRECT_URL=...     # session/direct for migrations
REQUIRE_DATABASE=true
```

2. Prefer the **direct** host from the Supabase dashboard if the pooler returns `tenant/user ... not found`:

```text
postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
```

3. Migrate (uses `DIRECT_URL` when set):

```bash
pnpm --filter @stamped/l6-api db:migrate
```

4. Prisma client + Vinayak verify seed:

```bash
pnpm --filter @stamped/l6-api prisma:generate
pnpm --filter @stamped/l6-api prisma:seed-vinayak
pnpm --filter @stamped/l6-api prisma:studio   # optional
```

5. DB tests (loads `.env` automatically):

```bash
pnpm --filter @stamped/l6-api exec tsx --test --test-concurrency=1 tests/tenancy-vinayak.test.ts tests/tenancy.test.ts
```

## Probe

```bash
pnpm --filter @stamped/l6-api exec node scripts/probe_supabase.mjs
```

If every URL fails with `ENOTFOUND` / `tenant/user not found`, the Supabase project is paused or deleted — restore it in the dashboard or paste fresh URLs into `.env` (do not commit).
