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
| Prescription queue flip cards | `who`, `when`, `evidenceRefs`, impact | Missing who/when/evidence on list payload | **Filled** — same list DTO → BFF `whoLabel` / `dueLabel` / `evidenceRefs` | Full flip evidence charts still limited without tag windows |
| Prescription detail `/prescriptions/[id]` | Structured title / why / who / evidence | Raw JSON only | **Partial** — light structured case view + optional raw JSON | Full `PrescriptionFullCase` remount out of scope |
| Evidence pages / ZIP | Packs, charts, download | Stub / 404 when gate withheld | **Partial** — seed force-path + open ingest stores evidence bundles; evidence GET **200** on seed Rx; refs listed on detail | Chart explorer / fixture charts still out of scope |
| Alarms console | Severity, category, link to Rx | Empty when Rx withheld | **Filled** — gate-safe verbs + open ingest raise alarms (6 for Vinayak seed) | — |
| Confirmed savings (MTD) | Verified ledger ₹ | Often null | **Partial** — verify path attempted on `rx_vinayak_cw_pump_recirc`; may still fail without matching L2 windows | Need L2 points aligned to MV plan for reliable verify |
| Live | Asset tree + incomer power | Empty if L2 down or during load | **Partial** — L2 when seeded; loading skeletons while assets/measurements fetch | Class-D surfaces (FFT, renewables mix) stay empty |
| Negotiate / tradeoff | Full-case remount | Stub | **Stub** | Explicit non-goal this pass |

## Data path (fixed)

```text
L5 seed (gate-safe what + who_label + evidence_refs)
  → practicality gate opens
  → alarm + evidence bundle + ledger intent
  → L5 list DTO includes what/why/who/who_label/effort/evidence_refs
  → BFF maps title/why/whoLabel/evidenceRefs
  → Overview + Prescriptions queue render narrative
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
