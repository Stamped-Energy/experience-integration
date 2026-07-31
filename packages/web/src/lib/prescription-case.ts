import { DEMO_PLANT, type DemoAsset } from "@/fixtures/demo";
import { prescriptionCaseDetailOverrides } from "@/fixtures/prescription-case-details";
import type { EvidencePack } from "@/lib/evidence";
import { formatBaselineLabel, formatEmissionFactorRef, formatInr, formatMetricLabel, formatRuleLabel } from "@/lib/format";
import type {
  Alarm,
  LedgerEntry,
  Prescription,
  PrescriptionCaseDetail,
} from "@/lib/types";

function ownerLabel(role: string): string {
  return role.replaceAll("_", " ");
}

function annualFromMonthly(monthly: number): string {
  return formatInr(monthly * 12);
}

/** Merge fixture override with derived defaults from Rx, evidence pack, ledger, and alarm. */
export function buildPrescriptionCaseDetail(input: {
  rx: Prescription;
  pack: EvidencePack;
  ledger?: LedgerEntry;
  alarm?: Alarm;
  asset?: DemoAsset;
}): PrescriptionCaseDetail {
  const { rx, pack, ledger, alarm, asset } = input;
  const override = rx.caseDetail ?? prescriptionCaseDetailOverrides[rx.id] ?? {};

  const derived: PrescriptionCaseDetail = {
    createdAt: rx.dueAt.slice(0, 10),
    description: rx.why,
    savingsRange: `${formatInr(rx.impactInrPerMonth)} / mo · ${annualFromMonthly(rx.impactInrPerMonth)} / yr modeled`,
    metadata: [
      { label: "Case", value: rx.title },
      { label: "Plant", value: DEMO_PLANT.plantName },
      { label: "Category", value: rx.category ?? "-" },
      { label: "Priority", value: rx.priority ?? "-" },
      { label: "Status", value: rx.lane.replaceAll("_", " ") },
      { label: "Owner", value: ownerLabel(rx.ownerRole) },
      { label: "Bill line", value: rx.billLine ?? "-" },
      { label: "Effort", value: rx.effort ?? "-" },
      { label: "Due", value: rx.dueLabel ?? rx.dueAt.slice(0, 10) },
      { label: "Confidence", value: `${Math.round(rx.confidence * 100)}%` },
    ],
    lineage: [
      { label: "Rule", value: pack.lineage.ruleLabel },
      { label: "Tariff", value: pack.lineage.tariffLabel },
      { label: "Asset", value: pack.scope.assetLabel },
      { label: "Metric", value: formatMetricLabel(pack.scope.metric) },
      { label: "Baseline", value: formatBaselineLabel(pack.scope.baselineId) },
      {
        label: "Scope window",
        value: `${pack.scope.from.slice(0, 10)} → ${pack.scope.to.slice(0, 10)}`,
      },
      { label: "Sources", value: pack.lineage.sources.join(" · ") },
    ],
    eventSnapshot: {
      timestamp: pack.anomaly.from.replace("T", " ").slice(0, 19) + " IST",
      caption: "Anomaly window",
      columns: [
        { key: "asset", header: "Asset" },
        { key: "loadPct", header: "Load %", align: "right" },
        { key: "comment", header: "Comment" },
      ],
      rows: Object.entries(pack.loadDialPct).map(([id, pct]) => ({
        id,
        asset: id.replaceAll("_", " "),
        loadPct: `${pct}%`,
        comment: pct >= 100 ? "Above design" : pct >= 80 ? "Elevated" : "Normal",
      })),
      interpretation: pack.anomaly.summary,
      sanityCheck:
        "Confirm finding against live load for the named assets. Log header pressure, kW, and alarms for 15–30 minutes to validate.",
    },
    rootCause: [rx.why],
    costBenefit: {
      wasteIdentified: `Modeled addressable: ${formatInr(rx.impactInrPerMonth)}/mo based on ${pack.lineage.ruleLabel}.`,
      capexNote: rx.effort ?? "See recommended actions for effort estimate.",
    },
    risksTable: rx.risks?.length
      ? {
          columns: [
            { key: "risk", header: "Risk / mitigation" },
            { key: "detail", header: "Detail" },
          ],
          rows: rx.risks.map((line, i) => {
            const parts = line.split("→").map((s) => s.trim());
            return {
              id: `risk-${i}`,
              risk: parts[0] ?? line,
              detail: parts[1] ?? "-",
            };
          }),
        }
      : undefined,
    kpis: {
      columns: [
        { key: "kpi", header: "KPI" },
        { key: "target", header: "Target" },
        { key: "alert", header: "Alert" },
      ],
      rows: [
        {
          id: "k-conf",
          kpi: "Rule confidence",
          target: `≥ ${Math.round(rx.confidence * 100)}%`,
          alert: `< ${Math.round(rx.confidence * 100 - 10)}%`,
        },
        {
          id: "k-due",
          kpi: "Action by due date",
          target: rx.dueLabel ?? rx.dueAt.slice(0, 10),
          alert: "Overdue",
        },
      ],
    },
    commissioning: rx.actions?.slice(0, 4) ?? [
      "Confirm finding against live load for the named assets.",
      "Assign an owner from the Assignments matrix.",
      "Mark done when operations confirm completion.",
    ],
    managerTakeaway: `${rx.title}. ${rx.why} Addressable ${formatInr(rx.impactInrPerMonth)}/mo at ${Math.round(rx.confidence * 100)}% confidence.`,
  };

  if (ledger) {
    derived.metadata = [
      ...(derived.metadata ?? []),
      { label: "M&V method", value: ledger.mvMethod },
      { label: "Ledger potential", value: formatInr(ledger.potentialInr) },
      { label: "Ledger realised", value: formatInr(ledger.realisedInr) },
      {
        label: "Verification",
        value: ledger.verificationStatus.replaceAll("_", " "),
      },
    ];
  }

  if (rx.realisedInr != null) {
    derived.metadata = [
      ...(derived.metadata ?? []),
      { label: "Confirmed savings", value: formatInr(rx.realisedInr) },
    ];
  }

  if (alarm) {
    derived.metadata = [
      ...(derived.metadata ?? []),
      { label: "Related alarm", value: `${alarm.assetLabel} · ${alarm.severity}` },
      { label: "Alarm state", value: alarm.state },
    ];
  }

  if (asset) {
    derived.metadata = [
      ...(derived.metadata ?? []),
      { label: "Asset area", value: asset.area },
      { label: "Asset load", value: `${asset.loadPct}%` },
      { label: "Asset kWh MTD", value: asset.kwhMtd.toLocaleString("en-IN") },
    ];
  }

  if (rx.opportunityCost) {
    derived.costBenefit = {
      ...derived.costBenefit,
      wasteIdentified:
        derived.costBenefit?.wasteIdentified ??
        `Opportunity cost ${formatInr(rx.opportunityCost.modeledInr)} over ${rx.opportunityCost.delayDays} days delay.`,
    };
  }

  return deepMergeCaseDetail(derived, override);
}

function deepMergeCaseDetail(
  base: PrescriptionCaseDetail,
  override: PrescriptionCaseDetail,
): PrescriptionCaseDetail {
  return {
    ...base,
    ...override,
    eventSnapshot: override.eventSnapshot ?? base.eventSnapshot,
    costBenefit: override.costBenefit
      ? { ...base.costBenefit, ...override.costBenefit }
      : base.costBenefit,
    risksTable: override.risksTable ?? base.risksTable,
    kpis: override.kpis ?? base.kpis,
    metadata: override.metadata ?? base.metadata,
    lineage: override.lineage ?? base.lineage,
    rootCause: override.rootCause ?? base.rootCause,
    commissioning: override.commissioning ?? base.commissioning,
  };
}
