/**
 * Plant object model for the Stamped product UI (spec §9, Proto Bot designs/data-needs.md).
 * Generic across industries: words come from line packs, never hard-coded per client.
 * Every record in the showcase dataset is illustrative.
 */

export type RoleId =
  | "operator" | "shift-lead" | "process-engineer" | "quality-head"
  | "plant-head" | "owner" | "stamped-engineer" | "viewer";

export type ActionId =
  | "see-own-line" | "see-plant-value" | "decide-proposal" | "press-stop" | "revoke-lease"
  | "draft-trial" | "sign-trial" | "sign-limits" | "narrow-limit" | "grant-standing-approval"
  | "confirm-lot-link" | "send-correction" | "accept-correction" | "use-ask"
  | "manage-people" | "manage-integrations" | "export-reports" | "audit-log";

/** allow = can do, view = view only, hidden = not shown. */
export type Grant = "allow" | "view" | "hidden";

export type EvidenceLabel = "Measured" | "Estimated" | "Modelled" | "Assumed" | "Unknown";
export type Mode = "Trial" | "Stay" | "Recommend-only" | "Stopped";
export type LineMode = "Watching" | "Proposing" | "Standing approval" | "Trial" | "Recommend-only";
export type CardState =
  | "Noticed" | "Abstained" | "Proposed" | "Withheld" | "Waiting" | "Declined" | "Expired"
  | "Running stay" | "Running trial" | "Stopped" | "Measuring" | "Verdict" | "Holding";
export type Verdict = "Improved" | "No change" | "Worse" | "Inconclusive" | "Withheld";
export type Rung = "R0" | "R1" | "R2" | "R3" | "R4";
export type HomeView = "plant" | "shift" | "line" | "owner";
export type QualityCode = "good" | "uncertain" | "bad";

export interface Illustrative { illustrative: true }

export interface Site extends Illustrative { id: string; name: string; timezone: string; currency: "INR"; units: "metric" }
export interface Area extends Illustrative { id: string; siteId: string; name: string }
export interface Line extends Illustrative {
  id: string; areaId: string; name: string; short: string; type: "batch" | "discrete";
  linePackId: string; mode: LineMode; product: string; status: string;
  kpis: { label: string; value: string; unit?: string; label2?: EvidenceLabel }[];
}
export interface Asset extends Illustrative {
  id: string; lineId: string; name: string;
  section: { x: number; y: number; w: number; h: number }; keyReadingTagId: string;
}
export interface Tag extends Illustrative { id: string; assetId: string; lineId: string; name: string; unit: string }
export interface TagReading extends Illustrative { tagId: string; runId: string; at: string; value: number; qualityCode: QualityCode; label: EvidenceLabel }
export interface LinePack extends Illustrative {
  id: string; equipmentClass: string; runDefinition: string; series: string[]; setpoints: string[];
  modelId: string; constraints: string[]; windowTemplate: string;
  labels: { run: string; runs: string; unit: string; outcome: string }; linkThreshold: number;
}
export interface Outcome { name: string; value: number; unit: string; label: EvidenceLabel }
export interface Run extends Illustrative {
  id: string; lineId: string; product: string; start: string; end: string;
  setpoints: Record<string, number>; outcomes: Outcome[]; proofRecordId?: string;
}
export interface SetpointWrite extends Illustrative {
  runId: string; param: string; value: number; source: "proposal" | "operator adjust" | "prior";
  byRole: RoleId; at: string; status: "written" | "skipped"; reason?: string;
}
export interface SignedWindow extends Illustrative {
  id: string; lineId: string; param: string; name: string; unit: string; low: number; high: number;
  narrowedLow?: number; narrowedHigh?: number; narrowedBy?: string; signerRole: RoleId;
  signedBy: string; signedAt: string; expiresAt: string; version: number; manifestRef: string;
}
export interface StandingApproval extends Illustrative {
  id: string; lineId: string; params: string[]; band: string; grantedBy: string;
  from: string; until: string; uses: number; reviewedAt: string;

  /** Set when the approval was withdrawn before its end date. */
  revokedBy?: string; revokedAt?: string; revokeReason?: string;
}
export interface Proposal extends Illustrative {
  id: string; lineId: string; assetId: string; param: string; current: number; proposed: number;
  optimiserVersion: string; reason: string; evidenceIds: string[];
  predicted: { name: string; low: number; point: number; high: number; unit: string; spec?: [number, number] };
  drivers: string[];
  safetyFilter: { pass: boolean; rules: string[] }; fitState: "accepted" | "not accepted";
  weakestLabel: EvidenceLabel; mode: Mode; state: CardState; createdAt: string; expiresAt: string;
  decidedBy?: string; decidedAt?: string; declineReason?: string; stopEffect: string;
}
export interface Trial extends Illustrative {
  id: string; lineId: string; change: string; restoreTarget: Record<string, number>;
  schedule: string[]; switches: { runId: string; arm: "A" | "B"; done: boolean; skippedReason?: string }[];
  measurementPlanId: string; draftedBy: string; signerRole: RoleId; signedAt?: string;
  status: "draft" | "awaiting signature" | "running" | "finished" | "stopped";
}
export interface StopEvent extends Illustrative {
  id: string; lineId: string; trialId?: string; by: string; at: string; mode: "trial" | "stay";
  effect: string; restoreResult: "restored" | "not needed" | "restore failed, recommend-only";
}
export interface RunningSetting extends Illustrative {
  lineId: string; param: string; name: string; value: number; unit: string; band: [number, number];
  mode: Mode; writtenAt: string; signerRole: RoleId; expiresAt: string;
}
export interface MeasurementPlan extends Illustrative {
  id: string; version: number; hash: string; lockedAt: string; trialId: string;
  measures: { name: string; unit: string; method: string }[]; minBatches: number;
}
export interface HoldingCheck extends Illustrative { planId: string; checkedAt: string; result: "holding" | "faded" | "inconclusive"; nextAt: string }
export interface ModelFit extends Illustrative {
  modelId: string; version: string; lineId: string; checks: { name: string; pass: boolean; value: string }[];
  coverage: number; heldOutN: number; calibratedAt: string; state: "accepted" | "not accepted";
}
export interface SourceRow { id: string; tag: string; at: string; value: string; qualityCode: QualityCode; label: EvidenceLabel }
export interface ProofRecord extends Illustrative {
  id: string; objectType: "run" | "lot" | "trial"; objectId: string; title: string;
  questions: { question: string; answer: string; label: EvidenceLabel; evidenceIds: string[] }[];
  verdict: Verdict; effect: { value: number; low: number; high: number; unit: string; measure: string };
  rung: Rung; diagnostics: string[]; measurementPlanId?: string; withheldNeeds?: number; sourceRows: SourceRow[];
}
export interface Grade extends Illustrative { id: string; name: string; lineId: string }
export interface Spec extends Illustrative { gradeId: string; property: string; unit: string; lsl: number; target: number; usl: number; sourceDoc: string; version: number }
export interface Lot extends Illustrative {
  id: string; gradeId: string; lineIds: string[]; stages: string[]; startedAt: string;
  status: "in process" | "awaiting lab" | "complete" | "on hold in quality system"; riskWord: "At risk" | "Watch" | "On track";
}
export interface LotProperty extends Illustrative { lotId: string; name: string; unit: string; predicted: { low: number; point: number; high: number }; anchored: boolean; labResultId?: string }
export interface LabResult extends Illustrative { id: string; lotId: string; property: string; value: number; at: string }
export interface LotLink extends Illustrative {
  id: string; lotId: string; runId: string; link_confidence: number;
  parts: { timeProximity: number; recipeMatch: number; sequenceConsistency: number; scannedIdAgreement: number; multiCandidatePenalty: number };
  status: "suggested" | "approved" | "rejected" | "superseded"; label: "verified" | "estimated" | "unverified"; candidates: string[];
}
export interface DriftSignal extends Illustrative { id: string; property: string; lineId: string; startedAt: string; direction: "up" | "down"; magnitude: string; label: EvidenceLabel }
export interface AlarmBudget extends Illustrative { period: string; used: number; limit: number }
export interface Investigation extends Illustrative {
  id: string; title: string; lotIds: string[]; runIds: string[]; openedBy: string; status: "open" | "closed";
  entries: { at: string; type: "note" | "evidence" | "link" | "conclusion"; text: string; evidenceIds: string[]; label: EvidenceLabel }[];
  conclusion?: string; proofRecordId?: string;
}
export interface Correction extends Illustrative {
  id: string; lotId: string; toLineId: string; param: string; direction: "raise" | "lower";
  estimate: { low: number; high: number; unit: string }; label: EvidenceLabel; sentBy: string;
  status: "sent" | "accepted" | "declined"; proposalId?: string; reason: string;
}
export interface DataSource extends Illustrative { id: string; kind: "historian" | "MES" | "LIMS" | "quality system"; name: string; lastSeen: string; tags: number; gapPct: number; qualityCodes: { good: number; uncertain: number; bad: number } }
export interface DataGap extends Illustrative { id: string; sourceId: string; from: string; to: string; affects: string }
export interface PlantBox extends Illustrative { id: string; version: string; lastSync: string }
export interface Lease extends Illustrative { id: string; issuedAt: string; maxOfflineH: 4; hardCapH: 8; state: "active" | "expired" | "revoked"; revokedBy?: string; offlineMin: number }
export interface Person extends Illustrative { id: string; display: string; initials: string; roles: { role: RoleId; scope: string }[] }
export interface Role { id: RoleId; name: string; short: string; home: HomeView }
export interface Permission { role: RoleId; action: ActionId; value: Grant }
export interface Assignment extends Illustrative { scope: string; primary: string; backup: string; skills: string[] }
export interface NotificationRule extends Illustrative { event: string; role: RoleId; channel: "in-app" | "email" }
export interface Integration extends Illustrative { id: string; kind: string; name: string; status: "connected" | "degraded" | "not connected"; lastSync: string }
export interface ApiKey extends Illustrative { id: string; label: string; created: string; lastUsed: string }
export interface Webhook extends Illustrative { id: string; url: string; events: string[]; status?: "healthy" | "failing" | "paused"; lastDelivery?: string; note?: string }
export interface Shift extends Illustrative { id: string; name: string; start: string; end: string }
export interface Price extends Illustrative { item: string; unit: string; value: number; currency: "INR"; effectiveFrom: string }
export interface AskClaim { text: string; evidenceIds: string[]; label: EvidenceLabel }
export interface AskThread extends Illustrative {
  id: string; title: string; objectRef?: string; updatedAt: string;
  messages: { from: "person" | "stamped"; text?: string; claims?: AskClaim[]; abstain?: string; cardRef?: string }[];
}
export interface SavedAnswer extends Illustrative {
  id: string; threadId: string; title: string; savedBy: string; at: string;
  lineId?: string; topic?: "Process" | "Quality";
  /** Short restatement of the saved answer. */
  summary?: string;
  /** Label and band only; no score (spec §7.2: no answer score is documented). */
  confidence?: { label: EvidenceLabel; band?: string };
  /** Ids of dataset items the answer rests on (proposals, proof records, lots, runs, model fits, trials). */
  refs?: string[];
  /** Set when the data or model behind the answer changed after it was saved. Absent means current. */
  stale?: { since: string; reason: string };
}
export interface Note extends Illustrative { id: string; kind: "handover" | "weekly"; title: string; at: string; claims: AskClaim[]; lineId?: string; topic?: "Process" | "Quality" }
export interface AuditEvent extends Illustrative {
  id: string; at: string; personId: string; role: RoleId; action: string; objectType: string; objectId: string;
  before?: string; after?: string; reason?: string; channel: "in-app" | "email" | "system";
}
export interface Report extends Illustrative { id: string; kind: string; period: string; status: "draft" | "awaiting approval" | "approved"; approvedBy?: string; formats: ("CSV" | "HTML" | "DOCX")[] }
/** Value at the plant's prices. Verified (R3/R4) and Indicative are separate; there is no total field. */
export interface ValueItem extends Illustrative {
  id: string; title: string; lineId: string; status: "Verified" | "Indicative"; rung: Rung;
  inrPerMonth: number; basis: string; proofRecordId: string;
}
/** Inbox item: the shared card points at its source object. */
export interface InboxItem extends Illustrative {
  id: string; kind: "proposal" | "trial-signature" | "lot-link" | "data-gap" | "correction" | "lot-risk";
  ref: string; bucket: "waiting" | "task" | "decided"; owner: RoleId; due?: string; title: string;
}
export interface ShiftEvent extends Illustrative { at: string; lineId: string; text: string; kind: "proposal" | "accepted" | "stop" | "lot" | "data" | "handover"; ref?: string }
