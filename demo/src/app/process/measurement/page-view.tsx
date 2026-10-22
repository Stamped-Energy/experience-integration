"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { nameOf } from "@/lib/names";
import * as D from "@/lib/demo/data";
import { dayMonth, rel } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, PageHeader, Section, Tag, VerdictTag } from "@/components/ui/primitives";
import { SwitchbackSchedule } from "@/components/process/SwitchbackSchedule";
import { EvidenceSheet } from "@/components/evidence/EvidenceSheet";
import { ProcessTabs, crumbs } from "@/components/process/common";

const htone = (r: string) => (r === "holding" ? "success" : r === "faded" ? "critical" : "warning") as "success" | "critical" | "warning";

export default function Measurement() {
  const sp = Object.fromEntries(useSearchParams().entries());
  const plan = D.measurementPlans.find((m) => m.id === sp.plan) ?? D.measurementPlans[0];
  const trial = D.byId.trial(plan.trialId)!;
  const line = D.byId.line(trial.lineId)!;
  const proof = D.proofRecords.find((p) => p.measurementPlanId === plan.id);
  const checks = D.holdingChecks.filter((h) => h.planId === plan.id).sort((a, b) => b.checkedAt.localeCompare(a.checkedAt));
  const unit = line.type === "batch" ? "batches" : "shift runs";
  const progress = trial.switches.length;
  return (
    <Workspace crumbs={crumbs({ label: "Measurement plans" }, { label: nameOf(plan.id) })} askContext={`Measurement plan ${nameOf(plan.id)}`}>
      <PageHeader eyebrow="Process" title="Measurement plans and holding check" meta="How a change will be judged is locked, hashed and versioned before the first switch. The holding check looks again later."
        actions={<AskButton context={nameOf(plan.id)} label="Ask about this plan" />} />
      <ProcessTabs active="measurement" />
      <div className="grid">
        <div className="span-4 xl-span-4 stack ctx">
          <Section title="Plans" meta={`${D.measurementPlans.length} locked`} flush>
            <div className="rows">{D.measurementPlans.map((m) => { const t = D.byId.trial(m.trialId)!; return (
              <Link key={m.id} href={`/process/measurement?plan=${m.id}`} className="row" aria-current={m.id === plan.id ? "true" : undefined} style={{ gridTemplateColumns: "minmax(0,1fr) auto", background: m.id === plan.id ? "var(--accent-50)" : undefined }} scroll={false}>
                <span style={{ minWidth: 0 }}><span className="row-title" style={{ display: "block" }}>{t.change}</span><span className="row-sub">{nameOf(m.id)} v{m.version} · {m.hash}</span></span>
                <Tag tone={t.status === "running" ? "info" : "neutral"}>{t.status}</Tag>
              </Link>
            ); })}</div>
          </Section>
          <Section title="How the holding check works">
            <p style={{ fontSize: 13, margin: 0, color: "var(--text-secondary)" }}>After a verdict, the same measures are checked again on later runs. The result is one of three words: <strong>holding</strong>, <strong>faded</strong> or <strong>inconclusive</strong>. A faded result reopens the change for review; it never undoes a value by itself.</p>
          </Section>
          <div className="xl-only stack">
          <Section title="Holding check" meta={checks[0] ? `Next ${rel(checks[0].nextAt)}` : undefined} flush>
            <ul className="tl">{checks.length ? checks.map((h, i) => (
              <li key={i}><span className="t">{dayMonth(h.checkedAt)}</span><span className="k" /><span>{h.result === "holding" ? "Effect still there" : h.result === "faded" ? "Effect gone; change reopened" : "Not enough runs to tell"}</span><Tag tone={htone(h.result)}>{h.result}</Tag></li>
            )) : <li><span className="t">None</span><span /><span className="muted">First check after the verdict</span><span /></li>}</ul>
          </Section>
          <Section title="All holding checks" flush>
            <DataTable caption="All holding checks" rowKey={(h) => h.planId + h.checkedAt} rows={D.holdingChecks} columns={[
              { key: "p", label: "Plan", render: (h) => nameOf(h.planId) },
              { key: "d", label: "Checked", render: (h) => dayMonth(h.checkedAt) },
              { key: "r", label: "Result", render: (h) => <Tag tone={htone(h.result)}>{h.result}</Tag> },
            ]} />
          </Section>
          </div>
        </div>
        <div className="span-8 xl-span-8 stack">
          <Section title={trial.change} meta={<span >{nameOf(plan.id)} · version {plan.version} · hash {plan.hash}</span>} actions={<Tag>Locked {dayMonth(plan.lockedAt)}</Tag>} flush>
            <div className="stat-row">
              <div className="stat"><div className="label">Line</div><div className="v" style={{ fontSize: 16 }}>{line.short}</div><div className="s">{line.product}</div></div>
              <div className="stat"><div className="label">Minimum</div><div className="v">{plan.minBatches}<span className="unit">{unit}</span></div><div className="s">before a verdict</div></div>
              <div className="stat"><div className="label">So far</div><div className="v">{progress}<span className="unit">{unit}</span></div><div className="s">{Math.max(0, plan.minBatches - progress)} to go</div></div>
              <div className="stat"><div className="label">Verdict</div><div className="v" style={{ fontSize: 16 }}>{proof ? <VerdictTag verdict={proof.verdict} /> : "None"}</div><div className="s">{proof ? `${proof.rung}${proof.rung === "R3" || proof.rung === "R4" ? " Verified" : ""}` : ""}</div></div>
            </div>
            <DataTable caption="Measures" rowKey={(m) => m.name} rows={plan.measures} columns={[
              { key: "n", label: "Measure", render: (m) => <span style={{ fontWeight: 500 }}>{m.name}</span> },
              { key: "u", label: "Unit", render: (m) => m.unit },
              { key: "m", label: "Method", render: (m) => <><Tag>{m.method.split(",")[0]}</Tag><span className="cell-sub">{m.method.split(",").slice(1).join(",").trim()}</span></> },
            ]} />
          </Section>
          <Section title="Trial this plan judges" flush actions={<Link className="link" href={`/process/trials/${trial.id}`}>Trial detail</Link>}>
            <dl className="facts-grid" style={{ padding: "12px 16px" }}>
              <dt>Trial</dt><dd >{nameOf(trial.id)}</dd>
              <dt>Schedule</dt><dd>{trial.schedule.join("; ")}</dd>
              <dt>Restore</dt><dd>{Object.entries(trial.restoreTarget).map(([k, v]) => `${D.byId.window(trial.lineId, k)?.name ?? k} ${v}`).join(", ")}</dd>
              <dt>Drafted</dt><dd>{trial.draftedBy}</dd>
              <dt>Signed</dt><dd>{trial.signedAt ? `Plant head A. · ${dayMonth(trial.signedAt)}` : "Not yet"}</dd>
              <dt>Proof</dt><dd>{proof ? <Link className="link" href={`/process/measurement?plan=${plan.id}&evidence=${proof.id}`} scroll={false}>{nameOf(proof.id)}, open the four questions</Link> : "None yet"}</dd>
            </dl>
          </Section>
          {trial.switches.length ? <Section title="Switches so far" meta={`${trial.switches.length} of ${plan.minBatches} ${unit}`} flush><SwitchbackSchedule trial={trial} /></Section> : null}
        </div>
        <div className="span-12 stack xl-hide">
          <Section title="Holding check" meta={checks[0] ? `Next ${rel(checks[0].nextAt)}` : undefined} flush>
            <ul className="tl">{checks.length ? checks.map((h, i) => (
              <li key={i}><span className="t">{dayMonth(h.checkedAt)}</span><span className="k" /><span>{h.result === "holding" ? "Effect still there" : h.result === "faded" ? "Effect gone; change reopened" : "Not enough runs to tell"}</span><Tag tone={htone(h.result)}>{h.result}</Tag></li>
            )) : <li><span className="t">None</span><span /><span className="muted">First check after the verdict</span><span /></li>}</ul>
          </Section>
          <Section title="All holding checks" flush>
            <DataTable caption="All holding checks" rowKey={(h) => h.planId + h.checkedAt} rows={D.holdingChecks} columns={[
              { key: "p", label: "Plan", render: (h) => nameOf(h.planId) },
              { key: "d", label: "Checked", render: (h) => dayMonth(h.checkedAt) },
              { key: "r", label: "Result", render: (h) => <Tag tone={htone(h.result)}>{h.result}</Tag> },
            ]} />
          </Section>
        </div>
      </div>
      {sp.evidence ? <EvidenceSheet proofId={sp.evidence} closeHref={`/process/measurement?plan=${plan.id}`} /> : null}
    </Workspace>
  );
}
