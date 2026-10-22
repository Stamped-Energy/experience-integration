import Link from "next/link";
import { nameOf } from "@/lib/names";
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

export const metadata = { title: "Corrections to process" };
export default async function Corrections() {
  const role = await currentRole();
  return (
    <Workspace crumbs={crumbs({ label: "Corrections to process" })} askContext="Corrections to process">
      <PageHeader eyebrow="Quality" title="Corrections to process" meta="Quality asks; Process decides. A correction becomes a proposal on the line and goes through the same limits and approvals." actions={<AskButton context="Corrections" label="Ask about corrections" />} />
      <QualityTabs active="corrections" />
      <div className="grid">
        {D.corrections.map((c) => {
          const lot = D.byId.lot(c.lotId)!;
          const w = D.byId.window(c.toLineId, c.param);
          return (
            <div key={c.id} className="span-4 stack">
              <Section title={`${c.direction === "raise" ? "Raise" : "Lower"} ${w?.name.toLowerCase() ?? c.param}`} meta={`${D.byId.line(c.toLineId)!.name} · lot ${lotNo(lot.id)}`} actions={<Tag tone={c.status === "accepted" ? "success" : c.status === "sent" ? "accent" : "neutral"} dot>{c.status}</Tag>}>
                <p style={{ margin: "0 0 8px", fontSize: 14 }}>{c.reason}</p>
                <dl className="facts-grid">
                  <dt>Expected</dt><dd>{c.estimate.low} to {c.estimate.high} {c.estimate.unit} <EvidenceTag label={c.label} /></dd>
                  <dt>Sent by</dt><dd>{c.sentBy}</dd>
                  <dt>Lot</dt><dd><Link className="link mono" href={`/quality/lots/${lot.id}`}>{lotNo(lot.id)}</Link> <RiskTag risk={lot.riskWord} /></dd>
                  <dt>Proposal</dt><dd>{c.proposalId ? <Link className="link" href={`/process/proposals/${c.proposalId}`}>{nameOf(c.proposalId)}</Link> : "None, declined by Process"}</dd>
                </dl>
                {c.status === "sent" ? <CardActions actions={[
                  { id: "a", label: "Accept in Process", primary: true, allowed: can(role, "accept-correction"), reason: deniedReason("accept-correction", "accept corrections"), done: "Accepted; the proposal goes through limits and approvals." },
                  { id: "d", label: "Decline", allowed: can(role, "accept-correction"), reason: deniedReason("accept-correction", "accept corrections"), done: "Declined with reason." },
                ]} /> : null}
              </Section>
            </div>
          );
        })}
        <div className="span-12">
          <Section title="Lots without a correction" meta="At risk or watched; a correction is a recommendation, never a write" flush>
            <DataTable caption="Lots" rowKey={(l) => l.id} rows={D.lots.filter((l) => l.riskWord !== "On track" && !D.corrections.some((c) => c.lotId === l.id))} columns={[
              { key: "l", label: "Lot", mono: true, render: (l) => <Link className="link" href={`/quality/lots/${l.id}`}>{lotNo(l.id)}</Link> },
              { key: "g", label: "Grade", render: (l) => gradeOf(l).name },
              { key: "r", label: "Risk", render: (l) => <RiskTag risk={l.riskWord} /> },
              { key: "p", label: "Predicted", align: "right", render: (l) => `${propOf(l).predicted.point} ${propOf(l).unit}` },
              { key: "s", label: "Spec", align: "right", render: (l) => `${specOf(l).lsl} to ${specOf(l).usl}` },
              { key: "j", label: "Join", render: (l) => <JoinTag label={weakestJoin(l)} /> },
            ]} />
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
