import { QualityHubTabs } from "@/components/quality/QualityHubTabs";
import Link from "next/link";
import * as D from "@/lib/demo/data";
import { demoRole } from "@/lib/role";
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
import { JoinTag, RiskTag, crumbs, gradeOf, lotNo, propOf, qualityEyebrow, specOf, weakestJoin } from "@/components/quality/common";
import { capaCases } from "@/lib/demo/capabilityScreens";

export const metadata = { title: "Investigations and 8D" };

function capaForInvestigation(lotIds: string[]) {
  return capaCases.find((c) => c.lotIds.some((id) => lotIds.includes(id)));
}

export default async function Investigations() {
  const matched = new Set<string>();
  return (
    <Workspace crumbs={crumbs({ label: "Investigations and 8D" })} askContext="Quality investigations">
      <PageHeader eyebrow={qualityEyebrow("/quality/investigations")} title="Investigations and 8D" meta="Case file per question: lots, runs, evidence, conclusion, and 8D step when linked." actions={<AskButton context="Investigations" label="Ask about investigations" />} />
      <QualityHubTabs />
      <div className="grid">
        {D.investigations.map((i) => {
          const proof = D.proofRecords.find((p) => p.id === i.proofRecordId);
          const capa = capaForInvestigation(i.lotIds);
          if (capa) matched.add(capa.id);
          return (
            <div key={i.id} className="span-6 stack">
              <Section title={i.title} meta={`${i.openedBy} · ${i.entries.length} entries`} actions={<><Link className="link" href={`/quality/investigations/${i.id}`}>Open case</Link><Tag tone={i.status === "open" ? "info" : "neutral"} dot>{i.status}</Tag></>}>
                <dl className="facts-grid">
                  <dt>Lots</dt><dd>{i.lotIds.map((l) => <Link key={l} className="link" href={`/quality/lots/${l}`} style={{ marginRight: 8 }}>{lotNo(l)}</Link>)}</dd>
                  <dt>Runs</dt><dd>{i.runIds.map((r) => <Link key={r} className="link" href={`/process/runs/${r}`} style={{ marginRight: 8 }}>{runLabel(D.runs.find((x) => x.id === r)!)}</Link>)}</dd>
                  <dt>Conclusion</dt><dd>{i.conclusion ?? "Not yet"}</dd>
                  <dt>Proof</dt><dd>{proof ? <><VerdictTag verdict={proof.verdict} /> <Link className="link" href={`/quality/investigations/${i.id}?evidence=${proof.id}`}>Evidence</Link></> : "None"}</dd>
                  {capa ? (
                    <>
                      <dt>8D step</dt>
                      <dd>
                        Step {capa.dStep} of 8 · {capa.status} · {capa.owner}
                      </dd>
                    </>
                  ) : null}
                </dl>
                <ul className="tl" style={{ marginTop: 8 }}>{i.entries.map((e) => <li key={e.at}><span className="t">{dayMonth(e.at)}</span><span className={`k ${e.type === "conclusion" ? "a" : "s"}`} /><span>{e.text}</span><span><EvidenceTag label={e.label} /></span></li>)}</ul>
              </Section>
            </div>
          );
        })}
        {capaCases.filter((c) => !matched.has(c.id)).map((c) => (
          <div key={c.id} className="span-6 stack">
            <Section title={c.title} meta={`8D only · ${c.owner}`} actions={<Tag tone={c.status === "open" ? "warning" : c.status === "waiting" ? "info" : "success"}>{c.status}</Tag>}>
              <dl className="facts-grid">
                <dt>8D step</dt><dd>Step {c.dStep} of 8</dd>
                <dt>Lots</dt>
                <dd>
                  {c.lotIds.length
                    ? c.lotIds.map((l) => (
                        <Link key={l} className="link" href={`/quality/lots/${l}`} style={{ marginRight: 8 }}>
                          {lotNo(l)}
                        </Link>
                      ))
                    : "None linked"}
                </dd>
                <dt>Due</dt><dd>{c.due}</dd>
              </dl>
            </Section>
          </div>
        ))}
        <div className="span-12">
          <Section title="Lots that may need a case" meta="At risk and not yet in an investigation" flush>
            <DataTable caption="Candidates" rowKey={(l) => l.id} rows={D.lots.filter((l) => l.riskWord !== "On track" && !D.investigations.some((i) => i.lotIds.includes(l.id)))} columns={[
              { key: "l", label: "Lot", render: (l) => <Link className="link" href={`/quality/lots/${l.id}`}>{lotNo(l.id)}</Link> },
              { key: "g", label: "Grade", render: (l) => gradeOf(l).name },
              { key: "r", label: "Risk", render: (l) => <RiskTag risk={l.riskWord} /> },
              { key: "p", label: "Predicted", align: "right", render: (l) => `${propOf(l).predicted.point} ${propOf(l).unit}` },
              { key: "s", label: "Spec", align: "right", render: (l) => `${specOf(l).lsl} to ${specOf(l).usl}` },
              { key: "j", label: "Join", render: (l) => <JoinTag label={weakestJoin(l)} /> },
              { key: "st", label: "Status", render: (l) => l.status },
            ]} />
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
