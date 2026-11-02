import { QualityHubTabs } from "@/components/quality/QualityHubTabs";
import * as D from "@/lib/demo/data";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { RunChart } from "@/components/ui/charts";
import { PageHeader, Section } from "@/components/ui/primitives";
import { crumbs, propOf, qualityEyebrow } from "@/components/quality/common";

export const metadata = { title: "Specs and grades" };
export default async function Specs() {
  return (
    <Workspace crumbs={crumbs({ label: "Specs and grades" })} askContext="Specs and grades">
      <PageHeader eyebrow={qualityEyebrow("/quality/specs")} title="Specs and grades" meta="Read from the plant's spec documents. Stamped does not change them." actions={<AskButton context="Specs" label="Ask about specs" />} />
      <QualityHubTabs />
      <div className="grid">
        {D.specs.map((s) => {
          const g = D.grades.find((x) => x.id === s.gradeId)!;
          const lots = D.lots.filter((l) => l.gradeId === g.id).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
          const v = lots.map((l) => propOf(l).predicted.point);
          return (
            <div key={s.gradeId} className="span-6 stack">
              <Section title={g.name} meta={`${D.byId.line(g.lineId)!.name} · ${s.sourceDoc} v${s.version}`} flush>
                <div className="section-pad stack-sm">
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
