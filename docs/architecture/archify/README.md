# L6 experience-integration — architecture diagrams (Archify)

Layer **L6** · `Stamped-Energy/experience-integration` @ `82df09ee` · generated 2026-09-25 with Archify (pinned `9e35d2b`) · [Master index](https://github.com/Stamped-Energy/stamped-external/blob/main/technical/archify/index.html)

> **Honesty:** No integration is live at any customer plant. Verified savings to date: ₹0. "BUILT" means code on `main` with tests, not production.

## How to view
GitHub does not render these HTML files. Clone or download this folder and open `index.html` (or any `*.html`) in a browser; it works offline. Zoom sets the detail: **MAP** (below 100%), **READ** (100%), **FULL** (175%). Use **guided views** (story mode), **Route Probe** (path between two boxes) and **Node Finder** (search).
Status tags: **BUILT** (code on main, tested) · **PARTIAL** (not wired / flag off / in-memory) · **DESIGNED** (docs only, dashed) · **DEFERRED** (postponed, dashed).

## What this repo does at runtime
Stamped’s L6 control-room is a Next.js web app (:3000) backed by a Fastify BFF (:3001) that owns sessions, upstream keys, and Postgres. Operators open Overview, Live, Alarms, Prescriptions, Ask Analyst, and Evidence routes; each page calls BFF `/api/*` endpoints that choose live L2/L4/L5 HTTP or fixtures based on `USE_FIXTURES` and `L*_LIVE` gates. The shell polls `/api/meta/upstreams` to label the connection Live vs Preview (upstream reachability, not a customer plant). Ask Analyst: with `L4_LIVE` off the UI shows a Preview fixture reply; with `L4_LIVE` on L4 returns `503 ASK_MOVED` and the UI shows Analyst unavailable (see L6-03). Ledger rows pass `sanitizeClaimStatus` before badges render. L5 workflow events are polled every 30s into `l5_events`; SSE exists on the BFF but the web app refetches pages instead of subscribing. WhatsApp notify/inbound is implemented with button handling still stubbed for Rx state changes.

## Reading order
| # | Diagram | Type | Question it answers | Status (B/P/D/X) |
|---|---|---|---|---|
| 1 | [L6-01 — L6 control-room components](L6-01-experience-integration-components.html) | architecture | How is the control-room app built? | 5/3/0/0 |
| 2 | [L6-02 — Page load — Live vs Preview gates](L6-02-page-load-live-fixture-gates.html) | sequence | What happens when a user opens a page, and when is data Live vs Preview? | 5/1/0/0 |
| 3 | [L6-03 — Ask Analyst turn](L6-03-ask-analyst-turn.html) | sequence | How does the UI send a question and show the answer? | 4/0/0/0 |
| 4 | [L6-04a — L5 card events — ingest (a)](L6-04a-l5-events-ingest.html) | sequence | How do L5 workflow events reach Postgres (poll path)? | 3/0/0/0 |
| 5 | [L6-04b — L5 card events — UI refresh (b)](L6-04b-l5-events-ui-refresh.html) | sequence | How do card changes reach the operator screen today? | 4/1/0/0 |
| 6 | [L6-07 — WhatsApp owner action loop](L6-07-whatsapp-action-loop.html) | workflow | How does an owner act on a card from WhatsApp? | 3/2/0/0 |
| 7 | [L6-05 — Claim label sanitisation](L6-05-claim-label-sanitisation.html) | dataflow | How does the UI avoid over-claiming savings? | 6/0/0/0 |
| 8 | [L6-06 — Information architecture — as-built vs target](L6-06-information-architecture.html) | architecture | Which screens exist today and which are planned? | 7/0/5/0 |

## The diagrams, explained
### L6-01 — L6 control-room components
The architecture map shows the browser, Next.js web, Fastify BFF, Postgres, pg-boss worker, and the three upstream layers. The BFF centralizes auth and service keys; live gates decide whether calls hit real L2/L4/L5 or fixtures. Remember: the worker drains report/webhook jobs—it is not on the L5 poll ingest path.

### L6-02 — Page load — Live vs Preview gates
Opening a route triggers BFF fetches guarded by env gates, then a parallel upstream probe drives the Live/Preview pill. Preview is honest fixture or disconnected mode, not a silent lie. Start guided view “Probe upstream gates”.

### L6-03 — Ask Analyst turn
Questions POST to `/api/analyst/.../stream` with removable context chips. With `L4_LIVE` off, the web uses `fixtureAnalystReply` and a Preview chip. With `L4_LIVE` on, L4 main returns `503 ASK_MOVED` (Ask retired); the BFF forwards the 503 problem and the UI shows an “Analyst unavailable” message—dashed arrows mark the designed live SSE path only.

### L6-04a / L6-04b — L5 events
Split because push webhooks are not implemented: (a) 30s poll → Postgres + NOTIFY; (b) SSE API exists but the web UI refetches pages instead of subscribing.

### L6-05 — Claim label sanitisation
Ledger statuses are sanitized before badges: bare `verified` becomes ops-confirmed unless bill line refs exist. Bill-verified wording stays reserved for a deferred DISCOM path.

### L6-06 — Information architecture
Top region is shippable nav from `navigation.ts`; lower dashed region is SSOT target loop screens still DESIGNED.

### L6-07 — WhatsApp action loop
Assignments can enqueue template sends; Meta callbacks verify HMAC. Button payloads are validated but Rx mapping remains a stub (`ok: true`).

## Doc ↔ code gaps found
| ID | Docs say | Code on main does | Evidence | Shown in |
|---|---|---|---|---|
| L6-G7 | Loop IA: Now · Card · Close · Autonomy · … | Overview · Live · Alarms · Prescriptions · … | `packages/web/src/lib/navigation.ts:12-93` | L6-06 |
| L6-gap-l5-push | L5 webhook push to L6 | 30s poll ingest | `packages/api/src/index.ts:74-88` | L6-04a |
| L6-gap-sse-ui | SSE drives UI refresh | No web EventSource consumer | `packages/api/src/events/routes.ts:67` | L6-04b |
| L6-gap-ask-retired | Live Ask via L4 ReAct SSE | L4 503 ASK_MOVED; Preview fixtures or error bubble | `packages/api/src/analyst/routes.ts:287-294` | L6-03 |

## Glossary (this repo)
- **BFF**: Fastify server between browser and L2/L4/L5; holds API keys (see L6-01).
- **Live vs Preview badge**: From `/api/meta/upstreams` `demoMode` and layer status (see L6-02).
- **USE_FIXTURES**: Forces fixture upstreams for CI/demo (see L6-02).
- **sanitizeClaimStatus**: Demotes unscoped `verified` to ops-confirmed (see L6-05).
- **ops_confirmed vs verified**: Ops clearance ≠ bill verification (ADR-020; see L6-05).
- **ingestL5Events**: Poll L5 `v1/events` into `l5_events` (see L6-04a).
- **WHATSAPP_MODE auto**: Becomes live when Meta credentials are set (see L6-07).
- **Ask Analyst envelope**: Removable context sent to L4 via BFF (see L6-03).

## Files
`src/*.json` Archify specs · `*.html` diagrams · `receipts/` validate/deliver/visual-check receipts · `TRACE_NOTES.md` code evidence · `manifest.json` machine-readable index.
