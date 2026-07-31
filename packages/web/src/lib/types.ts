/** Shared L6 reference types — mirror contracts, do not invent fields. */

export type Role =
  | "operator"
  | "supervisor"
  | "plant_head"
  | "energy_manager"
  | "sustainability"
  | "cfo"
  | "admin";

export type AlarmState =
  | "raised"
  | "acked"
  | "escalated"
  | "silenced"
  | "cleared";

export type AlarmSeverity = "critical" | "warning" | "info";

export type VerificationStatus =
  | "pending"
  | "ops_confirmed"
  | "modeled"
  | "disputed"
  | "verified";

export type PrescriptionLane =
  | "needs_review"
  | "active"
  | "verifying"
  | "closed";

export interface Alarm {
  id: string;
  plantId: string;
  assetId: string;
  assetLabel: string;
  severity: AlarmSeverity;
  state: AlarmState;
  summary: string;
  raisedAt: string;
  ownerRole?: Role;
  relatedPrescriptionId?: string;
  findingId?: string;
}

export interface Prescription {
  id: string;
  plantId: string;
  /** Imperative action statement — what to do. */
  title: string;
  /** Short why — visible in the compact card. */
  why: string;
  impactInrPerMonth: number;
  confidence: number;
  lane: PrescriptionLane;
  ownerRole: Role;
  dueAt: string;
  verificationStatus?: VerificationStatus;
  realisedInr?: number;
  opportunityCost?: {
    delayDays: number;
    modeledInr: number;
    verificationStatus: "modeled";
  };
  /** Compact card category, e.g. Load Management. */
  category?: string;
  priority?: "high" | "med" | "low";
  billLine?: string;
  effort?: string;
  ruleId?: string;
  relatedAlarmId?: string;
  /** Human due label for compact cards, e.g. "This week". */
  dueLabel?: string;
  /** Expand / detail: numbered recommended steps. */
  actions?: string[];
  /** Expand / detail: risk → mitigation lines. */
  risks?: string[];
  /** Rich full-case detail — overrides builder defaults when present. */
  caseDetail?: PrescriptionCaseDetail;
  /** ADR-024 — management classes show Discuss + tradeoff. */
  decisionClass?: "maint" | "mgmt_schedule" | "mgmt_capacity" | "mgmt_cross_dept";
  tradeoff?: PrescriptionTradeoff;
}

/** Trade-off block for management prescriptions (₹ hero first). */
export interface PrescriptionTradeoff {
  energyBenefitInrMonthly: number;
  throughputRisk: string;
  orderContext: "known" | "unknown" | "partial";
  recommendedWindow: string;
  alternatives: string[];
  departmentOwners: string[];
  orderIds?: string[];
  oeeImpact?: string;
}

export interface CaseTableColumn {
  key: string;
  header: string;
  align?: "left" | "right";
}

export interface CaseTableRow {
  id: string;
  [key: string]: string;
}

/** Comprehensive full-case payload for the prescription detail page. */
export interface PrescriptionCaseDetail {
  createdAt?: string;
  /** Long-form problem narrative beyond compact `why`. */
  description?: string;
  savingsRange?: string;
  eventSnapshot?: {
    timestamp: string;
    caption: string;
    columns: CaseTableColumn[];
    rows: CaseTableRow[];
    interpretation: string;
    sanityCheck?: string;
  };
  rootCause?: string[];
  costBenefit?: {
    wasteIdentified: string;
    tariffScenarios?: {
      columns: CaseTableColumn[];
      rows: CaseTableRow[];
    };
    capexNote?: string;
    sideGains?: string[];
  };
  risksTable?: {
    columns: CaseTableColumn[];
    rows: CaseTableRow[];
  };
  kpis?: {
    columns: CaseTableColumn[];
    rows: CaseTableRow[];
  };
  commissioning?: string[];
  managerTakeaway?: string;
  metadata?: Array<{ label: string; value: string }>;
  lineage?: Array<{ label: string; value: string }>;
}

export interface TodaySignal {
  id: string;
  label: string;
  value: string;
  hint?: string;
  tone: "neutral" | "critical" | "good" | "warning";
  href: string;
}

/** Subset of L2 LedgerEntry for claim-safe L6 surfaces. */
export type LedgerEntryType =
  | "realised_savings"
  | "potential_savings"
  | "opportunity_cost";

export interface LedgerEntry {
  entryId: string;
  plantId: string;
  prescriptionId: string;
  title: string;
  entryType: LedgerEntryType;
  periodStart: string;
  periodEnd: string;
  potentialInr: number;
  realisedInr: number;
  verificationStatus: VerificationStatus;
  mvMethod: string;
  baselineId: string;
  emissionFactorRef: string | null;
  modeledReason?: string;
  /** Bill path only — never set from ops confirmation alone. */
  billLineRefs?: string[];
}

export type FocusEntityType =
  | "alarm"
  | "prescription"
  | "asset"
  | "ledger_entry";

export interface AnalystContextEnvelope {
  orgId: string;
  plantId: string;
  userId: string;
  role: Role;
  routeId: string;
  screenTitle: string;
  focusEntity?: { type: FocusEntityType; id: string };
  visibleSummary: string[];
  timeRange?: { from: string; to: string };
  excludeKeys?: string[];
}

export interface ConnectionStatus {
  sse: "live" | "reconnecting" | "offline";
  lastEventAt?: string;
}

export type NavKey =
  | "today"
  | "live"
  | "alarms"
  | "prescriptions"
  | "evidence"
  | "analyst"
  | "reports"
  | "energy"
  | "equipment"
  | "plant_map"
  | "intensity"
  | "tools"
  | "assignments"
  | "integrations"
  | "admin";
