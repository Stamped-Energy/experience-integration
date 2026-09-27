# L3 → L6 documentation completion

**Status:** Complete  
**Date:** 2026-09-27

## Completed work

- Added `docs/L3_TO_L6_BUILD_GUIDE.md`.
- Documented the L3 Finding → L4 Prescription → L5 workflow/ledger → L6
  BFF/web path.
- Mapped L3 evidence, calculator, freshness, condition, and verification
  semantics to L6 display behavior.
- Documented the current L3/L6 platform-pin mismatch and the required
  compatibility gate before implementation.
- Added implementation phases, fixture scenarios, security rules, file map,
  and acceptance criteria for the L6 update.
- Updated `PROGRESS.md` with the next L3-to-L6 implementation step.

## Files modified

- `docs/L3_TO_L6_BUILD_GUIDE.md`
- `PROGRESS.md`
- `PHASE_L3_TO_L6_DOCUMENTATION_COMPLETION.md`

The pre-existing `external` submodule pointer change was not modified.

## Architectural changes

No runtime architecture or contract was changed. The guide records the
existing boundary:

```text
L3 detects and proves
→ L4 chooses
→ L5 assigns and verifies
→ L6 presents
```

## Validation performed

- Read the current L6 README, architecture handoff, UI charter, build plan,
  L5 handoff, L4 interface, and platform schemas.
- Read the current L3 field map, pilot runbook, methods contract, L4 handoff,
  Finding 2.0 model, and delivery boundary.
- Confirmed the existing L6 BFF code paths for L2, L4, L5, SSE, prescriptions,
  cases, and evidence.
- `git diff --check` passed.
- `pnpm build` passed for the web, API, contracts, worker, and infra
  packages.
- Core package typechecks completed successfully; the aggregate typecheck
  stopped at `packages/agent-cli` because its local `tsc` dependency is
  missing.
- Core package tests passed; the aggregate test command stopped at
  `packages/agent-cli` because its local `tsx` dependency is missing.
- `pnpm validate` could not start its checks because Windows Bash read
  `scripts/validate.sh` with CRLF and rejected `set -o pipefail\r`.
- Confirmed the new documents do not modify `external/`.

## Known issues

- L6 currently pins platform version `2026.08.21`; L3 currently pins
  `2026.09.25`.
- The L6 worktree already contains a modified `external` submodule pointer.
- Finding 2.0 fields are not yet a safe direct L6 contract; the guide keeps
  the L5 projection as the customer boundary.
- `packages/agent-cli` needs its workspace dependencies installed before the
  aggregate typecheck/test gates can pass.
- `scripts/validate.sh` needs normalized LF line endings (or an equivalent
  Windows-safe invocation) before the aggregate validation gate can run.

## Next phase objectives

1. Confirm the intended L6 platform pin with the owner.
2. Confirm which L3 lineage fields L4/L5 expose to L6.
3. Add strict optional lineage mapping at the L6 BFF boundary.
4. Add certified, shadow, stale, unknown, and ops-confirmed fixtures.
5. Render condition, separate effects, evidence, freshness, and verification
   in the full case.
6. Run contract, typecheck, test, build, validation, and browser gates.

## What you learned

- L6 does not need a direct L3 client; L5 is the customer-facing workflow
  boundary.
- L3 proof must remain attributable through Finding and Prescription
  references.
- Separate effect wallets and claim tiers prevent L6 from inventing a
  combined savings claim.
- The platform submodule pin is a release boundary, not a documentation
  detail.
