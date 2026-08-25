# L4 / L5 evidence vs L6 full-case UI

Honest fit analysis updated after **live case** work (L5 enrichment + L2 charts + FullCase remount).

## Short answer (current)

| Question | Answer |
|----------|--------|
| Does L4 produce chart series? | **No** — URI refs + finding scalars. |
| Does L5 produce charts? | **No** — ZIP + `case_enrichment` prose (LLM, fail-open). |
| Does L6 show charts? | **Yes** — BFF `L6CasePayload` resolves `tag:…?window=` via **L2 measurements**, builds `EvidenceSample`, and shows the **same points** in a disclosure table. |

## Live path

```text
L5 accept → case_enrichment on snapshot
L6 GET /api/cases/prescription/:id | /api/cases/alarm/:id | /api/evidence/by-rx
  → parse evidence_refs → L2 listMeasurements
  → EvidencePack + EvidenceSample + series.points
UI: PrescriptionFullCase / AlarmFullCase / EvidenceDetail + L2PointsDisclosure
```

## Surface status

| Surface | Status |
|---------|--------|
| Queue narrative | Filled (list DTO) |
| `/prescriptions/[id]` FullCase | Live case payload |
| `/alarms/[id]` FullCase | Live case payload |
| `/evidence`, `/evidence/[id]`, `?rxId=` | Live case / by-rx |
| Alarm console signal pane | Live summary (no fixture pack) |
| L2 points disclosure | Same array as chart |
| ZIP download | When `evidence_bundle_id` present |

## Non-goals (still)

- LLM-invented timeseries
- Negotiate / tradeoff remount
- Synthetic `EvidenceTrend` 30d (primary chart is L2 window)

See also [VINAYAK_UI_DATA_GAPS.md](./VINAYAK_UI_DATA_GAPS.md) and [PROGRESS_LIVE_CASE.md](./PROGRESS_LIVE_CASE.md).
