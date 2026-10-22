import Link from "next/link";
import { nameOf } from "@/lib/names";
import { notFound } from "next/navigation";
import * as D from "@/lib/demo/data";
import { currentRole } from "@/lib/role";
import { dayMonth, hhmm, rel } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DecisionCard } from "@/components/cards/DecisionCard";
import { RunChart } from "@/components/ui/charts";
import { LimitsBand } from "@/components/ui/LimitsBand";
import { DataTable, EvidenceTag, LineModeTag, PageHeader, Section, Tag, VerdictTag } from "@/components/ui/primitives";
import { ExampleActions } from "@/components/cards/ExampleActions";
import { AnsweredChip, ControlStack, LayerProposal, Onboarding, WorkingOn } from "@/components/agent/blocks";
import { EvidenceSheet } from "@/components/evidence/EvidenceSheet";
import { ProcessTabs, crumbs, outcome, outcomeName, packOf, proofForRun, runLabel, runsOf, specOf, trialArm } from "@/components/process/common";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: D.byId.line(id)?.name ?? "Line" };
}

export default async function LineDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ evidence?: string; n?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const line = D.byId.line(id);
  if (!line) notFound();
  const role = await currentRole();
  const pack = packOf(line);
  const name = outcomeName(line);
  const all = runsOf(line.id);
  const shown = all.slice(-30);
  const values = shown.map((r) => outcome(r, name)!.value);
  const trialStart = shown.findIndex((r) => trialArm(r.id)?.trial.status === "running");
  const wins = D.signedWindows.filter((w) => w.lineId === line.id);
  const settings = D.runningSettings.filter((r) => r.lineId === line.id);
  const props = D.proposals.filter((p) => p.lineId === line.id);
  const open = props.filter((p) => p.state === "Waiting");
  const fit = D.modelFits.find((f) => f.lineId === line.id)!;
  const trials = D.trials.filter((t) => t.lineId === line.id);
  const sa = D.standingApprovals.filter((s) => s.lineId === line.id);
  const base = `/process/lines/${line.id}`;
  const table = all.slice().reverse().slice(0, Number(sp.n ?? 16));
  return (
    <Workspace crumbs={crumbs({ label: line.short, href: base }, { label: "Line detail" })} askContext={line.name}>
      <PageHeader eyebrow={`Process · ${pack.equipmentClass}`} title={line.name}
        meta={<span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><LineModeTag mode={line.mode} />{line.product} · {line.status}<AnsweredChip qid={line.id === "line-a" ? "q-5" : "q-8"} /></span>}
        actions={<><Link className="btn btn-sm" href={`/plant`}>Line on plant map</Link><AskButton context={line.name} label="Ask about this line" /></>} />
      <ProcessTabs active="lines" />
      <WorkingOn lineId={line.id} />
      <div className="grid line-grid">
        <div className="span-8 xl-span-9 stack">
          <Section title={`${name} per ${pack.labels.unit}`} meta={`Last ${shown.length} ${pack.labels.runs.toLowerCase()} · spec dashed${trialStart >= 0 ? " · shaded: trial running" : ""}`} flush>
            <div className="stat-row">
              {line.kpis.map((k) => <div className="stat" key={k.label}><div className="label">{k.label}</div><div className="v">{k.value}{k.unit ? <span className="unit">{k.unit}</span> : null}</div><div className="s">{k.label2 ? <EvidenceTag label={k.label2} /> : null}today</div></div>)}
              <div className="stat"><div className="label">Open proposals</div><div className="v">{open.length}</div><div className="s">{props.length} in 14 days</div></div>
              <div className="stat"><div className="label">Model fit</div><div className="v" style={{ fontSize: 16 }}><Tag tone={fit.state === "accepted" ? "success" : "warning"}>{fit.state === "accepted" ? "Accepted" : "Not accepted"}</Tag></div><div className="s">coverage {Math.round(fit.coverage * 100)}%</div></div>
            </div>
            <div className="chart-pad"><RunChart values={values} spec={specOf(line)} width={980} height={180} label={`${name} on ${line.short}`} highlightFrom={trialStart >= 0 ? trialStart : undefined} /></div>
            <div className="chart-legend"><span><i />{name}</span><span><i className="d" />Spec {specOf(line).join(" to ")}</span>{trialStart >= 0 ? <span><i className="t" />Trial running</span> : null}</div>
          </Section>
          <ExampleActions area="Process" role={role} lineId={line.id} title={`Example actions on ${line.short}`} />
          <ControlStack lineId={line.id} />
          {line.id === "line-b" ? <LayerProposal role={role} /> : null}
          {line.id === "line-b" ? <Onboarding /> : null}
          <Section title={pack.labels.runs} meta={`${all.length} on record · run definition: ${pack.runDefinition}`} flush
            actions={Number(sp.n ?? 16) < all.length ? <Link className="link" href={`${base}?n=${all.length}`} scroll={false}>Show all {all.length}</Link> : null}>
            <DataTable caption={pack.labels.runs} rowKey={(r) => r.id} rows={table} columns={[
              { key: "r", label: pack.labels.run, render: (r) => <Link className="link" href={`/process/runs/${r.id}`}>{runLabel(r)}</Link> },
              { key: "e", label: "Ended", mono: true, render: (r) => `${dayMonth(r.end)} ${hhmm(r.end)}` },
              ...pack.setpoints.map((sp_) => ({ key: sp_, label: D.byId.window(line.id, sp_)?.name ?? sp_, align: "right" as const, render: (r: typeof table[number]) => r.setpoints[sp_] })),
              { key: "o", label: name, align: "right", render: (r) => <span style={{ display: "inline-flex", gap: 8, alignItems: "center", whiteSpace: "nowrap" }}>{outcome(r, name)!.value} {outcome(r, name)!.unit}<EvidenceTag label={outcome(r, name)!.label} /></span> },
              { key: "a", label: "Trial arm", render: (r) => { const t = trialArm(r.id); return t ? <Tag tone={t.sw.arm === "B" ? "info" : "neutral"}>{t.sw.arm === "B" ? "B, change" : "A, prior"}{t.sw.skippedReason ? ", skipped" : ""}</Tag> : <span className="muted">None</span>; } },
              { key: "v", label: "Proof", render: (r) => { const p = proofForRun(r); return p ? <Link href={`${base}?evidence=${p.id}`} scroll={false}><VerdictTag verdict={p.verdict} /></Link> : <span className="muted">None</span>; } },
            ]} />
          </Section>
        </div>
        <div className="span-4 xl-span-3 stack ctx line-side">
          <Section title="Facts">
            <dl className="facts-grid">
              <dt>Line pack</dt><dd>{pack.equipmentClass}</dd>
              <dt>Run</dt><dd>{pack.runDefinition}</dd>
              <dt>Window</dt><dd>{pack.windowTemplate}</dd>
              <dt>Signer</dt><dd>Plant head, set per plant</dd>
              <dt>Constraints</dt><dd>{pack.constraints.join("; ")}</dd>
              <dt>Model</dt><dd><Link className="link" href="/process/model-fit">{nameOf(fit.modelId)} {fit.version}</Link></dd>
              <dt>Standing approval</dt><dd>{sa.length ? sa.map((s) => `${s.band}, until ${dayMonth(s.until)}`).join("; ") : "None"}</dd>
              <dt>Lease</dt><dd>Connected</dd>
            </dl>
          </Section>
          <Section title="Running settings" meta="Inside the signed band" flush>
            <div className="stack-sm line-bands">
              {settings.map((r) => { const w = wins.find((x) => x.param === r.param)!; return <LimitsBand key={r.param} name={r.name} unit={r.unit} signed={[w.low, w.high]} narrowed={w.narrowedLow !== undefined ? [w.narrowedLow, w.narrowedHigh!] : undefined} current={r.value} signedBy={w.signedBy} signedAt={dayMonth(w.signedAt)} legend={false} />; })}
            </div>
          </Section>
          {open.map((p) => <DecisionCard key={p.id} p={p} role={role} variant="compact" href={`/process/proposals/${p.id}`} />)}
          <Section title="Trials" flush>
            <div className="rows">{trials.map((t) => (
              <Link key={t.id} href={`/process/trials/${t.id}`} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                <span style={{ minWidth: 0 }}><span className="row-title" style={{ display: "block" }}>{t.change}</span><span className="row-sub">{t.signedAt ? `Signed ${rel(t.signedAt)}` : "Not signed"}</span></span>
                <Tag tone={t.status === "running" ? "info" : t.status === "awaiting signature" ? "accent" : "neutral"}>{t.status}</Tag>
              </Link>
            ))}</div>
          </Section>
        </div>
      </div>
      {sp.evidence ? <EvidenceSheet proofId={sp.evidence} closeHref={base} /> : null}
    </Workspace>
  );
}
