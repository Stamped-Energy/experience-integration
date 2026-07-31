# Transfer manifest - stamped-l6 reference → this consumer

Copied from `external/consumers/stamped-l6/` into `packages/web/` (2026-07-21). Contracts stay in the submodule - do **not** fork them.

| Seed path (under `external/consumers/stamped-l6/`) | Destination | Notes |
|---------------------------------------------------|-------------|-------|
| `src/styles/tokens.css` | `packages/web/src/styles/tokens.css` | Prefer regenerating from `external/design/forge-industrial-v2.tokens.yaml` |
| `src/lib/types.ts` | `packages/web/src/lib/types.ts` | Align with OpenAPI when BFF exists |
| `src/lib/format.ts` | same | Keep claim vocabulary |
| `src/lib/analyst-context.ts` | same + BFF validation | Enforce `assertTenantMatch` server-side |
| `src/components/**` | `packages/web/src/components/**` | Replace fixture actions with BFF mutations |
| `src/app/**` | `packages/web/src/app/**` | Add auth layout + RBAC |
| `src/fixtures/demo.ts` | `packages/web/src/fixtures/` + Storybook | Keep for visual regression |
| `tests/**` | `packages/web/tests/` | Expand Playwright per UI charter §17 |

## Do not transfer

- Platform “non-canonical seed” framing as product docs
- Hard-coded `org_demo` / plant ids into production paths
- Inline `<style>` media queries long-term - move to CSS modules/Tailwind

## Parity checklist

- [ ] Today ≤7 signals
- [ ] More tools reveal persists per user
- [ ] Alarm ack posts Idempotency-Key to L5
- [ ] Rx defer requires reason
- [ ] Mode A chips removable + audited
- [ ] Dual claim badges (ops vs modeled vs reserved bill)
