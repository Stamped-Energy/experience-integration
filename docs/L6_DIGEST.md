# L6 digest — what experience-integration builds

> Condensed from `external/technical/layers/L6-experience-and-integration.md` and L6 handoffs. **Canonical detail stays in `external/`.**

## One sentence

L6 is everything the customer **sees and connects to**: ops-first web dashboard, EMS alarm console, prescription queue, dual-mode analyst, PDF/CSV exports, and outbound REST/webhooks — composed through a tenant-scoped BFF over L2/L4/L5 HTTP APIs.

## Why it matters

```text
verified savings ≈ (waste detected L3/L4) × (closure rate driven by L5+L6 UX) × (M&V evidence presented by L6)
```

L6 does not detect kWh waste. It drives **closure** (queue, evidence, ack sync) and **renewal** (ops-confirmed ledger + sustainability packs + integration stickiness).

## Stack (accepted)

| Concern | Pick |
|---------|------|
| Framework | Next.js App Router + TypeScript |
| UI | Tailwind + shadcn themed with **Forge Industrial** |
| Charts | Apache ECharts 6 (dense TS); small SVG gauges OK |
| Data | TanStack Query via **L6 BFF** (ADR-016) |
| Realtime | **SSE** + `Last-Event-ID` |
| Jobs | BullMQ (P1+) |
| PDF | Playwright print-CSS (P1) |
| i18n | English through P2 |

## P0 modules (must ship)

| Module | Role |
|--------|------|
| Today (≤7 signals) | Ops home |
| EMS alarm console | Ack / escalate / silence |
| Prescription queue | ₹-sorted triage; defer requires reason |
| Evidence | Pre-scoped charts / drill-down |
| Mode A analyst | Contextual side shell (fixture/L4 stub OK) |
| Claim badges | `ops_confirmed` vs modeled — never bill-from-ops |

## Hard boundaries

- Browser → BFF → L2/L4/L5 only; no service keys in the browser
- No `L2_DATABASE_URL`; no OT writes
- Workflow/alarm SoR = L5; RAG = L4; L6 renders + forwards with Idempotency-Key
- Schema/ADR changes land in stamped-external first, then bump `external/`

## Phasing

| Phase | Scope |
|-------|--------|
| **P0** | Today, alarms, Rx, SSE, Mode A, claim-safe ledger, mobile ack |
| **P1** | Reveal modules, monthly pack, Mode B, Export centre |
| **P2** | Public `/v1` + Standard Webhooks, multi-plant, SSO |
| **P3** | Named connectors (paid) |

## Repo status (this clone)

- [x] `external/` submodule mounted
- [x] `packages/web` seeded from platform reference UI
- [ ] `packages/api` BFF scaffold
- [ ] Live L5/L2/L4 HTTP wiring
- [ ] Playwright E2E + contract-check in CI
