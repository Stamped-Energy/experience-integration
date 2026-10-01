# Phase Four Outcome A — Model and fixture completion

## Completed work

- Added the shared `PlantOutcome` and `PrescriptionValueSignal` types.
- Kept outcome and value-signal fields optional at the live payload boundary.
- Classified Jaipur, Vinayak, LNM, alarm, and evidence fixtures without deleting or renumbering existing records.
- Added latest-chain outcome agreement for the five Jaipur alarm/Rx/evidence links.
- Added outcome facet helpers and deterministic ID tie-breaking to prescription sorting.

## Files modified

- `demo/src/lib/types.ts`
- `demo/src/lib/prescriptions.ts`
- `demo/src/fixtures/demo.ts`
- `demo/src/fixtures/evidence-samples.ts`
- `demo/src/sites/lnm/worklist.ts`
- `demo/tests/latest-fixtures.test.ts`
- `demo/tests/prescriptions.test.ts`

## Architectural changes

- Demo records now carry one primary outcome and one primary operating value signal.
- Financial fields remain available for ledger and compatibility paths but are not the new outcome model.
- Alarm outcomes are derived from their linked prescription, with explicit outcomes for standalone operational alarms.

## Validation performed

- `pnpm typecheck` — passed.
- `pnpm test` — 119 tests passed.
- IDE lint diagnostics — no errors in edited files.

## Known issues

- UI surfaces still render Maintenance/Management facets and INR-first summaries; Phase B addresses this.
- Evidence pack lineage still needs to become outcome-aware instead of using the current MD default for every chain.

## Next phase

Replace prescription class facets with the four outcome filters and propagate the value signal through decision cards, summaries, cases, exports, alarms, and evidence.

## What we learned

- The existing demo has separate canonical and alias evidence routes, so outcome propagation must not change ID resolution.
- L6 can add optional display fields without changing the live-compatible financial and workflow fields.
- A single primary outcome keeps secondary cost, time, flow, and energy effects from becoming competing categories.
