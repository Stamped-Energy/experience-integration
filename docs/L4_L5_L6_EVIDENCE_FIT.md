# L4 / L5 evidence vs L6 full-case UI

Honest fit analysis: does upstream produce what the rich prescription / alarm / evidence screens need?

## Short answer

| Question | Answer |
|----------|--------|
| Does **L4** produce chart-ready evidence samples for L6? | **No.** L4 emits **URI refs** (`tag:…`, `baseline:…`, `tariff:…`, `finding:…`) plus finding **scalars** (baseline vs actual in a window). |
| Does **L5** produce L6 `EvidencePack` / chart DTOs? | **No.** L5 stores the Rx snapshot + refs in an **evidence ZIP** (`evidence.v2`) and raises thin **alarms**. No dials, minute series, or tag-value tables. |
| Can today’s **powerful** FullCase / EvidenceDetail screens be filled live? | **Mostly no.** Queue + thin narrative yes; charts / event snapshots / rich case tables are still **fixture-shaped** and largely **unwired**. |

You should either **slim the UI to refs + finding scalars + ZIP**, or add an **enrichment layer** (one LLM call for prose/tables + optional L2 series fetch for real charts). Do not invent SCADA points in the LLM.

---

## What each layer actually produces

### L4 (prescription / finding)

Contract (`external/contracts/schemas/intelligence/`):

- **Finding `evidence`:** `metric`, `baseline_value`, `actual_value`, `window`, `baseline_id`, `supporting_tags[]` — detection snapshot scalars, not a series.
- **Prescription `evidence_refs`:** pointer strings built in L4 `template_renderer` (`tag:{asset}/{metric}?window=…`, `baseline:…`, `tariff:…`, `finding:…`).
- **`mv_plan`:** method, baseline_id, boundary, verification window.

L4 does **not** emit ECharts points, dials, or `EvidenceSample`.

### L5 (workflow + evidence service)

On accept / force-send / verify, `EvidenceService.store_v2` writes roughly:

```json
{
  "schema_version": "evidence.v2",
  "phase": "accept",
  "rx": { "...full prescription snapshot..." },
  "baseline_id": "...",
  "tag_windows": [],
  "workflow_events": [],
  "channel": "whatsapp",
  "alarm": { "alarm_id": "...", "state": "raised", "severity": "..." }
}
```

APIs useful to L6 today:

| API | Useful for UI |
|-----|----------------|
| List/detail Rx (`what`/`why`/`who`/`impact`/`evidence_refs`) | Queue, Overview, thin detail |
| `…/evidence` → `bundle_id` + ZIP download | Audit pack, not charts |
| Alarms list (`severity`, `state`, `related_prescription_id`, category as summary) | Console list |
| `ledger_summary` on detail | Money strip when populated |

Alarms are thin: plant-scoped asset label, category-ish summary — not human “proof” copy or chart scopes.

### L6 UI (aspirational vs live)

| Surface | Live today | FullCase / EvidenceDetail want |
|---------|------------|--------------------------------|
| `/prescriptions` queue | L5 narrative | — |
| `/prescriptions/[id]` | Thin title/why/who/refs | `PrescriptionFullCase` + `EvidencePack` + optional `EvidenceSample` |
| `/alarms` | L5 list | Console still mixes fixture signal proof in places |
| `/alarms/[id]` | Raw JSON | `AlarmFullCase` + pack/sample |
| `/evidence`, `/evidence/[id]` | Empty stub | `EvidenceDetail` (charts, tag rows, 30d trend) |

`PrescriptionFullCase` / `AlarmFullCase` / `EvidenceDetail` exist as components and CSS but are **not** the live route implementations. Fixture `evidence-samples.ts` and `prescription-case-details.ts` define the rich shape the UI was designed around.

---

## Section-by-section: data-backed or not

| UI section | Upstream today | Verdict |
|------------|----------------|---------|
| What / why / who / when / impact | L4 → L5 Rx | **Keep** |
| Lifecycle timestamps | L5 workflow | **Keep** |
| Ledger potential / realised | L5 ledger | **Keep when present** |
| `evidence_refs` list | L4 → L5 | **Keep** (monospace / table of kinds) |
| Evidence ZIP download | L5 bundle | **Keep** |
| Event snapshot / tag value table | Finding scalars only (if finding fetched) | **Simplify** to 2–4 detection rows |
| Line / MD charts, dials, 30d trend | Not produced | **Drop or L2-resolve** |
| Root cause / manager takeaway / risks / commissioning tables | Not on wire | **LLM enrich** or cut |
| Alarm human summary + asset | Thin L5 | **LLM or derive from Rx why** |
| MD episode block | When on Rx | **Keep** |

---

## Two product directions

### A — Fit UI to real data (faster, honest)

Rewrite full-case / evidence / alarm detail around:

1. Narrative + money + lifecycle  
2. Parsed `evidence_refs` (kind / id / window)  
3. Optional finding scalar compare (baseline vs actual)  
4. ZIP download  
5. Link alarm ↔ Rx  

No empty chart chrome. Matches what L4/L5 actually ship.

### B — Enrich once, then show richer UI (worth one LLM call)

**Inputs (grounded):** Rx what/why/impact/refs, finding evidence scalars + window, optional L2 series if BFF resolves `tag:…?window=…`.

**One LLM call outputs (prose / structure only):**

- Human alarm summary  
- Root-cause bullets, manager takeaway, commissioning checklist  
- Tag rows labeled from refs + finding scalars (“detection snapshot”, not live SCADA)  
- Optional **2-point** baseline→actual chart annotated as modeled from finding  

**Never invent:** minute-by-minute kW/kVA series, fake MD peaks, fake savings.

**Real charts (if wanted):** separate BFF step — resolve `tag:` windows via L2 measurements → `EvidencePack` / series. LLM does not replace L2.

---

## Recommendation

1. **Short term:** Ship Direction A on live routes (you already started with thin Rx detail). Hide or gate FullCase until a pack builder exists.  
2. **Next:** Add L5 or L6 enrichment DTO + one LLM call for case prose + detection snapshot tables.  
3. **Only then:** Re-mount `PrescriptionFullCase` / `AlarmFullCase` / evidence routes on that DTO + optional L2 series.

Vinayak seed proves **queue + alarms + ZIP + refs**. It does **not** prove the fixture evidence gallery.

## Related

- [VINAYAK_UI_DATA_GAPS.md](./VINAYAK_UI_DATA_GAPS.md)  
- L4 refs: `knowledge-reasoning/.../template_renderer.py` (`build_evidence_refs`)  
- L5 store: `closure-verification/.../evidence/__init__.py` (`store_v2`)  
- L6 aspirational samples: `packages/web/src/fixtures/evidence-samples.ts`
