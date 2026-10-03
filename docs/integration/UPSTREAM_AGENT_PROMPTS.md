# L6 upstream agent prompts

These prompts are ready to paste into agents working in the live sibling
repositories. They request only the contracts that L6 cannot safely invent.

After each sibling PR merges:

1. update the corresponding consumer README/OpenAPI snapshot in
   `stamped-external`;
2. tag or record the stamped-external source SHA;
3. bump this repository's `external/` submodule; and
4. refresh `contracts/upstream/` through the Phase A snapshot script.

## Prompt for L5 (`closure-verification`)

```text
Repository: Vinayak-RZ/closure-verification
Layer: Stamped L5 — workflow and EMS alarm source of truth

Objective
Add the missing dashboard alarm lifecycle HTTP contract required by
stamped-external ADR-W023 and the L6 UI charter. Keep all state transitions and
audit/event emission in L5. Do not add L6 UI code.

Read first
1. external/decisions/ADR-023-l6-ems-and-analyst-context.md
2. external/handoff/stamped-l6-ui-ux-charter.md §8
3. external/contracts/schemas/workflow-event.json
4. packages/domain/stamped_l5_domain/alarms/
5. packages/api/stamped_l5_api/main.py
6. docs/openapi/l5-v1.json

Required HTTP routes

POST /v1/alarms/{alarm_id}/ack
Scope: write:acknowledgements
Header: Idempotency-Key (required)
Body:
{
  "org_id": "string",
  "plant_id": "string",
  "actor_id": "string | null"
}

POST /v1/alarms/{alarm_id}/escalate
Scope: write:acknowledgements (use write:admin only if existing policy requires)
Header: Idempotency-Key (required)
Body:
{
  "org_id": "string",
  "plant_id": "string",
  "actor_id": "string | null",
  "reason": "string | null"
}

POST /v1/alarms/{alarm_id}/unsilence
Scope: write:admin
Header: Idempotency-Key (required)
Body:
{
  "org_id": "string",
  "plant_id": "string",
  "actor_id": "string | null"
}

Do not add an operator clear route. Alarm clear remains system-owned by the
clearance/workflow engine.

Behavior
- Validate org/plant tenancy before revealing alarm existence.
- Reuse the existing alarm domain methods; do not duplicate state logic in API.
- Require legal state transitions and return a stable problem+json code for an
  illegal transition.
- Duplicate Idempotency-Key + identical request returns the original outcome
  and creates one transition/event.
- Duplicate Idempotency-Key + different request is a conflict.
- Emit WorkflowEvent for every committed lifecycle change.
- Confirm/add event types for alarm_escalated, alarm_silenced, and
  alarm_unsilenced as additive schema-compatible values. Do not silently change
  stamped-external: open the platform contract PR when enum additions are needed.
- Keep GET /v1/plants/{plant_id}/alarms cursor-paginated and ensure the resulting
  state is immediately visible.

Tests
1. HTTP auth/scope tests for every route.
2. Cross-org and cross-plant negative tests that disclose no foreign data.
3. Each legal and illegal lifecycle edge.
4. Idempotency same-key/same-body and same-key/different-body.
5. One domain transition and one outbox/audit event per accepted request.
6. GET list reflects the new state.
7. GET /v1/events?since= returns the event exactly once under pagination.
8. OpenAPI live-vs-checked-in snapshot test.

Documentation and delivery
- Update docs/openapi/l5-v1.json and README API catalog.
- Update PROGRESS/DECISIONS and phase report according to repo rules.
- Run ./scripts/validate.sh.
- Commit conventionally and open a draft PR.
- Return the PR URL, source commit, exact OpenAPI paths, and validation output
  to the L6 agent.

Non-goals
No Redis, no L6 database writes, no browser auth, no OT writes, no bill claim
changes, and no dashboard implementation.
```

## Prompt for L2 (`universal-repositary`)

```text
Repository: Vinayak-RZ/universal-repositary
Layer: Stamped L2 — Universal Repository and customer-safe query API

Objective
Promote the ledger and baseline reads required by L6 onto the tenant-safe L2
query API. L6 must not use the admin API or an L2 database URL.

Read first
1. external/handoff/stamped-l2-query-api-sketch.md
2. external/architecture/layer-interfaces-l2.md
3. external/contracts/schemas/ledger-entry.json
4. external/handoff/l6-counterfactual-display-stub.md
5. external/decisions/011-015/ADR-014-l5-mv-claim-governance.md
6. current query-api auth/RLS and pagination implementation

Required read routes

GET /v1/ledger/entries
Required query:
- plant_id
Optional query:
- prescription_id
- verification_status
- entry_type
- from
- to
- cursor
- limit (bounded server maximum)

GET /v1/baselines/{baseline_id}

Recommended bounded convenience route if the existing data model supports it:
GET /v1/plants/{plant_id}/baselines?asset_id=&metric=&at=&cursor=&limit=

Authentication and tenancy
- Require X-Service-Key and X-Org-Id using the existing query-api mechanism.
- Enforce org/plant isolation in service/repository policy and RLS.
- A wrong organization must return the repository's stable forbidden/not-found
  policy without leaking rows.
- Do not expose the admin-api route or credentials to L6.

Ledger response
- Return entries conforming to external/contracts/schemas/ledger-entry.json.
- Preserve verification_status exactly: pending, ops_confirmed, modeled,
  disputed, and future verified.
- Include opportunity_cost fields such as delay_days and modeled_reason.
- Preserve append-only order and stable cursor semantics.
- Never derive a bill-verified status from ops_confirmed rows.

Baseline response
- Return baseline identity, org_id, plant_id, asset/tag/metric identity, method,
  trained/data window, interval/granularity, lower/expected/upper series or
  references, quality/coverage, and version/lock metadata where available.
- If the baseline does not exist or is unusable, return a stable error/quality
  response; do not synthesize a band.
- Cap point counts and support the granularity rules already used by
  measurements.

Tests
1. Ledger schema validation against all platform fixtures, including modeled
   opportunity cost and ops_confirmed.
2. Filters and stable cursor pagination with concurrent inserts.
3. Unknown verification status fails at the boundary.
4. Cross-org/cross-plant negative tests under RLS.
5. Baseline found, missing, low-quality, and bounded-series cases.
6. Seeded 30-day 15-minute query latency smoke.
7. OpenAPI snapshot matches the live query service.

Documentation and delivery
- Update query OpenAPI and README catalog.
- Update the L2 query sketch/platform handoff through a stamped-external PR if
  the accepted contract changes the platform document.
- Run the repository validation orchestrator.
- Commit conventionally and open a draft PR.
- Return the PR URL, source commit, exact OpenAPI paths, seeded org/plant IDs,
  and validation output to the L6 agent.

Non-goals
No L6-specific database view, no L6 write route, no ledger mutation from L6,
no admin API reuse, and no direct database credentials in downstream repos.
```

## L6 integration gate after sibling delivery

L6 accepts the upstream work only when:

- the live OpenAPI and checked-in snapshot match;
- `external/scripts/contract-check.sh` passes on the chosen platform pin;
- adapter contract fixtures validate;
- cross-tenant requests fail closed;
- duplicate L5 mutation keys produce one effect;
- L5 event cursor returns committed lifecycle changes;
- L2 ledger returns `ops_confirmed` and `modeled` fixtures unchanged; and
- no L6 package contains an L2 database URL or upstream service key in browser
  code.
