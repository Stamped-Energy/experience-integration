import Link from "next/link";
import * as D from "@/lib/demo/data";
import { currentRole } from "@/lib/role";
import { can } from "@/lib/rbac";
import { dayMonth, hhmm, rel } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { CardActions } from "@/components/cards/CardActions";
import { deniedReason } from "@/components/cards/DecisionCard";
import { Confidence } from "@/components/ui/Confidence";
import { RunChart } from "@/components/ui/charts";
import { DataTable, EvidenceIds, EvidenceTag, Illustrative, PageHeader, Section, Tag, VerdictTag } from "@/components/ui/primitives";
import { EvidenceSheet } from "@/components/evidence/EvidenceSheet";
import { runLabel } from "@/components/process/common";
import { JoinTag, QualityTabs, RiskTag, crumbs, gradeOf, linksOf, lotNo, propOf, specOf, threshold, weakestJoin, belowThreshold } from "@/components/quality/common";

export const metadata = { title: "Specs and grades" };
export default async function Specs() {
  return (
    <Workspace crumbs={crumbs({ label: "Specs and grades" })} askContext="Specs and grades">
      <PageHeader eyebrow="Quality" title="Specs and grades" meta="Read from the plant's spec documents. Stamped reads specs; it does not change them." actions={<AskButton context="Specs" label="Ask about specs" />} />
      <QualityTabs active="specs" />
      <div className="grid">
        {D.specs.map((s) => {
          const g = D.grades.find((x) => x.id === s.gradeId)!;
          const lots = D.lots.filter((l) => l.gradeId === g.id).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
          const v = lots.map((l) => propOf(l).predicted.point);
          return (
            <div key={s.gradeId} className="span-6 stack">
              <Section title={g.name} meta={`${D.byId.line(g.lineId)!.name} · ${s.sourceDoc} v${s.version}`} actions={<Illustrative />} flush>
                <div style={{ padding: 16 }} className="stack-sm">
                  <div className="stat-row"><div className="stat"><div className="label">{s.property} low</div><div className="v">{s.lsl}</div></div><div className="stat"><div className="label">Target</div><div className="v">{s.target}</div></div><div className="stat"><div className="label">High</div><div className="v">{s.usl}</div></div><div className="stat"><div className="label">Lots</div><div className="v">{lots.length}</div></div><div className="stat"><div className="label">At risk</div><div className="v">{lots.filter((l) => l.riskWord === "At risk").length}</div></div></div>
                  <RunChart values={v.length ? v : [s.target]} spec={[s.lsl, s.usl]} width={620} height={130} label={`${s.property} per lot, ${s.unit}`} />
                  <span className="cell-sub">Predicted {s.property.toLowerCase()} per lot, {s.unit}; dashed lines are spec limits</span>
                </div>
              </Section>
            </div>
          );
        })}
      </div>
    </Workspace>
  );
}
