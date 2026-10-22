import Link from "next/link";
import { nameOf } from "@/lib/names";
import { notFound } from "next/navigation";
import * as D from "@/lib/demo/data";
import { demoRole } from "@/lib/role";
import { dayMonth, hhmm } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { RunChart } from "@/components/ui/charts";
import { DataTable, LineModeTag, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { InboxCard } from "@/components/inbox/InboxCard";
import { lineSeries, proofHref } from "@/components/home/blocks";
import { inboxIds } from "@/lib/static-paths";

export function generateStaticParams() {
  return inboxIds();
}

export default async function CardDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = D.byId.inbox(id);
  if (!item) notFound();
  const role = demoRole();
  const p = item.kind === "proposal" ? D.byId.proposal(item.ref) : undefined;
  const lineId = p?.lineId ?? D.byId.trial(item.ref)?.lineId ?? D.byId.correction(item.ref)?.toLineId ?? (D.byId.link(item.ref) ? D.byId.lot(D.byId.link(item.ref)!.lotId)!.lineIds[0] : "line-a");
  const line = D.byId.line(lineId)!;
  const s = lineSeries(line);
  const audit = D.auditEvents.filter((a) => a.objectId === item.ref).slice(0, 5);
  const proof = D.proofRecords.find((r) => r.objectId === D.trials.find((t) => t.lineId === lineId)?.id);
  return (
    <Workspace crumbs={[{ label: "Demonstration plant", href: "/" }, { label: "Inbox", href: "/inbox" }, { label: line.short, href: `/process?line=${line.id}` }, { label: p ? D.byId.asset(p.assetId)!.name : item.title }]} askContext={item.title}>
      <PageHeader eyebrow={`Inbox · ${nameOf(item.ref)}`} title={item.title} actions={<><Link className="btn btn-sm btn-quiet" href="/inbox">Back to Inbox</Link><AskButton context={item.ref} label="Ask about this card" /></>} />
      <div className="grid">
        <div className="span-8 stack">
          <InboxCard item={item} role={role} link={false} />
          <Section title={`Signed limits on ${line.short}`} meta="Stamped works inside limits set beforehand. It may narrow, never widen." flush>
            <DataTable caption="Signed limits" rowKey={(w) => w.id} rows={D.signedWindows.filter((w) => w.lineId === line.id)} columns={[
              { key: "n", label: "Setting", render: (w) => <span style={{ fontWeight: 500 }}>{w.name}</span> },
              { key: "s", label: "Signed", align: "right", render: (w) => `${w.low} to ${w.high} ${w.unit}` },
              { key: "r", label: "Stamped narrowing", align: "right", render: (w) => (w.narrowedLow !== undefined ? `${w.narrowedLow} to ${w.narrowedHigh} ${w.unit}` : "None") },
              { key: "b", label: "Signed by", render: (w) => `${w.signedBy} · ${dayMonth(w.signedAt)}` },
              { key: "v", label: "Version", mono: true, render: (w) => `v${w.version} · ${w.manifestRef}` },
              { key: "e", label: "Expires", render: (w) => dayMonth(w.expiresAt) },
            ]} />
          </Section>
        </div>
        <div className="span-4 stack">
          <Section title={line.name} actions={<LineModeTag mode={line.mode} />}>
            <div className="label">{s.name}, last 24 runs</div>
            <RunChart values={s.values} spec={line.type === "batch" ? s.spec : undefined} width={360} height={96} label={`${s.name} on ${line.short}`} />
            <div className="secondary" style={{ fontSize: 12, marginTop: 4 }}>{line.product} · {line.status}</div>
          </Section>
          {p ? (
            <Section title="History" flush>
              <div className="rows">
                <div className="row" style={{ gridTemplateColumns: "90px minmax(0,1fr)" }}><span className="mono muted">{dayMonth(p.createdAt)} {hhmm(p.createdAt)}</span><span>Proposed by optimiser {p.optimiserVersion}</span></div>
                {p.decidedAt ? <div className="row" style={{ gridTemplateColumns: "90px minmax(0,1fr)" }}><span className="mono muted">{dayMonth(p.decidedAt)} {hhmm(p.decidedAt)}</span><span>{p.state === "Declined" ? "Declined" : "Decided"} by {p.decidedBy}</span></div> : null}
                {audit.map((a) => <div key={a.id} className="row" style={{ gridTemplateColumns: "90px minmax(0,1fr)" }}><span className="mono muted">{dayMonth(a.at)} {hhmm(a.at)}</span><span>{a.action} · {D.byId.person(a.personId)!.display}</span></div>)}
              </div>
            </Section>
          ) : null}
          {proof ? (
            <Section title="Evidence on demand" meta="Opens in Process">
              <div className="stack-sm" style={{ fontSize: 13 }}>
                <span>{proof.title}</span>
                <span style={{ display: "flex", gap: 6 }}><Tag>{proof.verdict}</Tag><Tag>{proof.rung}</Tag></span>
                <Link className="link" href={proofHref(proof.id)}>Open the four questions</Link>
              </div>
            </Section>
          ) : null}
        </div>
      </div>
    </Workspace>
  );
}
