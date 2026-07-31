# Experience & Integration (L6) — Agent Mode

> **Project:** `experience-integration` (Stamped **L6** — Experience & Integration)  
> **Platform SoT:** [`external/`](external/) → [stamped-external](https://github.com/Vinayak-RZ/stamped-external) (git submodule)  
> Cursor coding config: vendored from [cursor-config-coding](https://github.com/Vinayak-RZ/cursor-config-coding). Project overrides belong here.

**Mission:** Ops-first control room — Today home, EMS alarm console, prescription queue, dual-mode analyst UX, claim-safe ledger display, exports, and (P2) outbound REST/webhooks. Every other layer produces intelligence; L6 is where that intelligence gets acted on.

Engineering workflow: **ponytail → nawab-plans (Plan mode) → (spec-kit for features) → research → plan → approve → implement → validate → commit → learn**.

---

## Platform pack (single source of truth)

`external/` is the **only** authority for Stamped technical architecture, contracts, ADRs, design tokens, and layer handoffs. **Never** copy `external/contracts` into packages — consume via the submodule.

```bash
git submodule update --init --recursive
test -f external/VERSION
./external/scripts/contracts/contract-check.sh
```

### Read first (L6 order)

1. `external/technical/layers/L6-experience-and-integration.md` — architecture SSOT
2. `external/handoff/stamped-l6-architecture-handoff.md`
3. `external/handoff/stamped-l6-ui-ux-charter.md`
4. `external/handoff/stamped-l6-build-plan.md`
5. `external/decisions/ADR-022-l6-bff-runtime-boundary.md`
6. `external/decisions/ADR-023-l6-ems-and-analyst-context.md`
7. `external/decisions/ADR-020-l5-mv-claim-governance.md`
8. `external/design/forge-industrial-design-system.md`
9. `packages/web/TRANSFER.md` (+ seed history under `external/consumers/stamped-l6/`)
10. `external/consumers/readmes/closure-verification.md` (Connect L6)
11. `external/handoff/l6-counterfactual-display-stub.md`
12. `external/handoff/consumer-platform-prompt.md`
13. `docs/architecture/layer-interfaces.md` — L1↔L2↔L3 boundary snapshot

### Hard rules

- **Ponytail** before every code edit (`.cursor/skills/ponytail/SKILL.md`).
- HTTP only to L2/L4/L5 — **never** `L2_DATABASE_URL` or OT writes.
- `ops_confirmed` ≠ bill `verified`. Never imply DISCOM verification from ops.
- Workflow/alarm truth is **L5**; L6 renders and forwards actions with `Idempotency-Key`.
- Analyst RAG is **L4**; send explicit removable context envelopes only (ADR-023).
- English only through P2 (ADR-018).
- Schema changes → PR in stamped-external + bump submodule; run `./external/scripts/contracts/contract-check.sh`.

### NOT in scope

MQTT ingest · edge agents · bill OCR · L3 engines · L4 LangGraph implementation · 3D digital twin · named SAP connectors (P3 paid).

### Target layout

```text
experience-integration/
  external/                 # stamped-external submodule (SoT)
  packages/
    web/                    # Next.js App Router (seeded; live here)
    api/                    # BFF — session + public /v1 (P2) — not yet scaffolded
    worker/                 # BullMQ PDF/CSV/webhooks (P1+) — not yet scaffolded
  docs/architecture/
  .cursor/                  # coding skills/rules (vendored)
```

### Definition of done (P0 slice)

- [ ] Commit matrix row tested and conventional-committed
- [ ] Claim badges + modeled disclaimer correct
- [ ] Mobile alarm ack + Rx defer-with-reason work
- [ ] Mode A focus trap + Esc + removable chips
- [ ] No secrets in repo

---

## Ponytail — mandatory gate for all coding

**Before writing or modifying any code**, read and apply the `ponytail` skill (`.cursor/skills/ponytail/SKILL.md`). Always-on rule: `ponytail.mdc`.

From [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) — lazy senior dev ladder for minimal, production-grade diffs. **Skills + MDC only** (no Ponytail MCP).

| Layer | What | When |
|-------|------|------|
| Rule | `ponytail.mdc` | Always on — requires reading the `ponytail` skill before code |
| Skill | `ponytail` | **Read first** on every coding task (write, fix, refactor, add deps) |
| Review | `ponytail-review`, `ponytail-audit` | After implementation or on request — hunt over-engineering |

Climb the ladder after you understand the problem: YAGNI → reuse codebase → stdlib → native → installed dep → one line → minimum that works. Never cut validation, security, accessibility, or error handling that prevents data loss.

Intensity: `full` (default). User can say `/ponytail ultra` for stricter YAGNI or `stop ponytail` to disable.

## Nawab Plans — mandatory in Plan mode

**Whenever in Plan mode or drafting an implementation plan**, read and apply `nawab-plans` (`.cursor/skills/nawab-plans/SKILL.md`). Enforced by `planning.mdc`. Follow `external/handoff/stamped-l6-build-plan.md` for the L6 commit matrix.

| Asset | Role |
|-------|------|
| `nawab-plans` skill | Master execution plan structure (18 sections) |
| `PLAN.template.md` | Copy into `IMPLEMENTATION_PLAN.md` |
| `SUBAGENT_ORCHESTRATION.md` | Spawn map / lead vs subagent roles |

Do not invent a thinner plan format. Collapse unused sections as `N/A` — do not skip the skill.

## Spec Kit — Spec-Driven Development (features / greenfield)

From [github/spec-kit](https://github.com/github/spec-kit). Pre-installed skills: `speckit-*`. Rule: `speckit.mdc`. Guide: [docs/SPEC_KIT.md](docs/SPEC_KIT.md).

Use for **new features / greenfield**, not one-line fixes. Target repo needs `.specify/`:

```powershell
.\scripts\install-spec-kit.ps1 -Target "D:\Startups\YourApp"
```

Order: `constitution` → `specify` → (`clarify`) → `plan` → (`checklist`) → `tasks` → (`analyze`) → `implement` → (`converge`).

During implement, still apply **ponytail** on every code change.

## Before any task

1. Read this file and all `.cursor/rules/` (start with `rule-awareness`, `ponytail`, `planning`, `core-engineering`, `learn-and-research`).
2. Confirm `external/` is initialized; prefer `external/technical/` + L6 handoff over inventing architecture.
3. **Coding tasks:** read `ponytail` skill and climb the ladder before proposing or writing code.
4. **Plan mode / any implementation plan:** read `nawab-plans` skill **compulsorily** and follow `PLAN.template.md`.
5. **Feature / greenfield:** follow `speckit.mdc` and Spec Kit skills when the user wants specs-first or the change is multi-phase; structure delivery with `nawab-plans`.
6. Follow `planning.mdc` — analyze, plan, **get user approval** before non-trivial coding.
7. Follow `communication.mdc` — surface risks and tradeoffs explicitly.
8. Unfamiliar tech → research brief for the user before architectural choices.

## Architecture (when designing or refactoring)

| Domain | Skill | Rule |
|--------|-------|------|
| Frontend / UI / Next.js | `frontend-architecture` | `frontend-architecture.mdc` |
| Backend / API / data | `backend-architecture` | `backend-architecture.mdc` |
| AI agents / LLM / tools | `agentic-system-design` | `agentic-systems.mdc` |
| Any major trade-off | `system-design-tradeoffs` | `trade-offs.mdc` |

Before large refactors, consider `graphify` on the affected directory. For Stamped product architecture, **start in `external/technical/`**.

## Learning & documentation

| Need | Skill / doc |
|------|-------------|
| Learn while building | `learn-while-building` |
| Exhaustive README | `extensive-readme` |
| Workflow guide | [docs/LEARNING_AND_RESEARCH.md](docs/LEARNING_AND_RESEARCH.md) |

End each phase with a short **What you learned** summary. Optional: maintain `LEARNING.md` in the project.

## Git commits and pushes

After each validated phase or meaningful feature:

- **Conventional commit** per `git-commit-discipline.mdc`
- **Push check** after every commit — auto-push when **≥ 10 unpushed** commits, or when user asks

Global rule: `~/.cursor/rules/git-commit-push-global.mdc`

## MCP (live architecture patterns)

Default server: **agent-patterns** → [Agent Patterns Catalog](https://www.agentpatternscatalog.org/)  
Config: `.cursor/mcp.json` | Guide: [docs/MCP_SETUP.md](docs/MCP_SETUP.md)

For agentic design, **query MCP first** (`find_pattern`, `recommend_recipe`, `pattern_for_symptom`) then apply `agentic-system-design` + `system-design-tradeoffs`.

Minimal-code discipline is **not** via MCP — use `ponytail.mdc` + the `ponytail` skill.

Reload Cursor after changing `mcp.json`.

## During implementation

7. Apply `execution.mdc` — phase-based work only; minimal scope; **read `ponytail` skill** on every edit.
8. Stack-specific optional skills: [docs/TECH_STACK_SKILLS.md](docs/TECH_STACK_SKILLS.md).
9. UI polish: `impeccable`. Animation: `gsap-*` skills. Visual system: **Forge Industrial** (`external/design/`).
10. Before marking done on non-trivial changes: consider `ponytail-review` on the diff.

## Before completion

11. Apply `quality-gates.mdc` — validate, report, update progress docs, **commit**.

## Pre-installed skills (36)

See [skills-manifest.json](skills-manifest.json) for the full list.

## Companion repos

| Repo | Role |
|------|------|
| [stamped-external](https://github.com/Vinayak-RZ/stamped-external) | Platform pack (this submodule) |
| [closure-verification](https://github.com/Vinayak-RZ/closure-verification) | L5 — alarms, workflow, ledger append |
| [knowledge-reasoning](https://github.com/Vinayak-RZ/knowledge-reasoning) | L4 — analyst RAG / prescriptions |
| [universal-repositary](https://github.com/Vinayak-RZ/universal-repositary) | L2 — query / timeseries / ledger reads |
| [cursor-config-coding](https://github.com/Vinayak-RZ/cursor-config-coding) | Coding Cursor config (vendored here) |
| [cursor-config-buisness](https://github.com/Vinayak-RZ/cursor-config-buisness) | PM/GTM/research |
| [cursor-config-design](https://github.com/Vinayak-RZ/cursor-config-design) | decks, video, visual |

## Cursor Cloud specific instructions

### Services (local)

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Web | `pnpm --filter @stamped/l6-web exec next dev --hostname 0.0.0.0 --port 3000` | 3000 | Fixture UI works **without** API/Postgres. Do **not** use `pnpm --filter @stamped/l6-web dev -- --hostname …` — Next treats `--hostname` as a project dir. |
| API BFF | `pnpm --filter @stamped/l6-api dev` (after `set -a && source .env && set +a`) | 3001 | `REQUIRE_DATABASE=false` in `.env.example` — health/meta/OpenAPI work without Postgres. |
| Worker | `pnpm --filter @stamped/l6-worker dev` | — | Needs Postgres (`DATABASE_URL`). Skip unless testing jobs. |
| Postgres / Mailpit | `docker compose -f infra/docker-compose.yml up -d postgres mailpit` | 5432 / 1025+8025 | Optional for UI; required for auth/DB/worker smoke (`pnpm compose:smoke`). |

### Gotchas

- Always `git submodule update --init --recursive` before `pnpm validate` / contract checks (`external/` must contain `VERSION`).
- **Mode A / Playwright:** `Ask Analyst` dialog works reliably against `next start` (production). Against Turbopack `next dev`, Playwright clicks may not open Mode A — prefer `PLAYWRIGHT_SKIP_WEBSERVER=1` with an already-running `next start`, or let Playwright’s config start `next start`.
- Standard gates: `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm validate` (see `scripts/validate.sh` / README). E2E: `VALIDATE_E2E=1 pnpm validate` or `pnpm --filter @stamped/l6-web test:e2e`.
- UI gallery + fast demo video: `docs/demo/` (see README). Regen: from `packages/web`, with app on `:3000`, `node scripts/capture-ui-demo.mjs`.
