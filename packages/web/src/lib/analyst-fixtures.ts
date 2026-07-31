import {
  alarmsFixture,
  DEMO_PLANT,
  demoClosurePct,
  demoCriticalAlarmCount,
  demoNeedsReviewCount,
  demoNeedsReviewInr,
  energyKpisFixture,
  prescriptionsFixture,
} from "@/fixtures/demo";
import type { AnalystContextEnvelope } from "@/lib/types";
import type { AnalystCitation } from "./analyst-context";

function openAlarms() {
  return alarmsFixture.filter((a) => a.state !== "cleared");
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
  const open = openAlarms();
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
      ? `\n\n**Priority focus:** Kiln 1 is linked to stagger co-start (${fmtInr(84000)}/mo). Ack before shift handoff.`
      : "";

  return [
    `**${DEMO_PLANT.plantName} - ${open.length} open alarms** (${critical.length} critical, ${warning.length} warning, ${open.length - critical.length - warning.length} info).`,
    "",
    lines,
    focusNote,
    "",
    "**Recommended next steps:**",
    "1. Ack Kiln 1 MD coincidence and review incomer headroom.",
    "2. Assign APFC health check on Cement Mill 1.",
    "3. Open evidence for any alarm before closing - cite sources in your notes.",
  ]
    .filter(Boolean)
    .join("\n");
}

function prescriptionReply(): string {
  const top = prescriptionsFixture
    .filter((p) => p.lane === "needs_review" || p.lane === "active")
    .sort((a, b) => b.impactInrPerMonth * b.confidence - a.impactInrPerMonth * a.confidence)[0]!;

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

function demandReply(): string {
  const headroom =
    ((energyKpisFixture.cmdKva - energyKpisFixture.peakMdKva) /
      energyKpisFixture.cmdKva) *
    100;
  return [
    `**Peak demand last 7 days - ${DEMO_PLANT.plantName}**`,
    "",
    `• **Rolling peak MD:** ${energyKpisFixture.peakMdKva.toLocaleString("en-IN")} kVA vs **CMD ${energyKpisFixture.cmdKva.toLocaleString("en-IN")} kVA** (${headroom.toFixed(1)}% headroom)`,
    `• **Primary driver:** Kiln 1 + Raw Mill 2 co-start into **10–11 TOD peak** (Jul 21 09:40 IST)`,
    `• **Vs baseline (7d):** +${energyKpisFixture.vsBaselinePct}% grid kWh - pyro + grinding overlap`,
    `• **Peak TOD share:** ${energyKpisFixture.todPeakSharePct}% of MTD energy cost`,
    "",
    "**What to do:** Stagger large-load starts by 10 min to recover ~₹84k/mo MD risk. Monitor incomer rolling MD - alert at <5% headroom.",
  ].join("\n");
}

function closureReply(): string {
  const closed = prescriptionsFixture.filter((p) => p.lane === "closed").length;
  const verifying = prescriptionsFixture.filter((p) => p.lane === "verifying").length;
  const needsReview = demoNeedsReviewCount();
  const closure = demoClosurePct();

  return [
    `**Prescription closure - Jul 2026 billing window**`,
    "",
    `• **Closure rate (30d):** ${closure}% (${closed}/${prescriptionsFixture.length} closed)`,
    `• **Needs review:** ${needsReview} prescriptions · **${fmtInr(demoNeedsReviewInr())}/mo** addressable`,
    `• **Verifying:** ${verifying} prescriptions awaiting savings verification`,
    `• **Confirmed savings (MTD):** HVAC setback + APFC stage swap`,
    "",
    "**Bottleneck:** Kiln MD and compressor sequencing prescriptions still in needs review - assign owners this week to protect the billing cycle.",
  ].join("\n");
}

function whyCriticalReply(envelope: AnalystContextEnvelope): string {
  const id = envelope.focusEntity?.id ?? "alm_1001";
  const alarm = alarmsFixture.find((a) => a.id === id);
  if (!alarm) {
    return `Focus alarm not found - open the alarm console for live state. Cross-check evidence before ack.`;
  }
  return [
    `**${alarm.assetLabel} is ${alarm.severity}** - state: ${alarm.state}.`,
    "",
    alarm.summary,
    "",
    alarm.relatedPrescriptionId
      ? `Linked prescription **Stagger co-start** - highest-confidence ops action on this screen.`
      : "No linked prescription yet - review similar assets for patterns.",
    "",
    "Open **Evidence** for the Jul 21 signal window before acknowledging.",
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
    `Analyzing **${DEMO_PLANT.plantName}**.`,
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
      content = prescriptionReply();
      break;
    case "demand":
      content = demandReply();
      break;
    case "closure":
      content = closureReply();
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
  const citations: AnalystCitation[] = [
    {
      id: "cite_plant",
      title: `${DEMO_PLANT.plantName} · plant context`,
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
      title: `Alarm · ${alarmsFixture.find((a) => a.id === focus.id)?.assetLabel ?? "Active alarm"}`,
      snippet: alarmsFixture.find((a) => a.id === focus.id)?.summary,
      path: "H",
    });
  }
  if (focus?.type === "prescription") {
    const rx = prescriptionsFixture.find((p) => p.id === focus.id);
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
export function analystPlantSnapshot() {
  return {
    plantName: DEMO_PLANT.plantName,
    criticalAlarms: demoCriticalAlarmCount(),
    openAlarms: openAlarms().length,
    needsReview: demoNeedsReviewCount(),
    needsReviewInr: demoNeedsReviewInr(),
    peakMdKva: energyKpisFixture.peakMdKva,
    cmdKva: energyKpisFixture.cmdKva,
    headroomPct:
      ((energyKpisFixture.cmdKva - energyKpisFixture.peakMdKva) /
        energyKpisFixture.cmdKva) *
      100,
    closurePct: demoClosurePct(),
  };
}
