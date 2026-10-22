"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { nameOf } from "@/lib/names";
import { notFound } from "next/navigation";
import * as D from "@/lib/demo/data";
import { dayMonth, hhmm } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { RunChart } from "@/components/ui/charts";
import { Confidence } from "@/components/ui/Confidence";
import { DataTable, EvidenceTag, PageHeader, Section, Tag, VerdictTag } from "@/components/ui/primitives";
import { EvidenceSheet } from "@/components/evidence/EvidenceSheet";
import { ProcessTabs, crumbs, outcome, outcomeName, packOf, proofForRun, runLabel, runsOf, specOf, trialArm } from "@/components/process/common";


export default function RunDetail() {
  const { id } = useParams() as { id: string };
  const sp = Object.fromEntries(useSearchParams().entries());
  const run = D.runs.find((r) => r.id === id);
  if (!run) notFound();
  const line = D.byId.line(run.lineId)!;
  const pack = packOf(line);
  const name = outcomeName(line);
  const lineRuns = runsOf(line.id);
  const idx = lineRuns.findIndex((r) => r.id === run.id);
  const prev = lineRuns[idx - 1], next = lineRuns[idx + 1];
  const around = lineRuns.slice(Math.max(0, idx - 12), idx + 1).map((r) => outcome(r, name)!.value);
  const readings = D.tagReadings.filter((t) => t.runId === run.id);
  const tag = readings.length ? D.tags.find((t) => t.id === readings[0].tagId) : undefined;
  const writes = D.setpointWrites.filter((w) => w.runId === run.id);
  const arm = trialArm(run.id);
  const proof = proofForRun(run);
  const links = D.lotLinks.filter((l) => l.runId === run.id);
  const base = `/process/runs/${run.id}`;
  const events = [
    { at: run.start, k: "", text: `${pack.labels.run} started`, sub: line.product },
    ...writes.map((w) => ({ at: w.at, k: w.status === "skipped" ? "s" : "w", text: `${D.byId.window(line.id, w.param)?.name ?? w.param} ${w.status} at ${w.value}`, sub: w.reason ?? `Source: ${w.source}` })),
    ...(arm ? [{ at: run.start, k: "w", text: `Trial arm ${arm.sw.arm} (${arm.sw.arm === "B" ? "change" : "prior"})`, sub: arm.trial.change }] : []),
    ...D.stopEvents.filter((s) => s.trialId && s.trialId === arm?.trial.id && s.at >= run.start && s.at <= run.end).map((s) => ({ at: s.at, k: "x", text: "Stop pressed", sub: `${s.by}: ${s.effect}` })),
    { at: run.end, k: "", text: `${pack.labels.run} ended`, sub: `${name} ${outcome(run, name)!.value} ${outcome(run, name)!.unit}` },
  ];
  return (
    <Workspace crumbs={crumbs({ label: line.short, href: `/process/lines/${line.id}` }, { label: runLabel(run) })} askContext={runLabel(run)}>
      <PageHeader eyebrow={`Process · ${line.name}`} title={runLabel(run)}
        meta={<span >{nameOf(run.id)} · {dayMonth(run.start)} {hhmm(run.start)} to {hhmm(run.end)} · {run.product}</span>}
        actions={<>
          {prev ? <Link className="btn btn-sm btn-quiet" href={`/process/runs/${prev.id}`}>Previous</Link> : null}
          {next ? <Link className="btn btn-sm btn-quiet" href={`/process/runs/${next.id}`}>Next</Link> : null}
          {proof ? <Link className="btn btn-sm btn-accent" href={`${base}?evidence=${proof.id}`} scroll={false}>Evidence</Link> : null}
          <AskButton context={runLabel(run)} label="Ask about this run" />
        </>} />
      <ProcessTabs active="lines" />
      <div className="grid">
        <div className="span-8 stack">
          <Section title="Outcomes" flush>
            <div className="stat-row">
              {run.outcomes.map((o) => <div className="stat" key={o.name}><div className="label">{o.name}</div><div className="v">{o.unit === "flag" ? (o.value ? "Yes" : "No") : o.value}{o.unit !== "flag" ? <span className="unit">{o.unit}</span> : null}</div><div className="s"><EvidenceTag label={o.label} /></div></div>)}
              <div className="stat"><div className="label">Trial arm</div><div className="v" style={{ fontSize: 16 }}>{arm ? <Tag tone={arm.sw.arm === "B" ? "info" : "neutral"}>{arm.sw.arm === "B" ? "B, change" : "A, prior"}</Tag> : "None"}</div><div className="s">{arm ? nameOf(arm.trial.id) : "Normal run"}</div></div>
            </div>
            <div className="split" style={{ padding: "12px 16px 8px" }}>
              <div>
                <div className="label">{name}, this and the 12 before</div>
                <RunChart values={around} spec={specOf(line)} width={480} height={130} label={`${name} around ${runLabel(run)}`} highlightFrom={around.length - 1} />
              </div>
              <div>
                <div className="label">{tag ? `${tag.name} during the ${pack.labels.unit}` : "Readings"}</div>
                {readings.length ? <RunChart values={readings.map((r) => r.value).reverse()} width={480} height={130} label={tag?.name ?? "Readings"} /> : <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>No sampled readings kept for this run on record.</p>}
              </div>
            </div>
          </Section>
          <div className="split">
            <Section title="What was set" meta="Setpoints at start" flush>
              <DataTable caption="Setpoints" rowKey={(k) => k} rows={Object.keys(run.setpoints)} columns={[
                { key: "n", label: "Setting", render: (k) => D.byId.window(line.id, k)?.name ?? k },
                { key: "v", label: "Value", align: "right", render: (k) => `${run.setpoints[k]} ${D.byId.window(line.id, k)?.unit ?? ""}` },
                { key: "b", label: "Signed band", align: "right", render: (k) => { const w = D.byId.window(line.id, k); return w ? `${w.narrowedLow ?? w.low} to ${w.narrowedHigh ?? w.high}` : "None"; } },
                { key: "s", label: "Source", render: (k) => { const w = writes.find((x) => x.param === k); return w ? <Tag tone={w.status === "skipped" ? "warning" : "accent"}>{w.source}, {w.status}</Tag> : <span className="muted">prior</span>; } },
              ]} />
            </Section>
            <Section title="Timeline" flush>
              <ul className="tl">{events.sort((a, b) => a.at.localeCompare(b.at)).map((e, i) => (
                <li key={i}><span className="t">{hhmm(e.at)}</span><span className={`k ${e.k}`} /><span>{e.text}<span className="cell-sub">{e.sub}</span></span><span /></li>
              ))}</ul>
            </Section>
          </div>
        </div>
        <div className="span-4 stack ctx">
          <Section title="Evidence on demand" meta={proof ? <span >{nameOf(proof.id)}</span> : undefined}>
            {proof ? (
              <div className="stack-sm">
                <div style={{ fontWeight: 600 }}>{proof.title}</div>
                <Confidence kind="verdict" label={proof.questions[2].label} verdict={proof.verdict} rung={proof.rung} effect={`${proof.effect.measure} ${proof.effect.value > 0 ? "+" : ""}${proof.effect.value} ${proof.effect.unit}`}
                  interval={`${proof.effect.low} to ${proof.effect.high} ${proof.effect.unit}`} diagnostics={proof.diagnostics} method={proof.measurementPlanId ? `Plan ${nameOf(proof.measurementPlanId)}` : "Matched runs"} withheldNeeds={proof.withheldNeeds} />
                <Link className="btn btn-sm btn-accent" href={`${base}?evidence=${proof.id}`} scroll={false} style={{ alignSelf: "flex-start" }}>Open the four questions</Link>
              </div>
            ) : <p className="muted" style={{ fontSize: 13, margin: 0 }}>This run is not part of a trial or a measured change, so it has no proof record. It still counts as a normal run in the line&apos;s history.</p>}
          </Section>
          <Section title="Lots from this run" meta="Quality owns the join" flush>
            {links.length ? <div className="stack-sm" style={{ padding: "12px 16px" }}>{links.map((l) => (
              <div key={l.id} className="stack-sm" style={{ gap: 4 }}>
                <Link className="link mono" href={`/quality?lot=${l.lotId}`}>{nameOf(l.lotId)}</Link>
                <Confidence kind="link" label={l.label} score={l.link_confidence} threshold={pack.linkThreshold} status={l.status}
                  drivers={["time proximity", "recipe match", "sequence", "scanned id"]} method="Weights fitted on a verification sample" />
              </div>
            ))}</div> : <p className="muted" style={{ fontSize: 13, padding: "12px 16px", margin: 0 }}>No lot is linked to this run yet.</p>}
          </Section>
          <Section title="Line pack words" >
            <dl className="facts-grid"><dt>Run</dt><dd>{pack.runDefinition}</dd><dt>Series</dt><dd>{pack.series.join(", ")}</dd><dt>Outcome</dt><dd>{pack.labels.outcome}</dd></dl>
          </Section>
        </div>
      </div>
      {sp.evidence ? <EvidenceSheet proofId={sp.evidence} closeHref={base} /> : null}
    </Workspace>
  );
}
