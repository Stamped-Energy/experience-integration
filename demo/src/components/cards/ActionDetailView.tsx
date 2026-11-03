"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import type { ExampleAction, RoleId } from "@/lib/demo/types";
import {
  actionHref,
  actionShortTitle,
  decisionOptionPair,
  getAction,
  optionShortLabel,
  whoDecidesShort,
} from "@/lib/demo/actions";
import { detailFor } from "@/lib/demo/actionDetail";
import { actionOutcomesForDisplay, calculationsForAction } from "@/lib/demo/actionOutcomes";
import { byId, roles, runs } from "@/lib/demo/data";
import { demoRole } from "@/lib/role";
import { can } from "@/lib/rbac";
import { dayMonth, hhmm } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { ActionOutcomeStrip } from "@/components/cards/ActionOutcomeStrip";
import { CardActions } from "@/components/cards/CardActions";
import { deniedReason } from "@/components/cards/DecisionCard";
import { DataTable, EvidenceTag, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { SpcControlChart } from "@/components/view/spc-control-chart";
import * as A from "@/lib/demo/agent";
import { crumbs as processCrumbs, processEyebrow, runLabel } from "@/components/process/common";
import { crumbs as qualityCrumbs, lotNo, qualityEyebrow } from "@/components/quality/common";

function roleNames(ids: RoleId[]) {
  const n = ids.map((r) => roles.find((x) => x.id === r)!.name);
  return n.length > 1 ? `${n.slice(0, -1).join(", ")} or ${n[n.length - 1]}` : n[0];
}

function detailBarActions(a: ExampleAction, role: RoleId) {
  const { primary, secondary } = decisionOptionPair(a);
  const allowed = a.who.roles.includes(role);
  const reason = `${roleNames(a.who.roles)} can decide`;
  const acts = [];
  if (primary) {
    acts.push({
      ...primary,
      label: optionShortLabel(a.id, primary.id, primary.label),
      primary: true as const,
      allowed,
      reason,
      done: (
        <span>
          {primary.done} <Link href="/activity">Recorded in Activity.</Link>
        </span>
      ),
    });
  }
  if (secondary) {
    acts.push({
      ...secondary,
      label: optionShortLabel(a.id, secondary.id, secondary.label),
      primary: false as const,
      allowed,
      reason,
      done: (
        <span>
          {secondary.done} <Link href="/activity">Recorded in Activity.</Link>
        </span>
      ),
    });
  }
  return acts;
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
  const outcomes = actionOutcomesForDisplay(a);
  const calcs = calculationsForAction(a);
  const spcChart = detail.spc;
  const barActions = !c && a.options?.length ? detailBarActions(a, role) : [];

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
        <ActionOutcomeStrip outcomes={outcomes} />
        <p className="action-detail-hero-cap muted">
          Illustrative outcomes on the demonstration plant model
          {c?.result ? (
            <>
              {" "}
              · <Tag tone={c.result.status === "Verified" ? "success" : "neutral"}>{c.result.status}</Tag> {c.result.band}
            </>
          ) : null}
        </p>
      </div>
      {!c && (barActions.length || stop) ? (
        <div className="action-detail-bar">
          <CardActions
            large
            actions={barActions}
            stop={stop}
            assignBar={{
              initial: A.assigned[a.id],
              people: A.PEOPLE,
              canAssign: A.ASSIGNERS.includes(role),
              by: A.ME[role] ?? "Plant head A.",
            }}
          />
        </div>
      ) : null}
      <div className="grid action-detail-grid">
        <div className="span-8 stack">
          <Section title="What changes">
            <p className="detail-lede">{c ? c.changed : a.action}</p>
            <p className="detail-body">{a.seen}</p>
            <p className="detail-why muted">{a.why}</p>
          </Section>
          <Section title="How we calculated this" meta="Inputs, formula and result for each outcome on this card" flush>
            <DataTable
              caption="Outcome calculations"
              rowKey={(r) => r.metric}
              rows={calcs}
              columns={[
                { key: "m", label: "Metric", width: "16%", render: (r) => <span style={{ fontWeight: 600 }}>{r.metric}</span> },
                { key: "i", label: "Inputs", width: "26%", render: (r) => <ul className="calc-inputs">{r.inputs.map((x) => <li key={x}>{x}</li>)}</ul> },
                { key: "f", label: "Formula", width: "26%", render: (r) => <span className="calc-formula">{r.formula}</span> },
                { key: "r", label: "Result", width: "22%", mono: true, render: (r) => <span className="calc-result">{r.result}</span> },
                { key: "l", label: "Basis", width: "10%", render: (r) => <EvidenceTag label={r.label} /> },
              ]}
            />
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
            {spcChart ? (
              <div className="action-detail-charts">
                <SpcControlChart {...spcChart} height={240} />
              </div>
            ) : null}
          </Section>
          <Section title="Recommended steps">
            <ol className="detail-steps">
              {detail.steps.map((s) => (
                <li key={s}>{s}</li>
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
              {A.assigned[a.id] ? (
                <span className="assignee" title={`Assigned by ${A.assigned[a.id]!.by}`}>
                  <span className="av">
                    {A.assigned[a.id]!.to
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  {A.assigned[a.id]!.to}
                </span>
              ) : (
                <span className="muted">Unassigned</span>
              )}
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
                  {
                    key: "l",
                    label: "Record",
                    render: (r) => (
                      <Link className="link" href={r.href}>
                        {r.label}
                      </Link>
                    ),
                  },
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
