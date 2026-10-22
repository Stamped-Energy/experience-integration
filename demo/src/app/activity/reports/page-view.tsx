"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { nameOf } from "@/lib/names";
import { Fragment } from "react";
import * as D from "@/lib/demo/data";
import type { Report } from "@/lib/demo/types";
import { demoRole } from "@/lib/role";
import { can } from "@/lib/rbac";
import { dayMonth, hhmm } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { deniedReason } from "@/components/cards/DecisionCard";
import { DataTable, EvidenceTag, Illustrative, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { ConfirmAction } from "@/components/settings/Confirm";
import { ActivityTabs, crumbs, objHref, personName, roleName } from "@/components/activity/common";

const statusTag = (r: Report) => r.status === "approved" ? <Tag tone="success" dot>Approved</Tag> : r.status === "awaiting approval" ? <Tag tone="warning" dot>Awaiting approval</Tag> : <Tag>Draft</Tag>;
const contents: Record<string, string> = {
  "Monthly value": "Verified and indicative value items, each with its proof record and evidence label. Kept separate; no total.",
  "Trial report": "Trial design, switch schedule, stops and restores, and the verdict with its band.",
  "Weekly note": "Claims from the week with their evidence labels, and decisions taken.",
  "Audit export": "Every audit event in the period with before and after, person, role and source.",
};

function Preview({ r }: { r: Report }) {
  const trial = r.kind === "Trial report" ? D.trials.find((t) => t.id === `trial-${r.period.replace(/\D/g, "")}`) : undefined;
  const proof = trial && D.proofRecords.find((p) => p.objectId === trial.id);
  const note = r.kind === "Weekly note" ? D.notes.find((n) => n.kind === "weekly") : undefined;
  return (
    <div className="rep-preview">
      <div className="label">Preview · {r.formats.join(", ")}</div>
      <h4>{r.kind}, {r.period}</h4>
      <p className="muted" style={{ margin: "0 0 8px" }}>{contents[r.kind]}</p>
      {r.kind === "Monthly value" && <table><thead><tr><th>Item</th><th>Status</th><th>Proof</th></tr></thead><tbody>{D.valueItems.map((v) => <tr key={v.id}><td>{v.title}<span className="cell-sub">{D.byId.line(v.lineId)?.short}</span></td><td><Tag tone={v.status === "Verified" ? "success" : "neutral"}>{v.status}</Tag></td><td className="mono">{nameOf(v.proofRecordId)}</td></tr>)}</tbody></table>}
      {trial && <><dl className="facts-grid"><dt>Change</dt><dd>{trial.change}</dd><dt>Switches</dt><dd>{trial.switches.filter((s) => s.done).length} of {trial.switches.length} done</dd><dt>Status</dt><dd>{trial.status}</dd>{proof && <><dt>Verdict</dt><dd>{proof.verdict}; {proof.effect.measure} {proof.effect.value} ({proof.effect.low} to {proof.effect.high}) {proof.effect.unit}</dd></>}</dl>
        {proof && <table><tbody>{proof.questions.map((q) => <tr key={q.question}><td>{q.question}</td><td><EvidenceTag label={q.label} /></td></tr>)}</tbody></table>}</>}
      {note && <p style={{ margin: "4px 0" }}><strong>{note.title}</strong> · {dayMonth(note.at)}</p>}
      {note && <table><tbody>{note.claims.map((c, i) => <tr key={i}><td>{c.text}</td><td><EvidenceTag label={c.label} /></td></tr>)}</tbody></table>}
      {note && <><div className="label" style={{ marginTop: 12 }}>Decisions taken</div><table><tbody>{D.auditEvents.filter((e) => /Accepted|Declined|Signed|Pressed/.test(e.action)).slice(0, 8).map((e) => <tr key={e.id}><td className="mono">{dayMonth(e.at)}</td><td>{e.action}</td><td className="mono">{nameOf(e.objectId)}</td><td>{personName(e.personId)}</td></tr>)}</tbody></table></>}
      {r.kind === "Audit export" && <table><thead><tr><th>Time</th><th>Person</th><th>Action</th><th>Object</th></tr></thead><tbody>{D.auditEvents.slice(0, 8).map((e) => <tr key={e.id}><td className="mono">{dayMonth(e.at)} {hhmm(e.at)}</td><td>{personName(e.personId)}</td><td>{e.action}</td><td className="mono">{nameOf(e.objectId)}</td></tr>)}</tbody></table>}
      <p className="muted" style={{ margin: "8px 0 0", fontSize: 12 }}>Every figure keeps its evidence label in the export.</p>
    </div>
  );
}

export default function Reports() {
  const sp = Object.fromEntries(useSearchParams().entries());
  const role = demoRole();
  const ex = can(role, "export-reports");
  const exReason = deniedReason("export-reports", "export reports");
  const approve = role === "plant-head";
  const sel = D.reports.find((r) => r.id === sp.r) ?? D.reports.find((r) => r.status === "awaiting approval") ?? D.reports[0];
  const queue = D.reports.filter((r) => r.status !== "approved");
  const exports = D.auditEvents.filter((e) => e.action === "Exported report").slice(0, 6);
  const exportBtns = (r: Report) => <span className="scope-chips">{r.formats.map((f) => <ConfirmAction key={f} label={f} allowed={ex && r.status === "approved"} reason={r.status !== "approved" ? "Needs approval before export" : exReason} title={`Export ${r.kind} as ${f}`} body={<p>{r.kind}, {r.period}. Evidence labels stay on every figure.</p>} confirm="Export" done="Exported." />)}</span>;
  return (
    <Workspace crumbs={crumbs({ label: "Reports and exports" })} askContext="Reports and exports">
      <PageHeader eyebrow="Activity" title="Reports and exports" meta="Reports that leave the plant. Each needs the plant head's approval before it can be exported." actions={<ConfirmAction label="New report" primary allowed={ex} reason={exReason} title="Start a report" body={<p>Pick weekly note, trial results, lots caught or audit extract, and the period.</p>} confirm="Start draft" done="Draft started." />} />
      <ActivityTabs active="reports" />
      <div className="grid">
        <div className="span-8 xl-span-5 stack">
          <Section title="Reports" meta={`${D.reports.length} reports`} flush>
            <DataTable caption="Reports" rowKey={(r) => r.id} rows={D.reports} columns={[
              { key: "k", label: "Report", render: (r) => <Link className={`link${r.id === sel.id ? " strong" : ""}`} scroll={false} prefetch={false} href={`/activity/reports?r=${r.id}`}>{r.kind}<span className="cell-sub">{r.period}</span></Link> },
              { key: "s", label: "Status", render: statusTag },
              { key: "a", label: "Approved by", render: (r) => r.approvedBy ?? "" },
              { key: "f", label: "Export", render: exportBtns },
            ]} />
          </Section>
          <Section title="What each report holds" flush>
            <dl className="facts-grid" style={{ padding: "12px 16px" }}>{Object.entries(contents).map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}</dl>
          </Section>
          <Section title="Recent exports" meta="From the audit log" flush>
            <DataTable caption="Exports" rowKey={(e) => e.id} rows={exports} columns={[
              { key: "t", label: "When", render: (e) => `${dayMonth(e.at)} ${hhmm(e.at)}` },
              { key: "p", label: "Person", render: (e) => <>{personName(e.personId)}<span className="cell-sub">{roleName(e.role)}</span></> },
              { key: "o", label: "Report", render: (e) => <Link className="link" href={objHref(e)!}>{nameOf(e.objectId)}</Link> },
              { key: "a", label: "", render: (e) => <Link className="link" href={`/activity?e=${e.id}`}>In audit log</Link> },
            ]} />
          </Section>
        </div>
        <div className="span-4 xl-span-3 stack">
          <Section title="Approval queue" meta={`${queue.length} waiting`} actions={<Illustrative />} flush>
            <div className="rows">{queue.map((r) => (
              <div key={r.id} className="row" style={{ gridTemplateColumns: "minmax(0,1fr)" }}>
                <span><span className="row-title" style={{ display: "block" }}><Link className="link" scroll={false} prefetch={false} href={`/activity/reports?r=${r.id}`}>{r.kind}, {r.period}</Link></span><span className="row-sub">{r.status === "draft" ? "Draft; send for approval when ready" : "Waiting for the plant head"}</span>
                  <span className="scope-chips" style={{ marginTop: 6 }}>{statusTag(r)}{r.status === "awaiting approval"
                    ? <><ConfirmAction label="Approve" primary allowed={approve} reason="Only the plant head approves reports" title={`Approve ${r.kind}`} body={<p>Once approved it can be exported as {r.formats.join(", ")}.</p>} confirm="Approve" done="Approved." /><ConfirmAction label="Send back" allowed={approve} reason="Only the plant head approves reports" title="Send back" body={<p>Returns the report to draft with your note.</p>} confirm="Send back" done="Sent back." /></>
                    : <ConfirmAction label="Send for approval" allowed={ex} reason={exReason} title="Send for approval" body={<p>The plant head is asked to approve.</p>} confirm="Send" done="Sent." />}</span>
                </span>
              </div>))}</div>
          </Section>
          <Section title="Approved" meta={`${D.reports.filter((r) => r.status === "approved").length} reports`} flush>
            <div className="rows">{D.reports.filter((r) => r.status === "approved").map((r) => <div key={r.id} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span><span className="row-title" style={{ display: "block" }}>{r.kind}, {r.period}</span><span className="row-sub">{r.approvedBy} · {r.formats.join(", ")}</span></span>{statusTag(r)}</div>)}</div>
          </Section>
          <Section title="Rules for exports">
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}><li>Approval before export, every time.</li><li>Evidence labels travel with each figure.</li><li>Each export is written to the audit log.</li></ul>
          </Section>
          <div className="xl-hide"><Section title="Preview">{<Preview r={sel} />}</Section></div>
        </div>
        <div className="xl-only xl-span-4 stack"><Section title="Preview" meta={nameOf(sel.id)}><Preview r={sel} /></Section></div>
      </div>
    </Workspace>
  );
}
