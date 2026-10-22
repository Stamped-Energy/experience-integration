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

export const metadata = { title: "Link confirmations" };
export default async function Links() {
  const role = await currentRole();
  const weak = belowThreshold();
  const all = D.lotLinks.slice().sort((a, b) => a.link_confidence - b.link_confidence);
  const allowed = can(role, "confirm-lot-link");
  return (
    <Workspace crumbs={crumbs({ label: "Link confirmations" })} askContext="Lot link confirmations">
      <PageHeader eyebrow="Quality" title="Link confirmations" meta="Links below the pack threshold wait for a person. Until confirmed, anything resting on them stays unverified." actions={<AskButton context="Link confirmations" label="Ask about links" />} />
      <QualityTabs active="links" />
      <div className="grid">
        <div className="span-7 stack">
          {weak.map((l) => {
            const lot = D.byId.lot(l.lotId)!;
            const thr = threshold(l.lotId);
            return (
              <Section key={l.id} title={`Lot ${lotNo(lot.id)} to ${runLabel(D.runs.find((r) => r.id === l.runId)!)}`} meta={`${gradeOf(lot).name} · ${l.candidates.length} candidate runs`} actions={<><Link className="link" href={`/quality/lots/${lot.id}`}>Lot detail</Link><RiskTag risk={lot.riskWord} /></>}>
                <Confidence kind="link" label={l.label} score={l.link_confidence} threshold={thr} status={l.status} drivers={["time proximity", "recipe match", "sequence", "scanned id"]} method="Weights fitted on a verification sample" />
                <div className="parts" style={{ margin: "8px 0" }}>
                  <span>Time<b>{l.parts.timeProximity}</b></span><span>Recipe<b>{l.parts.recipeMatch}</b></span><span>Sequence<b>{l.parts.sequenceConsistency}</b></span><span>Scanned id<b>{l.parts.scannedIdAgreement}</b></span><span>Penalty<b>{l.parts.multiCandidatePenalty}</b></span>
                </div>
                <div className="cand">{l.candidates.slice(0, 2).map((c) => { const r = D.runs.find((x) => x.id === c); return <div key={c}><span className="label">Candidate</span><div style={{ fontWeight: 600, fontSize: 13 }}>{r ? runLabel(r) : c}</div>{r ? <span className="cell-sub">ended {dayMonth(r.end)} {hhmm(r.end)}</span> : null}</div>; })}</div>
                <CardActions actions={[
                  { id: "ok", label: "Confirm link", primary: true, allowed, reason: deniedReason("confirm-lot-link", "confirm links"), done: "Link confirmed." },
                  { id: "other", label: "Pick the other run", allowed, reason: deniedReason("confirm-lot-link", "confirm links"), done: "Link moved." },
                  { id: "no", label: "Reject", allowed, reason: deniedReason("confirm-lot-link", "confirm links"), done: "Link rejected." },
                ]} />
              </Section>
            );
          })}
        </div>
        <div className="span-5 stack ctx">
          <Section title="All links" meta={`${D.lotLinks.length} links · lowest first`} flush>
            <DataTable caption="Links" rowKey={(l) => l.id} rows={all.slice(0, 27)} columns={[
              { key: "l", label: "Lot", mono: true, render: (l) => <Link className="link" href={`/quality/lots/${l.lotId}`}>{lotNo(l.lotId)}</Link> },
              { key: "r", label: "Run", render: (l) => runLabel(D.runs.find((r) => r.id === l.runId)!) },
              { key: "c", label: "Confidence", align: "right", mono: true, render: (l) => l.link_confidence.toFixed(2) },
              { key: "j", label: "Label", render: (l) => <JoinTag label={l.label} /> },
              { key: "s", label: "Status", render: (l) => l.status },
            ]} />
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
