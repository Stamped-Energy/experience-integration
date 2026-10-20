import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import * as D from "@/lib/demo/data";
import { currentRole } from "@/lib/role";
import { can } from "@/lib/rbac";
import { dayMonth, hhmm, rel } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { CardActions } from "@/components/cards/CardActions";
import { deniedReason } from "@/components/cards/DecisionCard";
import { Confidence } from "@/components/ui/Confidence";
import { LimitsBand } from "@/components/ui/LimitsBand";
import { DataTable, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { EvidenceSheet } from "@/components/evidence/EvidenceSheet";
import { SwitchbackSchedule } from "@/components/process/SwitchbackSchedule";
import { ProcessTabs, crumbs, runLabel } from "@/components/process/common";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: D.byId.trial(id)?.change ?? "Trial" };
}

export default async function TrialDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ evidence?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const t = D.byId.trial(id);
  if (!t) notFound();
  const role = await currentRole();
  const line = D.byId.line(t.lineId)!;
  const plan = D.measurementPlans.find((m) => m.id === t.measurementPlanId)!;
  const proof = D.proofRecords.find((p) => p.objectId === t.id);
  const stops = D.stopEvents.filter((s) => s.trialId === t.id);
  const checks = D.holdingChecks.filter((h) => h.planId === plan.id);
  const param = Object.keys(t.restoreTarget)[0];
  const win = D.byId.window(t.lineId, param);
  const rs = D.runningSettings.find((r) => r.lineId === t.lineId && r.param === param);
  const base = `/process/trials/${t.id}`;
  const done = t.switches.filter((s) => !s.skippedReason).length;
  const skipped = t.switches.filter((s) => s.skippedReason);
  return (
    <Workspace crumbs={crumbs({ label: "Trials", href: "/process/trials" }, { label: t.id })} askContext={t.change}>
      <PageHeader eyebrow={`Trial · ${line.name}`} title={t.change}
        meta={<span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><Tag tone={t.status === "running" ? "info" : t.status === "awaiting signature" ? "accent" : "neutral"}>{t.status}</Tag><span className="mono">{t.id}</span>Drafted by {t.draftedBy}{t.signedAt ? ` · signed by Plant head A. ${dayMonth(t.signedAt)}` : ""}</span>}
        actions={<>{proof ? <Link className="btn btn-sm btn-accent" href={`${base}?evidence=${proof.id}`} scroll={false}>Evidence</Link> : null}<AskButton context={t.change} label="Ask about this trial" /></>} />
      <ProcessTabs active="trials" />
      <div className="grid">
        <div className="span-8 stack">
          <Section title="Stop" meta="What Stop does on this trial" flush>
            <div style={{ padding: "12px 16px 0", fontSize: 14 }}>Stop restores the checked prior configuration, <strong>{Object.entries(t.restoreTarget).map(([k, v]) => `${D.byId.window(t.lineId, k)?.name ?? k} ${v} ${D.byId.window(t.lineId, k)?.unit ?? ""}`).join(", ")}</strong>, from the next {line.type === "batch" ? "batch" : "shift run"}. If the restore fails, the line goes recommend-only.</div>
            <CardActions actions={t.status === "awaiting signature" ? [{ id: "sign", label: "Sign trial order", primary: true, allowed: can(role, "sign-trial"), reason: deniedReason("sign-trial", "sign"), done: "Signed. Illustrative: nothing was written." }] : []}
              stop={t.status === "running" ? { effect: `Restores ${Object.values(t.restoreTarget)[0]} from the next run.`, allowed: can(role, "press-stop", t.lineId), reason: deniedReason("press-stop", "press Stop") } : undefined} />
          </Section>
          <Section title="Switchback schedule" meta={`${done} written · ${skipped.length} skipped · ${plan.minBatches} planned`} flush>
            {t.switches.length ? <SwitchbackSchedule trial={t} /> : <p className="muted" style={{ padding: "12px 16px", margin: 0, fontSize: 13 }}>No switches yet. The schedule starts once the trial order is signed.</p>}
          </Section>
          <Section title={`${line.type === "batch" ? "Batches" : "Shift runs"} in this trial`} meta="Arm, value written and outcome per run" flush>
            <DataTable caption="Runs in this trial" rowKey={(s) => s.runId} rows={t.switches.slice().reverse()} columns={[
              { key: "r", label: "Run", render: (s) => <Link className="link" href={`/process/runs/${s.runId}`}>{runLabel(D.runs.find((r) => r.id === s.runId)!)}</Link> },
              { key: "e", label: "Ended", mono: true, render: (s) => { const r = D.runs.find((x) => x.id === s.runId)!; return `${dayMonth(r.end)} ${hhmm(r.end)}`; } },
              { key: "a", label: "Arm", render: (s) => <Tag tone={s.arm === "B" ? "info" : "neutral"}>{s.arm === "B" ? "B, change" : "A, prior"}</Tag> },
              { key: "v", label: win?.name ?? param, align: "right", render: (s) => `${D.runs.find((r) => r.id === s.runId)!.setpoints[param] ?? "None"} ${win?.unit ?? ""}` },
              ...D.runs.find((r) => r.id === t.switches[0]?.runId)?.outcomes.filter((o) => o.unit !== "flag").map((o) => ({ key: o.name, label: o.name, align: "right" as const, render: (s: typeof t.switches[number]) => { const x = D.runs.find((r) => r.id === s.runId)!.outcomes.find((y) => y.name === o.name)!; return `${x.value} ${x.unit}`; } })) ?? [],
              { key: "w", label: "Switch", render: (s) => (s.skippedReason ? <Tag tone="warning">Skipped</Tag> : "Written") },
            ]} />
          </Section>
          <div className="split">
            <Section title="Skipped switches" flush>
              <DataTable caption="Skipped switches" rowKey={(s) => s.runId} rows={skipped} columns={[
                { key: "r", label: "Run", mono: true, render: (s) => <Link className="link" href={`/process/runs/${s.runId}`}>{s.runId}</Link> },
                { key: "a", label: "Arm", render: (s) => s.arm },
                { key: "w", label: "Reason", render: (s) => s.skippedReason },
              ]} />
            </Section>
            <Section title="Stops on this trial" flush>
              <DataTable caption="Stops" rowKey={(s) => s.id} rows={stops} columns={[
                { key: "t", label: "When", mono: true, render: (s) => `${dayMonth(s.at)} ${hhmm(s.at)}` },
                { key: "b", label: "By", render: (s) => s.by },
                { key: "r", label: "Result", render: (s) => <Tag tone={s.restoreResult === "restored" ? "success" : "warning"}>{s.restoreResult}</Tag> },
              ]} />
            </Section>
          </div>
        </div>
        <div className="span-4 stack ctx">
          {win && rs ? <Section title="Restore target"><LimitsBand name={win.name} unit={win.unit} signed={[win.low, win.high]} narrowed={win.narrowedLow !== undefined ? [win.narrowedLow, win.narrowedHigh!] : undefined} current={rs.value} proposed={Object.values(t.restoreTarget)[0]} signedBy={win.signedBy} signedAt={dayMonth(win.signedAt)} /><div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Tick shows the prior value Stop restores.</div></Section> : null}
          <Section title="Measurement plan" meta={<span className="mono">{plan.id} v{plan.version}</span>} actions={<Tag>Locked</Tag>}>
            <dl className="facts-grid">
              <dt>Hash</dt><dd className="mono">{plan.hash}</dd>
              <dt>Locked</dt><dd>{dayMonth(plan.lockedAt)}, before the first switch</dd>
              <dt>Minimum</dt><dd>{plan.minBatches} {line.type === "batch" ? "batches" : "shift runs"}</dd>
              {plan.measures.map((m) => <Fragment key={m.name}><dt>Measure</dt><dd>{m.name} ({m.unit}) <Tag>{m.method.split(",")[0]}</Tag></dd></Fragment>)}
            </dl>
            <Link className="link" href={`/process/measurement?plan=${plan.id}`} style={{ fontSize: 13, display: "inline-block", marginTop: 8 }}>Open plan</Link>
          </Section>
          <Section title="Result so far">
            {proof ? <Confidence kind="verdict" label={proof.questions[2].label} verdict={proof.verdict} rung={proof.rung} effect={proof.verdict === "Withheld" ? "not measured" : `${proof.effect.measure} ${proof.effect.value > 0 ? "+" : ""}${proof.effect.value} ${proof.effect.unit}`}
              interval={proof.verdict === "Withheld" ? "none" : `${proof.effect.low} to ${proof.effect.high} ${proof.effect.unit}`} diagnostics={proof.diagnostics} method={`Plan ${plan.id}`} withheldNeeds={proof.withheldNeeds} /> : <span className="muted">No proof record yet.</span>}
          </Section>
          <Section title="Holding check" flush>
            <ul className="tl">{checks.length ? checks.map((h, i) => <li key={i}><span className="t">{dayMonth(h.checkedAt)}</span><span className="k" /><span>Checked again<span className="cell-sub">next {rel(h.nextAt)}</span></span><Tag tone={h.result === "holding" ? "success" : h.result === "faded" ? "critical" : "warning"}>{h.result}</Tag></li>) : <li><span className="t">None</span><span /><span className="muted">First check after the verdict</span><span /></li>}</ul>
          </Section>
        </div>
      </div>
      {sp.evidence ? <EvidenceSheet proofId={sp.evidence} closeHref={base} /> : null}
    </Workspace>
  );
}
