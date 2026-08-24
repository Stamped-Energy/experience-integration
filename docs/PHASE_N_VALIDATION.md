# Phase N validation evidence (2026-08-25)

## Gate command

```powershell
# From L1-L6 workspace root (or experience-integration/scripts/validate.ps1)
powershell -NoProfile -File scripts/validate.ps1
```

## Result

| Step | Result |
|---|---|
| Key repos present | ok |
| intelligence-core `tests/unit` | **ok** |
| intelligence-rulepacks tests (unit/schema) | **ok** (290+, fuzz/e2e deselected on fast path) |
| knowledge-reasoning `tests/unit` | **ok** |
| closure-verification `tests/unit` | **ok** (75) |
| CNC smoke fixtures L1→L6 | **PASS** (idle CNC → L6 card, illustrative DHBVN rate) |
| Overall | **validate.ps1: ALL GREEN** |

## Gap regressions closed this session

| Gap | Disposition |
|---|---|
| `PROOF_RUN` / `ENABLE_CNC` leaking from smoke into unit tests | **fixed** — orchestrator clears demo env around pytest; smoke sets flags only in a scoped block |
| Adaptive / keep-list tests polluted by shell env | **fixed** — monkeypatch.delenv isolation (regression) |
| L4 `select_lane` / `fill_missing_categories` polluted by `PROOF_RUN` | **fixed** — explicit environ / delenv in unit tests |
| FixtureL2Client treating finding JSON / array samples as assets | **fixed** (prior commit) |
| Rulepacks spindle golden + MAD `defaults_keys` drift | **fixed** (prior commit) |
| Windows git-symlink pointer `finding.json` | **fixed** (prior commit) |
| WSL `System32\bash.exe` broken for `VALIDATE_FULL` | **mitigated** — orchestrator prefers Git Bash; skip with message if absent |

## VALIDATE_FULL

Per-repo `scripts/validate.sh` remains optional (`-Full` / `VALIDATE_FULL=1`). On this host, prefer Git Bash; WSL stub fails disk attach.

## S4 / S5

Security-review (L3 core) and Bugbot (L6) spawned as Phase N commit 72. Dispositions recorded below when complete; accepted exceptions keep owner + expiry in [PRODUCTION_READINESS_RECORD.md](./PRODUCTION_READINESS_RECORD.md).

## Decision (unchanged)

**limited-go** — see production readiness record. AWS apply / timed restore / rollback still **configured**, not verified-by-doing.
