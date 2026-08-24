import {
  DEMO_PLANT,
  energyKpisFixture,
  findPrescription,
  plantForId,
  alarmsForPlant,
  prescriptionsForPlant,
} from "@/fixtures/demo";
import type { AnalystContextEnvelope } from "@/lib/types";
import type { AnalystCitation } from "./analyst-context";

function plantNameOf(envelope: AnalystContextEnvelope): string {
  return plantForId(envelope.plantId).plantName;
}

function openAlarms(plantId: string) {
  return alarmsForPlant(plantId).filter((a) => a.state !== "cleared");
}

function fmtInr(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function matchQuestion(q: string): string | null {
  const lower = q.toLowerCase();
  if (/summarize.*alarm|open.*alarm|critical.*warning.*alarm/i.test(lower)) return "alarms";
  if (/explain.*prescription|highest-impact|top prescription/i.test(lower)) return "rx";
  if (/peak demand|last week|cmd|md/i.test(lower)) return "demand";
  if (/closure|billing cycle|tracking/i.test(lower)) return "closure";
  if (/why.*critical|alarm critical/i.test(lower)) return "why_critical";
  if (/evidence|proof/i.test(lower)) return "evidence";
  return null;
}

function alarmSummaryReply(envelope: AnalystContextEnvelope): string {
  const open = openAlarms(envelope.plantId);
  const critical = open.filter((a) => a.severity === "critical");
  const warning = open.filter((a) => a.severity === "warning");
  const lines = open
    .slice(0, 5)
    .map(
      (a) =>
        `• **${a.assetLabel}** (${a.severity}, ${a.state}) - ${a.summary}`,
    )
    .join("\n");

  const focus = envelope.focusEntity;
  const focusNote =
    focus?.type === "alarm"
      ? `\n\n**Priority focus:** review the focused alarm and linked prescription before shift handoff.`
      : "";

  return [
    `**${plantNameOf(envelope)} - ${open.length} open alarms** (${critical.length} critical, ${warning.length} warning, ${open.length - critical.length - warning.length} info).`,
    "",
    lines,
    focusNote,
    "",
    "**Recommended next steps:**",
    "1. Ack critical MD / coincidence alarms and review incomer headroom.",
    "2. Assign follow-ups for warning PF / idle findings.",
    "3. Open evidence for any alarm before closing - cite sources in your notes.",
  ]
    .filter(Boolean)
    .join("\n");
}

function prescriptionReply(envelope: AnalystContextEnvelope): string {
  const catalog = prescriptionsForPlant(envelope.plantId);
  const top = catalog
    .filter((p) => p.lane === "needs_review" || p.lane === "active")
    .sort((a, b) => b.impactInrPerMonth * b.confidence - a.impactInrPerMonth * a.confidence)[0];

  if (!top) {
    return `No open high-impact prescriptions for **${plantNameOf(envelope)}** in the fixture catalog.`;
  }

  return [
    `**Highest-impact open prescription: ${top.title}**`,
    "",
    `• **Why:** ${top.why}`,
    `• **Addressable:** ${fmtInr(top.impactInrPerMonth)}/mo at **${Math.round(top.confidence * 100)}%** confidence`,
    `• **Owner:** ${top.ownerRole.replaceAll("_", " ")} · **Due:** ${top.dueLabel ?? top.dueAt.slice(0, 10)}`,
    `• **Bill line:** ${top.billLine ?? "Energy (kWh)"} · **Effort:** ${top.effort ?? "Ops change"}`,
    "",
    top.actions?.length
      ? `**Immediate action:** ${top.actions[0]}`
      : "Review recommended steps on the full case page.",
    "",
    `Open **Evidence** and the **full case** before assigning. Savings stay estimated until confirmed by operations.`,
  ].join("\n");
}

function demandReply(envelope: AnalystContextEnvelope): string {
  const headroom =
    ((energyKpisFixture.cmdKva - energyKpisFixture.peakMdKva) /
      energyKpisFixture.cmdKva) *
    100;
  return [
    `**Peak demand last 7 days - ${plantNameOf(envelope)}**`,
    "",
    `• **Rolling peak MD:** ${energyKpisFixture.peakMdKva.toLocaleString("en-IN")} kVA vs **CMD ${energyKpisFixture.cmdKva.toLocaleString("en-IN")} kVA** (${headroom.toFixed(1)}% headroom)`,
    `• **Primary driver:** large-load co-start into TOD peak`,
    `• **Vs baseline (7d):** +${energyKpisFixture.vsBaselinePct}% grid kWh`,
    `• **Peak TOD share:** ${energyKpisFixture.todPeakSharePct}% of MTD energy cost`,
    "",
    "**What to do:** Stagger large-load starts to recover MD risk. Monitor incomer rolling MD - alert at <5% headroom.",
  ].join("\n");
}

function closureReply(envelope: AnalystContextEnvelope): string {
  const catalog = prescriptionsForPlant(envelope.plantId);
  const closed = catalog.filter((p) => p.lane === "closed").length;
  const verifying = catalog.filter((p) => p.lane === "verifying").length;
  const needsReview = catalog.filter((p) => p.lane === "needs_review");
  const needsReviewInr = needsReview.reduce((s, p) => s + p.impactInrPerMonth, 0);
  const closure =
    catalog.length === 0 ? 0 : Math.round((closed / catalog.length) * 100);

  return [
    `**Prescription closure - ${plantNameOf(envelope)}**`,
    "",
    `• **Closure rate (30d):** ${closure}% (${closed}/${catalog.length} closed)`,
    `• **Needs review:** ${needsReview.length} prescriptions · **${fmtInr(needsReviewInr)}/mo** addressable`,
    `• **Verifying:** ${verifying} prescriptions awaiting savings verification`,
    "",
    "**Bottleneck:** keep owners assigned on needs-review items before the billing cycle closes.",
  ].join("\n");
}

function whyCriticalReply(envelope: AnalystContextEnvelope): string {
  const id = envelope.focusEntity?.id ?? "";
  const alarm = alarmsForPlant(envelope.plantId).find((a) => a.id === id);
  if (!alarm) {
    return `Focus alarm not found - open the alarm console for live state. Cross-check evidence before ack.`;
  }
  return [
    `**${alarm.assetLabel} is ${alarm.severity}** - state: ${alarm.state}.`,
    "",
    alarm.summary,
    "",
    alarm.relatedPrescriptionId
      ? `Linked prescription available - highest-confidence ops action on this screen.`
      : "No linked prescription yet - review similar assets for patterns.",
    "",
    "Open **Evidence** for the signal window before acknowledging.",
  ].join("\n");
}

function evidenceReply(envelope: AnalystContextEnvelope): string {
  const focus = envelope.focusEntity;
  if (focus?.type === "prescription") {
    return [
      `For **${focus.id}**, open the evidence pack scoped to the linked asset and rule baseline.`,
      "",
      "Use meter readings and baseline bands for savings verification. Detection rules explain the finding.",
      "",
      "Do **not** label savings as verified on the utility bill until lines land - operations-confirmed only.",
    ].join("\n");
  }
  return [
    "Open **Evidence** from the alarm or prescription you are investigating.",
    "",
    "Detection rules explain why. Meter data shows what happened, with baseline comparison when available.",
    "",
    "Every savings claim in analyst answers must cite at least one source.",
  ].join("\n");
}

function defaultReply(envelope: AnalystContextEnvelope, question: string): string {
  const focus = envelope.focusEntity
    ? `Current focus: **${envelope.focusEntity.type.replaceAll("_", " ")}**.`
    : "";
  return [
    `Analyzing **${plantNameOf(envelope)}**.`,
    focus,
    "",
    `You asked: “${question.trim()}”`,
    "",
    "I can summarize open alarms, explain the top prescription, break down peak demand vs CMD, or review closure status for this billing cycle. Try a quick prompt or ask a follow-up.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function fixtureAnalystReplyRich(
  envelope: AnalystContextEnvelope,
  question: string,
): import("./analyst-context").AnalystMessage {
  const kind = matchQuestion(question);
  let content: string;

  switch (kind) {
    case "alarms":
      content = alarmSummaryReply(envelope);
      break;
    case "rx":
      content = prescriptionReply(envelope);
      break;
    case "demand":
      content = demandReply(envelope);
      break;
    case "closure":
      content = closureReply(envelope);
      break;
    case "why_critical":
      content = whyCriticalReply(envelope);
      break;
    case "evidence":
      content = evidenceReply(envelope);
      break;
    default:
      content = defaultReply(envelope, question);
  }

  const focus = envelope.focusEntity;
  const plantAlarms = alarmsForPlant(envelope.plantId);
  const citations: AnalystCitation[] = [
    {
      id: "cite_plant",
      title: `${plantNameOf(envelope)} · plant context`,
      snippet: envelope.screenTitle,
      path: "H",
    },
    {
      id: "cite_l2",
      title: "Meter readings · 7-day window",
      snippet: envelope.visibleSummary[0] ?? "telemetry baseline",
      path: "W",
    },
  ];

  if (focus?.type === "alarm") {
    citations.push({
      id: `cite_${focus.id}`,
      title: `Alarm · ${plantAlarms.find((a) => a.id === focus.id)?.assetLabel ?? "Active alarm"}`,
      snippet: plantAlarms.find((a) => a.id === focus.id)?.summary,
      path: "H",
    });
  }
  if (focus?.type === "prescription") {
    const rx = findPrescription(focus.id);
    citations.push({
      id: `cite_${focus.id}`,
      title: rx?.title ?? focus.id,
      snippet: rx ? fmtInr(rx.impactInrPerMonth) + "/mo" : undefined,
      path: "H",
    });
  }

  return {
    id: `msg_${Date.now()}`,
    role: "assistant",
    content,
    citations,
  };
}

/** Plant snapshot stats for the analyst sidebar. */
export function analystPlantSnapshot(plantId: string = DEMO_PLANT.plantId) {
  const plant = plantForId(plantId);
  const open = openAlarms(plantId);
  const catalog = prescriptionsForPlant(plantId);
  const needsReview = catalog.filter((p) => p.lane === "needs_review");
  const closed = catalog.filter((p) => p.lane === "closed").length;
  const closurePct =
    catalog.length === 0 ? 0 : Math.round((closed / catalog.length) * 100);

  return {
    plantName: plant.plantName,
    criticalAlarms: open.filter((a) => a.severity === "critical").length,
    openAlarms: open.length,
    needsReview: needsReview.length,
    needsReviewInr: needsReview.reduce((s, p) => s + p.impactInrPerMonth, 0),
    peakMdKva: energyKpisFixture.peakMdKva,
    cmdKva: energyKpisFixture.cmdKva,
    headroomPct:
      ((energyKpisFixture.cmdKva - energyKpisFixture.peakMdKva) /
        energyKpisFixture.cmdKva) *
      100,
    closurePct,
  };
}
