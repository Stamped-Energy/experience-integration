/**
 * Example self-tuning drift proposals (Engineering Lead #112). Illustrative only.
 */

export type DriftKind = "reidentification" | "retuning";

export interface DriftFindingView {
  kind: DriftKind;
  outcome_id: string;
  metric: string;
  value: number | null;
  limit: number | null;
  detail: string;
}

export interface DriftProposalView {
  proposal_id: string;
  plant_id: string;
  asset_id: string | null;
  kind: DriftKind;
  state: "pending";
  created_at: string;
  summary: string;
  findings: DriftFindingView[];
  twin_version: string | null;
  pack_id: string | null;
  pack_version: string | null;
  live_available: false;
  illustrative: true;
}

export const DRIFT_PAGE_META =
  "Drift detection proposes re-identification or retuning. Nothing is applied until a person approves. Thresholds stay open until fitted on plant data (D145). Live list_drift_proposals reads pending self-tuning proposals when the read-api is attached.";

export const driftProposals: DriftProposalView[] = [
  {
    proposal_id: "drift-ex-001",
    plant_id: "plant_demo",
    asset_id: "a-mixer",
    kind: "reidentification",
    state: "pending",
    created_at: "2026-10-27T08:14:00+05:30",
    summary:
      "Prediction error on discharge temperature rose past the plant-supplied MAE limit. Propose a fresh identification run. No pack or twin change is applied.",
    findings: [
      {
        kind: "reidentification",
        outcome_id: "discharge_temp_c",
        metric: "model_mae",
        value: null,
        limit: null,
        detail: "MAE and its limit are not shown here: both come from plant-fitted DriftConfig and are unset in the example dataset.",
      },
    ],
    twin_version: null,
    pack_id: "pack-batch-mixer",
    pack_version: null,
    live_available: false,
    illustrative: true,
  },
  {
    proposal_id: "drift-ex-002",
    plant_id: "plant_demo",
    asset_id: "b-press",
    kind: "retuning",
    state: "pending",
    created_at: "2026-10-26T16:40:00+05:30",
    summary:
      "No-worse residual coverage fell below the plant-supplied factor. Propose retuning the residual band. Recommend only.",
    findings: [
      {
        kind: "retuning",
        outcome_id: "part_hardness",
        metric: "residual_coverage",
        value: null,
        limit: null,
        detail: "Coverage and its limit abstain until DriftConfig is fitted on pilot data.",
      },
    ],
    twin_version: null,
    pack_id: "pack-moulding",
    pack_version: null,
    live_available: false,
    illustrative: true,
  },
];

export const listDriftProposals = () => driftProposals;
