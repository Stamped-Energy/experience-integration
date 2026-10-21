/** Shared helpers for the Quality area: sub-navigation, crumbs and lot lookups. */
import * as D from "@/lib/demo/data";
import type { Lot } from "@/lib/demo/types";
import type { Crumb } from "@/components/shell/Shell";
import { Tabs, Tag, type Tone } from "@/components/ui/primitives";

export type QualityTab = "lots" | "drift" | "investigations" | "links" | "specs" | "corrections";

export const belowThreshold = () => D.lotLinks.filter((l) => l.status === "suggested" && l.link_confidence < threshold(l.lotId));
export const threshold = (lotId: string) => {
  const lot = D.byId.lot(lotId)!;
  return D.linePacks.find((p) => p.id === D.byId.line(lot.lineIds[0])!.linePackId)!.linkThreshold;
};

export function QualityTabs({ active }: { active: QualityTab }) {
  const items = [
    { key: "lots", href: "/quality", label: "Lots at risk", count: D.lots.filter((l) => l.riskWord === "At risk").length },
    { key: "drift", href: "/quality/drift", label: "Drift", count: D.driftSignals.length },
    { key: "investigations", href: "/quality/investigations", label: "Investigations", count: D.investigations.filter((i) => i.status === "open").length },
    { key: "links", href: "/quality/links", label: "Link confirmations", count: belowThreshold().length },
    { key: "specs", href: "/quality/specs", label: "Specs and grades" },
    { key: "corrections", href: "/quality/corrections", label: "Corrections to process", count: D.corrections.filter((c) => c.status === "sent").length },
  ];
  return <Tabs label="Quality" items={items.map((i) => ({ ...i, active: i.key === active }))} />;
}

export const crumbs = (...rest: Crumb[]): Crumb[] => [{ label: "Demonstration plant", href: "/" }, { label: "Quality", href: "/quality" }, ...rest];

export const gradeOf = (lot: Lot) => D.grades.find((g) => g.id === lot.gradeId)!;
export const specOf = (lot: Lot) => D.specs.find((s) => s.gradeId === lot.gradeId)!;
export const propOf = (lot: Lot) => D.lotProperties.find((p) => p.lotId === lot.id)!;
export const linksOf = (lot: Lot) => D.lotLinks.filter((l) => l.lotId === lot.id);
export const labOf = (lot: Lot) => D.labResults.find((r) => r.lotId === lot.id);
export const lotNo = (id: string) => id.split("-").pop();
const JOIN_ORDER = ["unverified", "estimated", "verified"] as const;
/** Anything resting on links carries the weakest join label among them (lot-join.md, evidence.md). */
export const weakestJoin = (lot: Lot) => linksOf(lot).map((l) => l.label).sort((a, b) => JOIN_ORDER.indexOf(a) - JOIN_ORDER.indexOf(b))[0] ?? "unverified";
export const proofForLot = (lot: Lot) => D.proofRecords.find((p) => p.objectType === "lot" && p.objectId === lot.id) ?? D.proofRecords.find((p) => p.id === D.investigations.find((i) => i.lotIds.includes(lot.id))?.proofRecordId);

/** Three or four plain sentences on why this lot carries its risk word. Uses only figures already on the lot. */
export function whyRisk(lot: Lot): string[] {
  const prop = propOf(lot);
  const spec = specOf(lot);
  const { low, point, high } = prop.predicted;
  const name = prop.name.toLowerCase();
  const over = high > spec.usl;
  const under = low < spec.lsl;
  const lines = [
    over && under
      ? `The estimated ${name} band is ${low} to ${high} ${prop.unit}, and it crosses both spec limits, ${spec.lsl} to ${spec.usl}.`
      : over
        ? `The estimated ${name} is ${point} ${prop.unit}, with a band of ${low} to ${high}. Spec stops at ${spec.usl} ${prop.unit}, so the high end is already past the limit.`
        : under
          ? `The estimated ${name} is ${point} ${prop.unit}, with a band of ${low} to ${high}. Spec starts at ${spec.lsl} ${prop.unit}, so the low end is already under the limit.`
          : `The estimated ${name} is ${point} ${prop.unit}, inside the spec of ${spec.lsl} to ${spec.usl} ${prop.unit}.`,
  ];
  const drift = D.driftSignals.find((d) => d.lineId === lot.lineIds[0] && d.property === prop.name);
  if (drift) lines.push(`${drift.property} on ${D.byId.line(drift.lineId)!.short} has been ${drift.direction === "up" ? "rising" : "falling"}, measured ${drift.magnitude}.`);
  const lab = labOf(lot);
  lines.push(prop.anchored && lab
    ? `The lab measured ${lab.value} ${prop.unit}, so this band is anchored to a result.`
    : "No lab result has come in yet, so this is an estimate from the linked runs and cannot support a release.");
  const note = D.investigations.find((i) => i.lotIds.includes(lot.id))?.entries.find((e) => e.type === "note");
  if (note) {
    const text = note.text.replace(/\.$/, "");
    lines.push(text.includes("torque") && text.includes("charge mass")
      ? "Torque at the end of the hold was high on the linked batches, and the charge mass stayed inside the recipe."
      : `${text}.`);
  }
  return lines;
}

const RISK_TONE: Record<Lot["riskWord"], Tone> = { "At risk": "critical", Watch: "warning", "On track": "neutral" };
export function RiskTag({ risk }: { risk: Lot["riskWord"] }) {
  return <Tag tone={RISK_TONE[risk]} dot>{risk}</Tag>;
}
export function JoinTag({ label }: { label: "verified" | "estimated" | "unverified" }) {
  return <Tag tone={label === "unverified" ? "warning" : label === "verified" ? "success" : "neutral"} title="Join label">{label}</Tag>;
}
