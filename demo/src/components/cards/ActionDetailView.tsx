"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import type { ExampleAction, RoleId } from "@/lib/demo/types";
import { actionHref, actionOutcomeForDisplay, actionShortTitle, getAction, whoDecidesShort } from "@/lib/demo/actions";
import { detailFor, type ActionDetailExtra } from "@/lib/demo/actionDetail";
import { byId, roles, runs } from "@/lib/demo/data";
import { demoRole } from "@/lib/role";
import { can } from "@/lib/rbac";
import { dayMonth, hhmm } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { ActionOutcomeLine } from "@/components/cards/ActionOutcomeLine";
import { CardActions } from "@/components/cards/CardActions";
import { deniedReason } from "@/components/cards/DecisionCard";
import { DataTable, EvidenceTag, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { SpcControlChart, type SpcControlChartProps } from "@/components/view/spc-control-chart";
import { Assign } from "@/components/agent/Assign";
import * as A from "@/lib/demo/agent";
import { crumbs as processCrumbs, processEyebrow, runLabel } from "@/components/process/common";
import { crumbs as qualityCrumbs, lotNo, qualityEyebrow } from "@/components/quality/common";

function roleNames(ids: RoleId[]) {
  const n = ids.map((r) => roles.find((x) => x.id === r)!.name);
  return n.length > 1 ? `${n.slice(0, -1).join(", ")} or ${n[n.length - 1]}` : n[0];
}

function trendAsSpc(trend: NonNullable<ActionDetailExtra["trend"]>): SpcControlChartProps {
  const values = trend.values;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sd = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length) || Math.abs(mean) * 0.02 || 1;
  const unit = trend.unit ?? "";
  return {
    title: trend.label,
    subtitle: unit ? `Unit: ${unit}` : undefined,
    chartKind: "i_mr",
    primary: {
      label: unit || trend.label,
      values,
      hits: [values.length - 1],
    },
    cl: +mean.toFixed(3),
    ucl: +(mean + 3 * sd).toFixed(3),
    lcl: +(mean - 3 * sd).toFixed(3),
    lsl: trend.spec?.[0],
    usl: trend.spec?.[1],
  };
}

function detailBarOptions(a: ExampleAction) {
  if (!a.options?.length) return [];
  const primary = a.options.find((o) => o.primary) ?? a.options[0];
  const decline =
    a.options.find((o) => /decline|keep|continue|normal|reject|sample/i.test(o.id) && o.id !== primary.id) ??
    a.options.find((o) => o !== primary);
  return [
    { ...primary, label: "Decide", primary: true },
    ...(decline ? [{ ...decline, label: "Decline", primary: false as const }] : []),
    { id: "reassign", label: "Reassign", primary: false as const, done: "Use Approval to assign or reassign this action." },
  ];
}

export function ActionDetailView({ id }: { id: string }) {
  const a = getAction(id);
  if (!a) notFound();
  const role = demoRole();
  const line = byId.line(a.lineId)!;
  const detail = detailFor(a);
  const listHref = a.area === "Process" ? "/process/actions" : "/quality/actions";
  const crumbs =
    a.area === "Process"
      ? processCrumbs({ label: "Actions", href: listHref }, { label: actionShortTitle(a) })
      : qualityCrumbs({ label: "Actions", href: listHref }, { label: actionShortTitle(a) });
  const eyebrow = a.area === "Process" ? processEyebrow(actionHref(a)) : qualityEyebrow(actionHref(a));
  const c = a.closed;
  const stop =
    a.who.how === "On its own, inside the signed band"
      ? { effect: "Stopped. The previous setting comes back and nothing new is written.", allowed: can(role, "press-stop", a.lineId), reason: deniedReason("press-stop", "press Stop") }
      : undefined;
  const allowed = a.who.roles.includes(role);
  const canAct = allowed || !!stop?.allowed;
  const outcome = actionOutcomeForDisplay(a);
  const charts: SpcControlChartProps[] = [];
  if (detail.spc) charts.push(detail.spc);
  if (detail.trend) charts.push(trendAsSpc(detail.trend));
  const barOpts = detailBarOptions(a);

  return (
    <Workspace crumbs={crumbs} askContext={actionShortTitle(a)}>
      <p className="detail-back">
        <Link className="link" href={listHref} scroll={false}>
          ← Back to actions
        </Link>
      </p>
      <PageHeader
        eyebrow={eyebrow}
        title={actionShortTitle(a)}
        meta={
          <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Tag tone="neutral">{a.mechanism}</Tag>
            <span className="muted">{line.short}</span>
          </span>
        }
        actions={<AskButton context={actionShortTitle(a)} label="Ask about this action" />}
      />
      <div className="action-detail-hero">
        <ActionOutcomeLine outcome={outcome} size="hero" />
      </div>
      {!c && (barOpts.length || stop) && canAct ? (
        <div className="action-detail-bar">
          <CardActions
            large
            actions={barOpts.map((o) => ({
              id: o.id,
              label: o.label,
              primary: o.primary,
              allowed: o.id === "reassign" ? A.ASSIGNERS.includes(role) : allowed,
              reason: o.id === "reassign" ? "Shift lead, process engineer, quality head or plant head can assign." : `${roleNames(a.who.roles)} can decide`,
              done: (
                <span>
                  {o.done} <Link href="/activity">Recorded in Activity.</Link>
                </span>
              ),
            }))}
            stop={stop}
          />
        </div>
      ) : null}
      <div className="grid">
        <div className="span-8 stack">
          <Section title="Summary">
            <p style={{ margin: "0 0 8px", lineHeight: 1.5 }}>{a.seen}</p>
            <p className="ex-why" style={{ margin: 0 }}>
              <b>Why it matters:</b> {a.why}
            </p>
          </Section>
          <Section title="Outcome" meta={`${outcome.label} on the demonstration plant model`}>
            <ActionOutcomeLine outcome={outcome} />
            {c?.result ? (
              <p style={{ margin: "12px 0 0", fontSize: 13 }}>
                <Tag tone={c.result.status === "Verified" ? "success" : "neutral"}>{c.result.status}</Tag> {c.result.band}
              </p>
            ) : null}
          </Section>
          <Section title="Evidence" meta="Trends, control charts and sensor-backed records" flush>
            <DataTable
              caption="Evidence records"
              rowKey={(e) => e.id ?? e.text}
              rows={a.evidence}
              columns={[
                { key: "id", label: "Source", mono: true, render: (e) => e.id ?? "—" },
                { key: "l", label: "Label", render: (e) => <EvidenceTag label={e.label} /> },
                { key: "t", label: "Record", render: (e) => e.text },
              ]}
            />
            {charts.length ? (
              <div className="action-detail-charts">
                {charts.map((ch) => (
                  <SpcControlChart key={ch.title} {...ch} height={220} />
                ))}
              </div>
            ) : null}
          </Section>
          <Section title="Recommended steps">
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.5 }}>
              {detail.steps.map((s) => (
                <li key={s} style={{ marginBottom: 6 }}>
                  {s}
                </li>
              ))}
            </ol>
          </Section>
        </div>
        <div className="span-4 stack ctx">
          <Section title="Approval" meta="Recommend only; the operator or named role approves in the plant system">
            <dl className="facts-grid">
              <dt>Change</dt>
              <dd>{c ? c.changed : a.action}</dd>
              <dt>Who</dt>
              <dd>
                <Tag tone="neutral">{whoDecidesShort(a.who.how)}</Tag> {roleNames(a.who.roles)}
              </dd>
              <dt>Note</dt>
              <dd>{a.who.note}</dd>
              {c ? (
                <>
                  <dt>Decision</dt>
                  <dd>
                    {c.by} · {dayMonth(c.at)} {hhmm(c.at)}
                  </dd>
                </>
              ) : null}
            </dl>
            <div className="ex-meta action-detail-assign" style={{ marginTop: 12 }}>
              <Assign initial={A.assigned[a.id]} people={A.PEOPLE} canAssign={A.ASSIGNERS.includes(role)} by={A.ME[role] ?? "Plant head A."} />
            </div>
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
                  { key: "l", label: "Record", render: (r) => (
                    <Link className="link" href={r.href}>
                      {r.label}
                    </Link>
                  ) },
                ]}
              />
            </Section>
          ) : null}
          {detail.similarCases?.length ? (
            <Section title="Similar cases" flush>
              <div className="rows">
                {detail.similarCases.map((s) => (
                  <Link key={s.href} href={s.href} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                    <span>
                      <span className="row-title" style={{ display: "block" }}>
                        {s.title}
                      </span>
                      <span className="row-sub">{s.band}</span>
                    </span>
                    <Tag tone="neutral">Open</Tag>
                  </Link>
                ))}
              </div>
            </Section>
          ) : null}
          <Section title="Risks">
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.5 }}>
              {detail.risks.map((r) => (
                <li key={r} style={{ marginBottom: 6 }}>
                  {r}
                </li>
              ))}
            </ul>
          </Section>
          {detail.simulation ? (
            <Section title="Simulation or trial" meta={detail.simulation.summary}>
              <Link className="link" href={detail.simulation.href}>
                {detail.simulation.title}
              </Link>
            </Section>
          ) : null}
        </div>
      </div>
    </Workspace>
  );
}
