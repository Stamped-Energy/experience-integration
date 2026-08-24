## Summary

<!-- What changed and why (1–3 bullets). -->

-

## Layer / surface

- [ ] API (BFF)
- [ ] Web
- [ ] Worker
- [ ] Infra / CI
- [ ] Docs / runbooks

## Test plan

- [ ] `pnpm validate` (or scoped package tests) green locally
- [ ] New/changed routes covered by unit or integration tests
- [ ] If auth/telemetry/security headers touched: confirm unauthenticated writes rejected
- [ ] If upstream clients touched: confirm `x-request-id` still forwarded

## Risk / rollback

<!-- How to roll back if this lands badly. -->

-
