# Vinayak UI ↔ data gaps

Discrepancy matrix for **Vinayak Plant** (`plant_vinayak_1`) after Phase 1–2 of the Vinayak Rx fill work (enriched L5 seed + list narrative DTO). Surfaces that still lack charts/full-case UX stay documented as remaining gaps.

## Status legend

| Status | Meaning |
|--------|---------|
| **Filled** | UI field now populated from live L2/L5 via BFF |
| **Partial** | Some path works; charts or secondary UX still limited |
| **Stub** | Route or panel still empty / placeholder by design this pass |
| **N/A** | Out of scope for Vinayak showcase |

## Matrix

| Surface | UI expects | Before | After Phase 1–2 | Remaining |
|---------|------------|--------|-----------------|-----------|
| Overview tiles (Rx panel) | `title`, `why`, impact ₹/mo, due | Empty `why`; weak titles from missing list narrative | **Filled** — L5 list DTO includes `what`/`why`/`who`/`who_label`/`due_label`/`effort`/`evidence_refs`; BFF maps into overview queue | Confirmed-savings strip still depends on verified ledger |
| Overview KPI / signal strip | Confirmed savings, closure %, MD headroom, telemetry freshness | Often null / “No upstream data” while loading | **Partial** — live KPIs when L2/L5 up; loading now uses skeletons instead of empty-state copy | Fixture-only signals stay blank |
| Prescription queue | `who`, `when`, `evidenceRefs`, impact | Missing on list payload | **Filled** — list DTO → BFF | — |
| Prescription detail `/prescriptions/[id]` | FullCase + chart + L2 points | Raw JSON / thin narrative | **Filled** — `GET /api/cases/prescription/:id` → `PrescriptionFullCase` + `L2PointsDisclosure` | Enrichment null if LLM down |
| Evidence pages / ZIP | Packs, charts, download | Stub | **Filled** — `/evidence`, `/evidence/[id]`, `?rxId=` via by-rx; ZIP when bundle exists | — |
| Alarm detail `/alarms/[id]` | AlarmFullCase + proof | Raw JSON | **Filled** — `GET /api/cases/alarm/:id` | — |
| Alarms console | Severity, category, link to Rx | Empty when Rx withheld | **Filled** — live list; evidence links to case (no fixture pack) | — |
| Confirmed savings (MTD) | Verified ledger ₹ | Often null | **Partial** — verify path if L2 allows | Need aligned MV windows |
| Live | Asset tree + incomer power | Empty if L2 down or during load | **Partial** — L2 when seeded; skeletons while loading | Class-D surfaces stay empty |
| Negotiate / tradeoff | Full-case remount | Stub | **Stub** | Explicit non-goal |

## Data path (fixed)

```text
L5 seed (gate-safe what + who_label + evidence_refs with ?window=)
  → practicality gate opens → alarm + evidence ZIP + case_enrichment
  → L6 GET /api/cases/* resolves tag windows via L2 measurements
  → PrescriptionFullCase / AlarmFullCase / EvidenceDetail + L2 points table
```

## How to re-seed Vinayak L5 only

```bash
cd experience-integration
set L5_BASE_URL=http://127.0.0.1:8080
set L5_AUTH_TOKEN=stk_dev_bootstrap_key
python scripts/seed_vinayak_l5_prescriptions.py
```

Script performs **plant-scoped** SQLite cleanup for `plant_vinayak_1` (other plants untouched), then re-ingests six catalog prescriptions. Override DB path with `L5_SQLITE_PATH` if needed. Skip wipe with `VINAYAK_SEED_SKIP_CLEANUP=1`.

## Related docs

- [VINAYAK_SHOWCASE_SEED.md](./VINAYAK_SHOWCASE_SEED.md) — L2 + L5 showcase seed checklist
- Catalog source: `closure-verification/external/demo-decks/prescriptions-examples.md`
