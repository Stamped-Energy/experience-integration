# TRACE_NOTES — experience-integration @ `82df09ee87eb67b2e177f5d085dc83c171d85830`

Code-traced runtime notes for Archify diagrams (L6). Evidence is file:line on main unless noted.

## Entry points

| Process | Command / entry | Port / notes | Evidence |
|--------|------------------|--------------|----------|
| Next.js web | `pnpm --filter @stamped/l6-web dev` → `next dev` | `:3000` default | `packages/web/package.json:7`, `packages/web/next.config.ts:8-9` |
| Fastify BFF | `pnpm --filter @stamped/l6-api dev` → `tsx watch src/index.ts` | `:3001` `PORT` default | `packages/api/package.json:8`, `packages/api/src/config.ts:12`, `packages/api/src/app.ts:328` |
| pg-boss worker | `pnpm --filter @stamped/l6-worker dev` | Postgres `pgboss` schema | `packages/worker/src/index.ts`, `packages/worker/src/boss.ts:5-9` |
| Agent CLI | `packages/agent-cli/bin/stamped-l6.ts` | probes upstreams | `packages/agent-cli/src/handlers/upstreams-probe.ts:29-35` |

## Env flags (defaults on main)

| Flag | Default | Effect | Evidence |
|------|---------|--------|----------|
| `USE_FIXTURES` | `false` | Forces fixture-only upstream clients when true | `packages/api/src/config.ts:57-60`, `packages/api/src/index.ts:34-52` |
| `L2_LIVE` | `true` | L2 client live when not fixtures + `L2_SERVICE_KEY` set | `packages/api/src/config.ts:94-97` |
| `L5_LIVE` | `true` | With `L6_L5_LIVE`, constructs L5 client | `packages/api/src/config.ts:48-55` |
| `L6_L5_LIVE` | `true` | Second gate for L5 live wiring | `packages/api/src/config.ts:52-55` |
| `L4_LIVE` | **`false`** | Ask analyst live only when explicitly true | `packages/api/src/config.ts:113-116` |
| `L6_STRICT_LIVE` | `true` | Empty lists instead of silent fixtures when upstream down | `packages/api/src/config.ts:65-68` |
| `WHATSAPP_MODE` | **`auto`** | Live send when Meta token + phone id set; else dry_run | `packages/api/src/config.ts:122-123`, `packages/api/src/whatsapp/client.ts:28-40` |
| `REQUIRE_DATABASE` | `false` | Health can pass without DB in dev | `packages/api/src/config.ts:23-26` |

Product BFF boot **requires** `DATABASE_URL` for auth (`packages/api/src/index.ts:18-20`).

## Trigger → stages → outputs

### Page load + Live vs Preview

1. **Trigger:** operator opens a route (e.g. `/alarms`, `/`).
2. **Web:** client/server components call BFF `/api/*` with session cookies (`packages/web/next.config.ts` rewrite/proxy).
3. **BFF:** route handler chooses live L5/L2 client or fixture store based on gates (`packages/api/src/index.ts:34-52`, alarm/prescription services).
4. **Probe:** `AppShell` polls `GET /api/meta/upstreams?plantId=` (`packages/web/src/lib/data-source-context.tsx:45-47`); BFF `probeUpstreams` sets `demoMode` when configured live layer is down (`packages/api/src/meta/upstreams.ts:116-118`).
5. **Output:** top bar pill via `connectionPillLabel` / Preview copy (`packages/web/src/lib/client-copy.ts:13-26`).

### Ask Analyst turn

1. **Trigger:** user sends message from Mode A/B (`packages/web/src/lib/analyst-live.ts`).
2. **BFF:** `POST /api/analyst/sessions/:id/messages/stream` with ADR-023 envelope (`packages/api/src/analyst/routes.ts:214+`).
3. **L4:** live stream to `v1/chat/.../messages/stream` or fixture SSE (`packages/api/src/upstream/l4/client.ts:380-397`).
4. **L4 main (2026):** Ask ReAct orchestrator retired — unconditional `503 ASK_MOVED` when live (`knowledge-reasoning` `stamped_l4/analyst/graph.py`; BFF `UpstreamError` → `analyst/routes.ts:287-294`).
5. **Output:** with `L4_LIVE` off, web `fixtureAnalystReply` + Preview; with `L4_LIVE` on, `Analyst unavailable: …` in the assistant bubble (`analyst-live.ts:256-266`, `ContextualAnalyst.tsx:235-244`) — not fixture fallback on 503.

### L5 card change → screen

1. **Trigger (as-built):** BFF **polls** L5 `v1/events` every 30s when live (`packages/api/src/index.ts:74-88`, `packages/api/src/events/ingest.ts:47-74`).
2. **Persist:** append to `l5_events`, `NOTIFY l6_l5_events` (`packages/api/src/events/ingest.ts:118-140`, `packages/api/src/events/sse.ts:6`).
3. **SSE API:** `GET /api/events/stream` (`packages/api/src/events/routes.ts:67`) — **no** `EventSource` in `packages/web/**` today.
4. **UI refresh:** pages refetch on load/navigation (e.g. `packages/web/src/app/prescriptions/page.tsx`); connection chip uses upstream probe, not event stream.

### Claim labels

1. **Input:** `LedgerEntry.verificationStatus` from L5/L2 reads.
2. **Sanitise:** `sanitizeClaimStatus` demotes `verified` without `billLineRefs` → `ops_confirmed` (`packages/web/src/lib/ledger.ts:18-23`).
3. **Output:** `claimBadgeLabel` + disclosure strings (`packages/contracts/src/mappings.ts:39-56`, `packages/web/src/lib/ledger.ts:77-84`).

### WhatsApp loop

1. **Outbound:** `POST /api/assignments/notify` → `enqueueWhatsAppNotification` (`packages/api/src/assignments/routes.ts:304`, `packages/api/src/whatsapp/service.ts:44-74`).
2. **Inbound:** Meta `POST /api/webhooks/whatsapp` signature verify (`packages/api/src/whatsapp/routes.ts:158-175`).
3. **Stub:** allowed buttons acknowledged; Rx mapping TODO (`packages/api/src/whatsapp/routes.ts:214-215`).

## Doc ↔ code gaps

| ID | Docs say | Code on main does | Evidence |
|----|----------|-------------------|----------|
| G7 | SSOT loop nav: Now · Card · Close · Autonomy · Constraints · Evidence · Ask | As-built `NAV_ITEMS`: Overview, Live, Equipment, Alarms, Prescriptions, Ask, Evidence, Reports, … | `packages/web/src/lib/navigation.ts:12-93` vs `external/handoff/l6/stamped-l6-ui-ux-charter.md:53` |
| new-L5-push | L5 HMAC webhook → BFF ingest (planner hint) | 30s poll `ingestL5Events`; no L5 webhook POST route | `packages/api/src/index.ts:74-88`; grep webhooks → only WhatsApp + outbound integrations |
| new-SSE-ui | Real-time card updates via SSE | SSE route + NOTIFY exist; web never subscribes | `packages/api/src/events/routes.ts:67`; no `EventSource` under `packages/web` |
| new-ask-retired | Live Ask answered by L4 ReAct SSE | L4 main 503 ASK_MOVED; L6 Preview fixtures or error bubble | L4 `stamped_l4/analyst/graph.py` · `packages/api/src/analyst/routes.ts:287-294` |
| new-pgboss-L5 | pg-boss drives L5 → UI | pg-boss queues: reports + outbound webhooks; not L5 ingest | `packages/worker/src/boss.ts:5-9`, `packages/worker/src/boss.ts:40-65` |
