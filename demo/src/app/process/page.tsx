import Link from "next/link";
import { redirect } from "next/navigation";
import * as D from "@/lib/demo/data";
import { currentRole } from "@/lib/role";
import { dayMonth, hhmm, rel } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DecisionCard } from "@/components/cards/DecisionCard";
import { Sparkline } from "@/components/ui/charts";
import { LimitsBand } from "@/components/ui/LimitsBand";
import { DataTable, EvidenceTag, LineModeTag, ModeTag, PageHeader, Section, Tag, VerdictTag } from "@/components/ui/primitives";
import { ExampleActions } from "@/components/cards/ExampleActions";
import { EvidenceSheet } from "@/components/evidence/EvidenceSheet";
import { ProcessTabs, crumbs, outcome, outcomeName, packOf, proofForRun, runLabel, runsOf, specOf } from "@/components/process/common";

export const metadata = { title: "Process" };

export default async function ProcessLines({ searchParams }: { searchParams: Promise<{ line?: string; evidence?: string }> }) {
  const sp = await searchParams;
  if (sp.line && D.byId.line(sp.line)) redirect(`/process/lines/${sp.line}`);
  const role = await currentRole();
  const open = D.proposals.filter((p) => p.state === "Waiting");
  const recent = D.runs.slice().sort((a, b) => b.end.localeCompare(a.end)).slice(0, 10);
  const fits = Object.fromEntries(D.modelFits.map((f) => [f.lineId, f]));
  return (
    <Workspace crumbs={crumbs({ label: "Lines" })} askContext="Process lines">
      <PageHeader eyebrow="Process" title="Lines" meta={<>Two lines on the demonstration plant. Stamped works inside limits set beforehand.</>}
        actions={<><Link className="btn btn-sm" href="/process/proposals">{open.length} proposals waiting</Link><AskButton context="Process lines" label="Ask about lines" /></>} />
      <ProcessTabs active="lines" />
      <div className="grid">
        <div className="span-12">
          <Section title="Lines" meta="Mode, running settings against the signed band, last runs" flush>
            <DataTable caption="Lines" rowKey={(l) => l.id} rows={D.lines} columns={[
              { key: "n", label: "Line", render: (l) => <><Link className="link" href={`/process/lines/${l.id}`} style={{ fontWeight: 600 }}>{l.name}</Link><span className="cell-sub">{packOf(l).equipmentClass} · {l.product}</span></> },
              { key: "m", label: "Mode", render: (l) => <LineModeTag mode={l.mode} /> },
              { key: "o", label: `Outcome, last 20`, render: (l) => { const n = outcomeName(l); const v = runsOf(l.id).slice(-20).map((r) => outcome(r, n)!.value); return <><Sparkline values={v} width={140} height={28} label={`${n} on ${l.short}`} /><span className="cell-sub">{n} now {v[v.length - 1]} · spec {specOf(l).join(" to ")}</span></>; } },
              { key: "s", label: "Key setting vs band", render: (l) => { const rs = D.runningSettings.find((r) => r.lineId === l.id && r.mode === "Trial") ?? D.runningSettings.find((r) => r.lineId === l.id)!; const w = D.byId.window(l.id, rs.param)!; return <div className="mini-band"><LimitsBand name={rs.name} unit={rs.unit} signed={[w.low, w.high]} narrowed={w.narrowedLow !== undefined ? [w.narrowedLow, w.narrowedHigh!] : undefined} current={rs.value} signedBy={w.signedBy} signedAt={dayMonth(w.signedAt)} legend={false} /></div>; } },
              { key: "p", label: "Open", align: "right", render: (l) => open.filter((p) => p.lineId === l.id).length },
              { key: "f", label: "Model fit", render: (l) => <Tag tone={fits[l.id].state === "accepted" ? "success" : "warning"}>{fits[l.id].state === "accepted" ? "Accepted" : "Not accepted"}</Tag> },
              { key: "g", label: "Signer", render: () => "Plant head" },
            ]} />
          </Section>
        </div>
        <div className="span-8 xl-span-9 stack">
          <div className="xl-cols-2">
            <Section title="Recent runs" meta="Both lines, newest first" flush actions={<Link className="link" href="/process/lines/line-a">All runs</Link>}>
              <DataTable caption="Recent runs" rowKey={(r) => r.id} rows={recent} columns={[
                { key: "r", label: "Run", render: (r) => <Link className="link" href={`/process/runs/${r.id}`}>{runLabel(r)}</Link> },
                { key: "l", label: "Line", render: (r) => D.byId.line(r.lineId)!.short },
                { key: "e", label: "Ended", mono: true, render: (r) => `${dayMonth(r.end)} ${hhmm(r.end)}` },
                { key: "o", label: "Outcome", align: "right", render: (r) => { const o = outcome(r, outcomeName(D.byId.line(r.lineId)!))!; return `${o.value} ${o.unit}`; } },
                { key: "lb", label: "Label", render: (r) => <EvidenceTag label={outcome(r, outcomeName(D.byId.line(r.lineId)!))!.label} /> },
                { key: "v", label: "Proof", render: (r) => { const p = proofForRun(r); return p ? <Link href={`/process?evidence=${p.id}`} scroll={false}><VerdictTag verdict={p.verdict} /></Link> : <span className="muted">None</span>; } },
              ]} />
            </Section>
            <Section title="Running settings" meta="Every value Stamped wrote" flush actions={<Link className="link" href="/process/settings">Open</Link>}>
              <DataTable caption="Running settings" rowKey={(r) => r.lineId + r.param} rows={D.runningSettings} columns={[
                { key: "l", label: "Line", render: (r) => D.byId.line(r.lineId)!.short },
                { key: "n", label: "Setting", render: (r) => r.name },
                { key: "v", label: "Value", align: "right", render: (r) => `${r.value} ${r.unit}` },
                { key: "m", label: "Mode", render: (r) => <ModeTag mode={r.mode} /> },
                { key: "x", label: "Expires", render: (r) => rel(r.expiresAt) },
              ]} />
            </Section>
          </div>
        </div>
        <div className="span-4 xl-span-3 stack ctx">
          <Section title="Needs a decision" meta={`${open.length} waiting`} flush>
            <div className="stack-sm" style={{ padding: 12 }}>
              {open.slice(0, 2).map((p) => <DecisionCard key={p.id} p={p} role={role} variant="compact" href={`/process/proposals/${p.id}`} />)}
            </div>
            {open.length > 2 ? <div className="rows">{open.slice(2).map((p) => (
              <Link key={p.id} className="row" href={`/process/proposals/${p.id}`} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                <span style={{ minWidth: 0 }}><span className="row-title" style={{ display: "block" }}>{D.byId.window(p.lineId, p.param)?.name} {p.current} to {p.proposed}</span><span className="row-sub">{D.byId.line(p.lineId)!.short} · expires {rel(p.expiresAt)}</span></span>
                <Tag tone="accent">Needs a decision</Tag>
              </Link>))}</div> : null}
          </Section>
          <Section title="Stops" meta="Last 14 days" flush>
            <ul className="tl">{D.stopEvents.map((s) => (
              <li key={s.id}><span className="t">{dayMonth(s.at)}</span><span className="k x" /><span>{s.effect}<span className="cell-sub">{s.by} · {D.byId.line(s.lineId)!.short} · {s.mode}</span></span><Tag tone={s.restoreResult === "restored" ? "success" : "neutral"}>{s.restoreResult}</Tag></li>
            ))}</ul>
          </Section>
        </div>
      </div>
      <div style={{ marginTop: "var(--space-5)" }}><ExampleActions area="Process" role={role} /></div>
      {sp.evidence ? <EvidenceSheet proofId={sp.evidence} closeHref="/process" /> : null}
    </Workspace>
  );
}
