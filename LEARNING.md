# LEARNING — experience-integration (L6)

Short learn-while-working notes. Newest entry first.

---

## 2026-08-24 — Ask Analyst live SSE

- L4 client must use `/v1/chat/sessions` (not `/v1/sessions`); tenancy via `X-Org-Id` / `X-Plant-Id` / `X-User-Id`.
- BFF proxies SSE with `reply.hijack()` so Fastify does not buffer the upstream body.
- Mode A/B: when `GET /api/analyst/meta` says `live: true`, accumulate tokens in place (no typewriter); fixture path keeps `useStreamText`.
- Docker → host L4 needs `host.docker.internal` + `L4_LIVE=true` on the API service.
