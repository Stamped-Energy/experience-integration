/** Shared helpers for the Quality area: sub-navigation, crumbs, lot lookups and the fixed "no release here" line. */
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

const RISK_TONE: Record<Lot["riskWord"], Tone> = { "At risk": "critical", Watch: "warning", "On track": "neutral" };
export function RiskTag({ risk }: { risk: Lot["riskWord"] }) {
  return <Tag tone={RISK_TONE[risk]} dot>{risk}</Tag>;
}
export function JoinTag({ label }: { label: "verified" | "estimated" | "unverified" }) {
  return <Tag tone={label === "unverified" ? "warning" : label === "verified" ? "success" : "neutral"} title="Join label">{label}</Tag>;
}

export function NoReleaseLine() {
  return <div className="no-release" role="note">Holds and releases happen in your quality system. Stamped watches lots and recommends; it never releases a hold.</div>;
}
