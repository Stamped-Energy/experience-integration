# stamped-l6 agent CLI

Read-only subprocess surface for Cursor agents and automation. Every verb prints **one JSON object** on stdout using the shared [agent-cli envelope](../../../docs/plans/agent-cli/ENVELOPE.md). Exit code **0** iff `"ok": true`.

**Binary:** `stamped-l6` (via `pnpm exec stamped-l6` from repo root, or `@stamped/l6-agent-cli` after `pnpm install`).

---

## Verbs (P0)

| Verb | Command | Notes |
|------|---------|-------|
| `health` | `stamped-l6 health` | Liveness / version hint |
| `contracts.upstream-check` | `stamped-l6 contracts upstream-check` | Pinned L2/L4/L5 OpenAPI snapshots; **`--write` denied** |
| `authz.matrix` | `stamped-l6 authz matrix` | Full RBAC role × permission matrix |
| `upstreams.probe` | `stamped-l6 upstreams probe [--plant-id ID] [--org-id ID]` | Wraps BFF `probeUpstreams`; live HTTP optional |
| `openapi.public-dump` | `stamped-l6 openapi public-dump` | In-process `publicOpenApi` document |

`--json` is always on (stdout is machine-only). Diagnostics may go to stderr.

---

## Error codes

| Code | When |
|------|------|
| `denied` | [DENY_LIST](../../../docs/plans/agent-cli/DENY_LIST.md) — e.g. `--write`, mutating paths |
| `invalid_args` | Unknown subcommand or bad flags |
| `upstream_down` | Reserved for live upstream verbs when stack is down (probe may still return `ok:true` with `off`/`down` statuses in `data`) |
| `internal` | Handler failure (e.g. upstream contract checksum drift) |

---

## Examples

```bash
pnpm exec stamped-l6 health
pnpm exec stamped-l6 contracts upstream-check
pnpm exec stamped-l6 authz matrix
pnpm exec stamped-l6 upstreams probe --plant-id plant_vinayak_1
pnpm exec stamped-l6 openapi public-dump
```

---

## Tests

```bash
pnpm --filter @stamped/l6-agent-cli test
```

Machine catalog: [cli-catalog.json](./cli-catalog.json).
