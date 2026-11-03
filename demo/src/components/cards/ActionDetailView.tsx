"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ProcessHubTabs } from "@/components/process/ProcessHubTabs";
import { QualityHubTabs } from "@/components/quality/QualityHubTabs";
import type { RoleId } from "@/lib/demo/types";
import { actionHref, actionOutcomeLine, getAction } from "@/lib/demo/actions";
import { detailFor } from "@/lib/demo/actionDetail";
import { byId, roles, runs } from "@/lib/demo/data";
import { demoRole } from "@/lib/role";
import { can } from "@/lib/rbac";
import { dayMonth, hhmm } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { CardActions } from "@/components/cards/CardActions";
import { deniedReason } from "@/components/cards/DecisionCard";
import { Confidence } from "@/components/ui/Confidence";
import { RunChart } from "@/components/ui/charts";
import { DataTable, EvidenceTag, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { SpcControlChart } from "@/components/view/spc-control-chart";
import { Assign } from "@/components/agent/Assign";
import * as A from "@/lib/demo/agent";
import { crumbs as processCrumbs, processEyebrow, runLabel } from "@/components/process/common";
import { crumbs as qualityCrumbs, lotNo, qualityEyebrow } from "@/components/quality/common";

const STEP_WORD = { Detect: "See", Explain: "Explain", Propose: "Change", Trial: "Try", Verify: "Check", Learn: "Learn", Decide: "Decide" } as const;
const HOW_TONE = { "On its own, inside the signed band": "success", "A person decides": "info", "Recommend only": "warning", "Record only": "neutral" } as const;

function roleNames(ids: RoleId[]) {
  const n = ids.map((r) => roles.find((x) => x.id === r)!.name);
  return n.length > 1 ? `${n.slice(0, -1).join(", ")} or ${n[n.length - 1]}` : n[0];
}

function parseBandNumbers(before: string, after: string): { low: number; point: number; high: number } | null {
  const num = (s: string) => {
    const m = s.match(/-?\d+(?:\.\d+)?/g);
    if (!m?.length) return null;
    const xs = m.map(Number);
    if (xs.length >= 2) return { low: Math.min(xs[0], xs[1]), high: Math.max(xs[0], xs[1]), point: (xs[0] + xs[1]) / 2 };
    return { low: xs[0], high: xs[0], point: xs[0] };
  };
  const b = num(before);
  const a = num(after);
  if (!b || !a) return null;
  return { low: Math.min(b.low, a.low), high: Math.max(b.high, a.high), point: a.point };
}

export function ActionDetailView({ id }: { id: string }) {
  const a = getAction(id);
  if (!a) notFound();
  const role = demoRole();
  const line = byId.line(a.lineId)!;
  const detail = detailFor(a);
  const base = actionHref(a);
  const crumbs = a.area === "Process"
    ? processCrumbs({ label: "Actions", href: "/process/actions" }, { label: a.title })
    : qualityCrumbs({ label: "Actions", href: "/quality/actions" }, { label: a.title });
  const eyebrow = a.area === "Process" ? processEyebrow(base) : qualityEyebrow(base);
  const c = a.closed;
  const stop = a.who.how === "On its own, inside the signed band"
    ? { effect: "Stopped. The previous setting comes back and nothing new is written.", allowed: can(role, "press-stop", a.lineId), reason: deniedReason("press-stop", "press Stop") }
    : undefined;
  const allowed = a.who.roles.includes(role);
  const canAct = allowed || !!stop?.allowed;
  const bandNums = parseBandNumbers(a.outcome.before, a.outcome.after);
  const unitMatch = a.outcome.before.match(/[a-zA-Z·%/]+/g);
  const unit = unitMatch?.find((u) => u.length > 1 && !/^(to|pp|min)$/i.test(u)) ?? "";

  return (
    <Workspace crumbs={crumbs} askContext={a.title}>
      <PageHeader
        eyebrow={eyebrow}
        title={a.title}
        meta={
          <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Tag tone={c ? "success" : "neutral"}>{a.mechanism}</Tag>
            <span className="muted">{line.short}</span>
            <span className="mono" style={{ fontSize: 13 }}>{actionOutcomeLine(a.outcome)}</span>
          </span>
        }
        actions={
          <>
            {a.href ? <Link className="btn btn-sm" href={a.href} scroll={false}>{a.hrefLabel ?? "Related record"}</Link> : null}
            <AskButton context={a.title} label="Ask about this action" />
          </>
        }
      />
      {a.area === "Process" ? <ProcessHubTabs /> : <QualityHubTabs />}
      <div className="grid">
        <div className="span-8 stack">
          <Section title="Summary">
            <p style={{ margin: "0 0 8px", lineHeight: 1.5 }}>{a.seen}</p>
            <p className="ex-why" style={{ margin: 0 }}><b>Why it matters:</b> {a.why}</p>
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {a.steps.map((s) => (
                <span key={s} className="ex-step" data-step={s}>{STEP_WORD[s]}</span>
              ))}
            </div>
          </Section>
          <Section title="Outcome before and after" meta={`${a.outcome.label} on the demonstration plant model`}>
            {bandNums ? (
              <Confidence
                kind="prediction"
                label={a.outcome.label}
                measure={a.outcome.metric}
                unit={unit.replace(/^·/, "")}
                low={bandNums.low}
                point={bandNums.point}
                high={bandNums.high}
                drivers={a.evidence.map((e) => e.text).slice(0, 3)}
                fit="accepted"
                method={`Before ${a.outcome.before}; target ${a.outcome.after} (${a.outcome.label.toLowerCase()})`}
              />
            ) : (
              <dl className="facts-grid">
                <dt>Before</dt><dd>{a.outcome.before}</dd>
                <dt>After</dt><dd>{a.outcome.after}</dd>
                <dt>Basis</dt><dd>{a.outcome.label}</dd>
              </dl>
            )}
            {a.expected ? <p className="muted" style={{ margin: "8px 0 0", fontSize: 13 }}>Expected band: {a.expected.band} ({a.expected.label.toLowerCase()})</p> : null}
            {c?.result ? (
              <p style={{ margin: "8px 0 0", fontSize: 13 }}>
                <Tag tone={c.result.status === "Verified" ? "success" : "neutral"}>{c.result.status}</Tag>{" "}
                {c.result.label.toLowerCase()} result: {c.result.band}
              </p>
            ) : null}
          </Section>
          <Section title="Evidence" meta="Trends, control charts and sensor-backed records">
            <ul className="ex-ev" style={{ marginBottom: 12 }}>
              {a.evidence.map((e) => (
                <li key={e.text}>
                  <EvidenceTag label={e.label} />
                  <span>{e.text}{e.id ? <span className="mono muted"> · {e.id}</span> : null}</span>
                </li>
              ))}
            </ul>
            {detail.trend ? (
              <div className="chart-pad">
                <RunChart
                  values={detail.trend.values}
                  spec={detail.trend.spec}
                  width={720}
                  height={160}
                  label={detail.trend.label}
                />
              </div>
            ) : null}
            {detail.spc ? (
              <div style={{ marginTop: detail.trend ? 16 : 0 }}>
                <SpcControlChart {...detail.spc} height={200} />
              </div>
            ) : null}
          </Section>
          {(detail.linkedLots?.length || detail.linkedRuns?.length) ? (
            <Section title="Linked lots and runs" flush>
              <DataTable
                caption="Links"
                rowKey={(r) => r.id}
                rows={[
                  ...(detail.linkedLots ?? []).map((lotId) => ({ kind: "Lot" as const, id: lotId, href: `/quality/lots/${lotId}`, label: lotNo(lotId) })),
                  ...(detail.linkedRuns ?? []).map((runId) => {
                    const run = runs.find((r) => r.id === runId);
                    return { kind: "Run" as const, id: runId, href: `/process/runs/${runId}`, label: run ? runLabel(run) : runId };
                  }),
                ]}
                columns={[
                  { key: "k", label: "Type", render: (r) => r.kind },
                  { key: "l", label: "Record", render: (r) => <Link className="link" href={r.href}>{r.label}</Link> },
                ]}
              />
            </Section>
          ) : null}
          {detail.simulation ? (
            <Section title="Simulation or trial" meta={detail.simulation.summary}>
              <Link className="link" href={detail.simulation.href}>{detail.simulation.title}</Link>
            </Section>
          ) : null}
          {detail.similarCases?.length ? (
            <Section title="Similar past cases" flush>
              <div className="rows">
                {detail.similarCases.map((s) => (
                  <Link key={s.href} href={s.href} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                    <span><span className="row-title" style={{ display: "block" }}>{s.title}</span><span className="row-sub">{s.band}</span></span>
                    <Tag tone="neutral">Open</Tag>
                  </Link>
                ))}
              </div>
            </Section>
          ) : null}
        </div>
        <div className="span-4 stack ctx">
          <Section title="Recommended steps">
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.5 }}>
              {detail.steps.map((s) => <li key={s} style={{ marginBottom: 6 }}>{s}</li>)}
            </ol>
          </Section>
          <Section title="Risks">
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.5 }}>
              {detail.risks.map((r) => <li key={r} style={{ marginBottom: 6 }}>{r}</li>)}
            </ul>
          </Section>
          <Section title="Approval" meta="Recommend only; the operator or named role approves in the plant system">
            <dl className="facts-grid">
              <dt>Change</dt><dd>{c ? c.changed : a.action}</dd>
              <dt>Who</dt><dd><Tag tone={HOW_TONE[a.who.how]}>{a.who.how}</Tag> {roleNames(a.who.roles)}</dd>
              <dt>Note</dt><dd>{a.who.note}</dd>
              {c ? <><dt>Decision</dt><dd>{c.by} · {dayMonth(c.at)} {hhmm(c.at)}</dd></> : null}
            </dl>
            <div className="ex-meta" style={{ marginTop: 12 }}>
              <Assign initial={A.assigned[a.id]} people={A.PEOPLE} canAssign={A.ASSIGNERS.includes(role)} by={A.ME[role] ?? "Plant head A."} />
            </div>
            {!c && (a.options || stop) && canAct ? (
              <CardActions
                actions={(a.options ?? []).map((o) => ({
                  ...o,
                  allowed,
                  reason: `${roleNames(a.who.roles)} can decide`,
                  done: <span>{o.done} <Link href="/activity">Recorded in Activity.</Link></span>,
                }))}
                stop={stop}
              />
            ) : null}
            {!c && a.who.how === "Recommend only" && !a.options ? (
              <p className="muted" style={{ margin: "12px 0 0", fontSize: 13 }}>No write-back from this screen. Plan the change in the plant system after acceptance.</p>
            ) : null}
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
