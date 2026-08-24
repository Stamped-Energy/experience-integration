# Production readiness record (copy)

Canonical workspace copy: `docs/plans/PRODUCTION_READINESS_RECORD.md` (L1-L6 workspace).
Local ops: [runbooks/pilot-ops.md](./runbooks/pilot-ops.md).

---

# Production readiness record â€” CNC Intelligence Core / L1â€“L6

| | |
|---|---|
| **Program** | [CNC Intelligence Core & L1â€“L6 Production Readiness](./README.md) |
| **Phase** | [N â€” Readiness review](./phase-n-readiness-review.md) |
| **Decision** | **limited-go** |
| **Scope of go** | One factory (LNM Auto Industries, Factory 1, Faridabad); seeded + live hybrid data path |
| **Decision date** | 2026-08-25 |
| **Named authority** | Vinay (pilot owner) |
| **Re-review by** | 2026-09-30 (or after any material change to traffic, deps, prompts, schemas, or ownership) |

Evidence legend used below:

| Mark | Meaning |
|---|---|
| **verified-by-doing** | Demonstrated on a real run (test, restore, rollback, smoke, alert fire) |
| **configured** | Present in code/infra/docs but not yet exercised in the target topology |
| **deferred** | Explicitly out of this go decision; tracked with owner + expiry |

---

## 1. Ownership and escalation

| Role | Who | Status |
|---|---|---|
| Pilot owner / go authority | Vinay | **verified-by-doing** (this record) |
| Engineering lead (L3 / engines) | Vinay | configured |
| L6 / BFF ops | pilot owner | configured â€” see [pilot-ops runbook](../../experience-integration/docs/runbooks/pilot-ops.md) |
| Escalation (customer-facing) | pilot owner â†’ founder | configured |
| On-call rota | single-owner pilot | **deferred** â€” formal rota after multi-factory |

Ops entry point: [OPS_RUNBOOK.md](./OPS_RUNBOOK.md).

---

## 2. Service level objectives (pilot)

Pilot SLOs are intent for Factory 1 only. Measurement is partial until AWS apply + prod telemetry.

| SLO | Target (pilot) | Measurement source | Status |
|---|---|---|---|
| L6 BFF availability | Best-effort; `/health` + `/ready` green during demo windows | BFF health endpoints | **configured** |
| L2 query latency (plant profile) | p95 under local/demo load acceptable for UI | Phase J local load notes / app timing | **configured** â€” not measured on prod topology |
| Prescription freshness | Same-shift for seeded+live hybrid | L3â†’L4 outbox + L6 Today | **configured** |
| False-positive rate (asset health) | Regression suite green | L3 / asset-health tests | **verified-by-doing** (suite exists; CI/local) |
| Formal error budget / multi-week SLO | â€” | â€” | **deferred** (Phase K Tier 2) |

---

## 3. Observability evidence

| Item | Status | Notes |
|---|---|---|
| Health / ready probes | configured | Phase K design; confirm on deployed host before cutover |
| Structured logs (no secrets) | configured | Fail-closed secrets from Phase S |
| Alert that has been watched to fire | **deferred** | No prod alert fire observed yet |
| OpenTelemetry across layers | **deferred** | Explicit Tier 2 after pilot |

---

## 4. Capacity baseline (Phase J)

| Item | Status | Notes |
|---|---|---|
| Local / staging load exercise | configured / partial | Scripts and intent exist; not a full prod-topology run |
| Capacity baseline document for EC2+RDS | **deferred** | Exception: full load test not run in prod topology |
| Host resource headroom recorded | **deferred** | Blocked on AWS apply |

---

## 5. Dependency and failure-mode analysis

| Dependency | Failure mode | Mitigation | Status |
|---|---|---|---|
| L2 Timescale / query-api | UI empty / partial | Fixture fallback flags; never invent ledger numbers | configured |
| L3 engines / rulepacks | Missing findings | Seeded plant + golden CNC smoke | **verified-by-doing** (fixture smoke path) |
| L4 / L5 upstream | 501 / missing | Surface partial; ops runbook | configured |
| Mosquitto / L1 northbound | No new CNC samples | Seeded hybrid keeps demo alive | configured |
| Vercel (L6 web) | Static UI down | Redeploy previous; BFF independent | configured |
| Secrets / service keys | Auth fail-open | Phase S â€” no working defaults | **verified-by-doing** (code + validate forbidden-pattern checks) |

Top failure modes consolidated in [OPS_RUNBOOK.md](./OPS_RUNBOOK.md) and per-repo runbooks.

---

## 6. Data handling and retention

| Item | Status | Notes |
|---|---|---|
| Org/plant tenancy on L2/L6 paths | configured | LNM Factory 1 only in scope |
| No `L2_DATABASE_URL` in L3/L6 product code | **verified-by-doing** | Enforced in repo `validate.sh` gates |
| Backup policy on RDS | **configured** (intent) â€” see exception | Not applied / not restore-proven on real RDS |
| Retention / PII in logs | configured | No PII in structured logs by policy |
| Customer collector data only (no FOCAS poll) | **verified-by-doing** | Program scope boundary |

---

## 7. Security posture

| Item | Status | Notes |
|---|---|---|
| Phase S secret hotfix (fail closed) | **verified-by-doing** | No working secret defaults |
| BFF tenancy / L2 routes | configured | Needs S4 disposition before full go |
| Public EC2 / security groups | **deferred** | AWS not applied yet |
| Dependency / secret scans in CI | configured | Per-repo where present |
| S4 security-review + S5 bugbot full triage | **deferred** / in progress | Findings must be fixed or accepted with owner+expiry before removing limited-go |

---

## 8. Recovery evidence

| Claim | Required by | Status | Evidence |
|---|---|---|---|
| Timed image / deploy rollback | Phase H commit 45 | **configured** (procedure) â€” not timed on pilot host | Runbook steps exist; **exception** until AWS apply |
| Timed RDS restore into scratch | Phase K commit 62 | **deferred** | **Exception:** restore not timed on real RDS |
| L2 down-migration / schema rollback docs | Phase K commit 61 | configured | Documented path; not exercised on prod-shaped RDS |
| Graceful SIGTERM drain | Phase K | configured | Verify supervisor propagates signals on first apply |

---

## 9. Rollout and rollback procedure (pilot)

**Rollout (limited-go):**

1. One factory only â€” `plant_lnm_faridabad_1` / LNM Factory 1 persona.
2. Seeded + live hybrid: keep seed/fixtures available; enable live upstream flags only when contracts and credentials are confirmed.
3. Bring-up order: see [OPS_RUNBOOK.md](./OPS_RUNBOOK.md) (L2 â†’ L3 â†’ L4/L5 â†’ L6 BFF â†’ L6 web).
4. Gate before customer-facing window: `powershell -File scripts/validate.ps1` or `./scripts/validate.sh` exits 0.

**Rollback:**

1. Disable live L4/L5/L2 feature flags; fall back to fixture Auto (L6).
2. Redeploy previous image tag / task definition / Vercel deployment.
3. Do not reverse destructive migrations without a verified backup.
4. Record duration when rollback is first executed on the pilot host (closes Phase H exception).

---

## 10. Post-release verification

| Check | Status when green |
|---|---|
| Workspace `scripts/validate.ps1` / `validate.sh` | Gate for this phase (repos + fast unit subset + CNC fixtures smoke) |
| CNC smoke fixtures (`scripts/smoke_l1_to_l6_cnc.py`) | L1 envelope â†’ L6 card path |
| L6 `/health` + `/ready` | BFF serving |
| Plant switch â†’ LNM Factory 1 Today / alarms | Hybrid UI path |
| No secret defaults / no `L2_DATABASE_URL` in product code | Security standing claim |

---

## 11. Dated exceptions (limited-go conditions)

| # | Exception | Mitigation | Owner | Expires |
|---|---|---|---|---|
| E1 | **AWS not applied yet** (Terraform/EC2/RDS pilot topology not live) | Run pilot on approved demo/hybrid topology; no claim of production AWS cutover | Vinay (pilot owner) | 2026-09-09 |
| E2 | **Restore not timed on real RDS** | Keep local/seed backups; defer customer â€œbackup provenâ€ claims; schedule scratch restore after first RDS | Vinay (pilot owner) | 2026-09-15 |
| E3 | **Full load test not run in prod topology** | Cap concurrent users/plants to Factory 1; re-run Phase J load on applied stack before scale-out | Vinay (pilot owner) | 2026-09-15 |

Removing an exception requires updating this record with **verified-by-doing** evidence and a new decision line.

---

## 12. Decision

**limited-go** for a **single-factory pilot** using a **seeded + live hybrid** data path.

Not a full production go: AWS apply, RDS restore timing, and prod-topology load remain open exceptions above.

```
Authority : Vinay (pilot owner)
Decision  : limited-go
Date      : 2026-08-25
Scope     : LNM Factory 1 only; hybrid seed+live
Next      : Work cutover checklist in 00-program-brief.md under limited-go constraints;
            clear E1â€“E3 or renew with new expiry before claiming full go.
```

Copies (for repo-local discoverability):

- `experience-integration/docs/PRODUCTION_READINESS_RECORD.md`
- `Intellience - L3/intelligence-core/docs/PRODUCTION_READINESS_RECORD.md`
