# Latest plant decision records

## Completed work

- Added five latest Jaipur plant alarm records dated 21 Jul 2026.
- Added five linked prescriptions based on the Stamped practical prescription playbook:
  - MD soft-landing before a second feeder start
  - Compressor 2 filter and unload-valve inspection
  - Kiln ID-fan warm-up tuning
  - Packing-line idle auxiliary cutback
  - Admin HVAC occupancy setback
- Added five linked evidence packs with signal tags, charts, baselines, and verification notes.
- Added full case detail for every new prescription.
- Kept all existing alarms, prescriptions, evidence, and historical IDs available.

## Files modified

- `src/fixtures/demo.ts`
- `src/fixtures/evidence-samples.ts`
- `src/fixtures/prescription-case-details.ts`
- `src/lib/alarms.ts`
- `src/lib/analyst-fixtures.ts`
- `src/lib/demo-data.ts`
- `src/lib/plant-catalog.ts`
- `src/lib/prescriptions.ts`
- `src/app/page.tsx`
- `tests/alarms.test.ts`
- `tests/latest-fixtures.test.ts`

## Architectural changes

- Demo adapters now return the combined historical and latest Jaipur fixture sets.
- Alarm sorting remains severity-first, with newest timestamps first within a severity.
- Prescriptions with `firstRecommendedAt` are shown newest-first; legacy rows retain impact-based ordering.
- Evidence index records use optional capture timestamps for newest-first ordering.
- Demo case payloads now attach the existing rich case-detail override catalog to prescription detail routes.

## Validation performed

- Typecheck passed.
- 116 tests passed.
- Production build passed.
- Browser checks passed for Home, Overview, Alarms, Prescriptions, Evidence, and all 15 new alarm/Rx/evidence routes.
- Browser console had no errors. One existing ECharts zero-size warning can occur during rapid route changes.

## Known issues

- The ECharts warning is unrelated to the new records and does not affect rendered routes or data integrity.

## Next phase objectives

- Connect the same decision-chain shape to live L5/BFF payloads when those endpoints are available.

## What we learned

- A plant-facing prescription needs a clear floor action, named owner, feasible window, risk guard, and verification check.
- Alarm, Rx, and evidence IDs must be linked in both directions so every entry point lands on the same case.
- Newest-first ordering should not erase the alarm severity hierarchy or the existing impact ranking for legacy prescriptions.
