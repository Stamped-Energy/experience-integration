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

export const metadata = { title: "Investigations" };
export default async function Investigations() {
  return (
    <Workspace crumbs={crumbs({ label: "Investigations" })} askContext="Quality investigations">
      <PageHeader eyebrow="Quality" title="Investigations" meta="A case file per question: lots, linked runs, evidence and a conclusion that ends in a proof record." actions={<AskButton context="Investigations" label="Ask about investigations" />} />
      <QualityTabs active="investigations" />
      <div className="grid">
        {D.investigations.map((i) => {
          const proof = D.proofRecords.find((p) => p.id === i.proofRecordId);
          return (
            <div key={i.id} className="span-6 stack">
              <Section title={i.title} meta={`${i.openedBy} · ${i.entries.length} entries`} actions={<><Link className="link" href={`/quality/investigations/${i.id}`}>Open case</Link><Tag tone={i.status === "open" ? "info" : "neutral"} dot>{i.status}</Tag></>}>
                <dl className="facts-grid">
                  <dt>Lots</dt><dd>{i.lotIds.map((l) => <Link key={l} className="link mono" href={`/quality/lots/${l}`} style={{ marginRight: 8 }}>{lotNo(l)}</Link>)}</dd>
                  <dt>Runs</dt><dd>{i.runIds.map((r) => <Link key={r} className="link" href={`/process/runs/${r}`} style={{ marginRight: 8 }}>{runLabel(D.runs.find((x) => x.id === r)!)}</Link>)}</dd>
                  <dt>Conclusion</dt><dd>{i.conclusion ?? "Not yet"}</dd>
                  <dt>Proof</dt><dd>{proof ? <><VerdictTag verdict={proof.verdict} /> <Link className="link" href={`/quality/investigations/${i.id}?evidence=${proof.id}`}>Evidence</Link></> : "None"}</dd>
                </dl>
                <ul className="tl" style={{ marginTop: 8 }}>{i.entries.map((e) => <li key={e.at}><span className="t">{dayMonth(e.at)}</span><span className={`k ${e.type === "conclusion" ? "a" : "s"}`} /><span>{e.text}</span><span><EvidenceTag label={e.label} /></span></li>)}</ul>
              </Section>
            </div>
          );
        })}
        <div className="span-12">
          <Section title="Lots that may need a case" meta="At risk and not yet in an investigation" flush>
            <DataTable caption="Candidates" rowKey={(l) => l.id} rows={D.lots.filter((l) => l.riskWord !== "On track" && !D.investigations.some((i) => i.lotIds.includes(l.id)))} columns={[
              { key: "l", label: "Lot", mono: true, render: (l) => <Link className="link" href={`/quality/lots/${l.id}`}>{lotNo(l.id)}</Link> },
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
