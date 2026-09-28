# Four-outcome prescription system — Phase B

Date: 2026-09-28

## Delivered

- Prescription queue filters now use Dynamic production planning, Quality &
  yield, Energy & waste, and Uptime.
- Legacy `class=` prescription URLs remain readable and normalize to the new
  outcome experience.
- Value signals can lead with saved hours, avoided downtime, throughput,
  quality, waste, or modeled INR without deleting existing financial evidence.
- Today, Overview, Analyst, prescription detail, and Export Centre expose the
  outcome and value context.
- Alarm and evidence index/detail surfaces show the matching outcome and keep
  canonical alarm, prescription, and evidence deep links.
- Evidence lineage now follows the selected outcome instead of assuming every
  case is an energy/MD case.
- Energy Analytics reserves a separate legend row below the histogram for
  Baseline, Actual, and Cost.

## Compatibility

- Existing IDs, records, evidence, ledger fields, `decisionClass`, and
  management negotiation behavior remain intact.
- Existing deep links continue to resolve.
- No live API or contract boundary was changed.

## Validation

- Demo typecheck: passed.
- Demo unit tests: 119 passed.
- IDE diagnostics for edited files: no errors.

## Remaining gate

Production build, browser validation across the four filters and linked
routes, then the planned Phase C commit/deploy.
