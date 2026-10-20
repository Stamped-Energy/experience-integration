import Link from "next/link";
import * as D from "@/lib/demo/data";
import type { AuditEvent } from "@/lib/demo/types";
import { currentRole } from "@/lib/role";
import { grant } from "@/lib/rbac";
import { dayMonth, hhmm, rel } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, EmptyState, EvidenceTag, Illustrative, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { ActivityTabs, Chips, KINDS, auditHref, crumbs, dayKey, kindOf, lineOf, objHref, personName, roleName, type AuditFilter } from "@/components/activity/common";

export const metadata = { title: "Audit log" };

function Obj({ e }: { e: AuditEvent }) {
  const h = objHref(e);
  return h ? <Link className="link mono" href={h}>{e.objectId}</Link> : <span className="mono">{e.objectId}</span>;
}
function Diff({ e }: { e: AuditEvent }) {
  if (!e.before && !e.after) return <span className="muted">No value change</span>;
  return <span className="diff"><del>{e.before ?? "none"}</del><span aria-hidden>→</span><ins>{e.after ?? "none"}</ins></span>;
}

export default async function Audit({ searchParams }: { searchParams: Promise<AuditFilter & { n?: string }> }) {
  const f = await searchParams;
  const role = await currentRole();
  const g = grant(role, "audit-log");
  if (g === "hidden") return (
    <Workspace crumbs={crumbs({ label: "Audit log" })} askContext="Audit log">
      <PageHeader eyebrow="Activity" title="Audit log" />
      <ActivityTabs active="audit" />
      <EmptyState title="The audit log is not shown for your role" body={`${roleName(role)} cannot view the audit log at this plant. The plant head, owner and engineers can. Your own decisions still show on your cards.`} />
    </Workspace>
  );
  const rows = D.auditEvents.filter((e) => (!f.line || lineOf(e) === f.line) && (!f.kind || kindOf(e.action) === f.kind) && (!f.person || e.personId === f.person) && (!f.day || dayKey(e.at) === f.day));
  const n = Math.max(25, Number(f.n) || 25);
  const shown = rows.slice(0, n);
  const sel = D.auditEvents.find((e) => e.id === f.e) ?? rows[0];
  const days = [...new Set(D.auditEvents.map((e) => dayKey(e.at)))].slice(0, 6);
  const persons = [...new Set(D.auditEvents.map((e) => e.personId))];
  const sameObj = sel ? D.auditEvents.filter((e) => e.objectId === sel.objectId && e.id !== sel.id).slice(0, 6) : [];
  const prop = sel && D.byId.proposal(sel.objectId);
  const trial = sel && D.byId.trial(sel.objectId);
  const win = sel && D.signedWindows.find((w) => w.id === sel.objectId);
  const stop = sel && sel.action === "Pressed Stop" ? D.stopEvents.find((s) => s.trialId === sel.objectId) : undefined;
  const byKind = KINDS.map((k) => ({ k, n: D.auditEvents.filter((e) => kindOf(e.action) === k).length }));
  const last24 = D.auditEvents.filter((e) => Date.parse(D.DEMO_NOW) - Date.parse(e.at) < 864e5);
  const byPerson = persons.map((p) => ({ p, n: rows.filter((e) => e.personId === p).length, last: rows.find((e) => e.personId === p) })).filter((x) => x.n).sort((a, b) => b.n - a.n);
  const href = (p: Partial<AuditFilter>) => auditHref({ ...f, e: undefined, ...p });

  const detail = sel && (
    <>
      <Section title={sel.action} meta={<span className="mono">{sel.id}</span>} actions={<Illustrative />}>
        <dl className="facts-grid">
          <dt>When</dt><dd>{dayMonth(sel.at)} {hhmm(sel.at)} IST · {rel(sel.at)}</dd>
          <dt>Person</dt><dd>{personName(sel.personId)}, {roleName(sel.role)}</dd>
          <dt>Object</dt><dd>{sel.objectType} <Obj e={sel} /></dd>
          <dt>Line</dt><dd>{D.byId.line(lineOf(sel) ?? "")?.name ?? "Plant-wide"}</dd>
          <dt>Source</dt><dd>{sel.channel === "system" ? "Written by Stamped inside signed limits" : sel.channel === "email" ? "Decided from email" : "Decided in Stamped"}</dd>
          {sel.reason && <><dt>Reason</dt><dd>{sel.reason}</dd></>}
        </dl>
      </Section>
      <Section title="Before and after">
        {sel.before || sel.after ? <div className="diff-box"><div><div className="label">Before</div><div className="v">{sel.before ?? "none"}</div></div><div><div className="label">After</div><div className="v">{sel.after ?? "none"}</div></div></div>
          : <p className="muted" style={{ margin: 0, fontSize: 13 }}>This event did not change a value. It records a decision about <Obj e={sel} />.</p>}
      </Section>
      {(prop || trial || win || stop) && <Section title="Evidence on the object" flush>
        <dl className="facts-grid" style={{ padding: "12px 16px" }}>
          {prop && <><dt>Proposal</dt><dd>{prop.param}: {prop.current} to {prop.proposed} <EvidenceTag label={prop.weakestLabel} /></dd><dt>State</dt><dd>{prop.state}{prop.declineReason ? `; ${prop.declineReason}` : ""}</dd><dt>Evidence</dt><dd className="mono">{prop.evidenceIds.join(", ")}</dd></>}
          {trial && <><dt>Trial</dt><dd>{trial.change}</dd></>}
          {stop && <><dt>Stop</dt><dd>{stop.effect}; {stop.restoreResult}</dd></>}
          {win && <><dt>Window</dt><dd>{win.name}: {win.low} to {win.high} {win.unit}, signed by {win.signedBy}, v{win.version}</dd></>}
        </dl>
      </Section>}
      <Section title="Other events on this object" meta={`${sameObj.length} shown`} flush>
        <ul className="tl" style={{ padding: "8px 16px" }}>{sameObj.map((e) => <li key={e.id}><span className="t">{dayMonth(e.at)}</span><span className="k s" /><span><Link className="link" scroll={false} prefetch={false} href={auditHref({ ...f, e: e.id })}>{e.action}</Link><span className="cell-sub">{personName(e.personId)} {hhmm(e.at)}</span></span><span /></li>)}</ul>
      </Section>
      <Section title="By person" meta="In this view" flush>
        <DataTable caption="By person" rowKey={(x) => x.p} rows={byPerson} columns={[
          { key: "p", label: "Person", render: (x) => <Link className="link" scroll={false} prefetch={false} href={href({ person: x.p })}>{personName(x.p)}</Link> },
          { key: "n", label: "Events", align: "right", render: (x) => x.n },
          { key: "l", label: "Last", render: (x) => x.last ? <>{x.last.action}<span className="cell-sub">{rel(x.last.at)}</span></> : "" },
        ]} />
      </Section>
    </>
  );

  return (
    <Workspace crumbs={crumbs({ label: "Audit log" })} askContext="Audit log">
      <PageHeader eyebrow="Activity" title="Audit log" meta="Who approved, overrode, stopped and signed, with before and after. Read only; entries cannot be edited or removed."
        actions={<><AskButton context="Audit log" label="Ask about this log" /><Link className="btn" href="/activity/reports?r=rep-4">Export audit extract</Link></>} />
      <ActivityTabs active="audit" />
      {g === "view" && <div className="set-note" style={{ marginBottom: 12 }}>{roleName(role)}: view only. Exports are for the plant head and owner.</div>}
      <div className="stat-row" style={{ marginBottom: 16 }}>
        <div className="stat"><div className="label">Events</div><div className="v">{D.auditEvents.length}</div><div className="s">{last24.length} in the last 24 h</div></div>
        {byKind.map((k) => <Link key={k.k} href={href({ kind: f.kind === k.k ? undefined : k.k })} scroll={false} prefetch={false} className={`stat stat-link${f.kind === k.k ? " on" : ""}`}><div className="label">{k.k}</div><div className="v">{k.n}</div><div className="s">{Math.round((100 * k.n) / D.auditEvents.length)}% of events</div></Link>)}
      </div>
      <div className="filters" role="group" aria-label="Filter the audit log">
        <Chips label="Line" current={f.line} make={(v) => href({ line: v })} items={[{ t: "All" }, ...D.lines.map((l) => ({ v: l.id, t: l.short }))]} />
        <Chips label="Action" current={f.kind} make={(v) => href({ kind: v })} items={[{ t: "All" }, ...KINDS.map((k) => ({ v: k, t: k }))]} />
        <Chips label="Day" current={f.day} make={(v) => href({ day: v })} items={[{ t: "All" }, ...days.map((d) => ({ v: d, t: dayMonth(d + "T12:00:00+05:30") }))]} />
      </div>
      <div className="filters" role="group" aria-label="Filter by person">
        <Chips label="Person" current={f.person} make={(v) => href({ person: v })} items={[{ t: "Everyone" }, ...persons.map((p) => ({ v: p, t: personName(p) }))]} />
      </div>
      <div className="grid">
        <div className="span-8 xl-span-8 stack">
          <Section title="Events" meta={`${rows.length} of ${D.auditEvents.length}`} flush>
            <DataTable caption="Audit events" rowKey={(e) => e.id} rows={shown} columns={[
              { key: "t", label: "Time", render: (e) => <Link className={`link${sel?.id === e.id ? " strong" : ""}`} scroll={false} prefetch={false} href={auditHref({ ...f, e: e.id })}>{dayMonth(e.at)} {hhmm(e.at)}</Link> },
              { key: "p", label: "Person", render: (e) => <>{personName(e.personId)}<span className="cell-sub">{roleName(e.role)}</span></> },
              { key: "a", label: "Action", render: (e) => e.action },
              { key: "o", label: "Object", render: (e) => <Obj e={e} /> },
              { key: "d", label: "Before → after", render: (e) => <Diff e={e} /> },
              { key: "l", label: "Line", render: (e) => D.byId.line(lineOf(e) ?? "")?.short ?? "Plant" },
              { key: "s", label: "Source", render: (e) => <Tag>{e.channel === "system" ? "system" : e.channel}</Tag> },
            ]} />
            {rows.length > n && <div className="card-foot"><span className="muted" style={{ fontSize: 12 }}>Showing {n} of {rows.length}</span><span className="spacer" /><Link className="btn btn-sm" scroll={false} prefetch={false} href={auditHref({ ...f, n: String(n + 25) } as AuditFilter)}>Show 25 more</Link></div>}
          </Section>
        </div>
        <div className="span-4 xl-span-4 stack">{detail ?? <EmptyState title="No event selected" body="Pick an event to see the detail." />}</div>
      </div>
    </Workspace>
  );
}
