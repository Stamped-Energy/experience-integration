/** Settings shell: section list on the left, content, and at 1920 an aside with help, history and who can change it. */
import Link from "next/link";
import { nameOf } from "@/lib/names";
import type { ReactNode } from "react";
import * as D from "@/lib/demo/data";
import type { ActionId } from "@/lib/demo/types";
import { ACTION_LABELS, whoCan } from "@/lib/rbac";
import { dayMonth, hhmm } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { Illustrative, PageHeader, Section, Tag } from "@/components/ui/primitives";

export type SettingsKey = "limits" | "approvals" | "people" | "routing" | "assignment" | "integrations" | "plant" | "screens";
export const SECTIONS: { key: SettingsKey; label: string; href: string; sub: string }[] = [
  { key: "limits", label: "Signed limits", href: "/settings/limits", sub: `${D.signedWindows.length} windows` },
  { key: "screens", label: "Screen toggles", href: "/settings/screens", sub: "Process & Quality nav" },
  { key: "approvals", label: "Standing approvals", href: "/settings/approvals", sub: `${D.standingApprovals.filter((a) => !a.revokedAt).length} active · ${D.standingApprovals.filter((a) => a.revokedAt).length} revoked` },
  { key: "people", label: "People and roles", href: "/settings/people", sub: `${D.people.length} people · ${D.roles.length} roles` },
  { key: "routing", label: "Routing and notifications", href: "/settings/routing", sub: `${D.assignments.length} scopes` },
  { key: "assignment", label: "Assignment matrix", href: "/settings/assignment", sub: "Who owns and who assigns" },
  { key: "integrations", label: "Integrations", href: "/settings/integrations", sub: `${D.integrations.length} connections` },
  { key: "plant", label: "Plant setup", href: "/settings/plant", sub: `${D.lines.length} lines · ${D.shifts.length} shifts` },
];
export const roleName = (r: string) => D.roles.find((x) => x.id === r)?.name ?? r;

export function SettingsPage({ section, title, meta, actions, children, help, changes, audit, side }: { side?: ReactNode; section: SettingsKey; title: string; meta: string; actions?: ReactNode; children: ReactNode; help: ReactNode; changes: ActionId[]; audit: RegExp }) {
  const s = SECTIONS.find((x) => x.key === section)!;
  const history = D.auditEvents.filter((a) => audit.test(a.action)).slice(0, 5);
  const aside = (
    <>
      <Section title="About this setting" actions={<Illustrative />}>{help}</Section>
      <Section title="Who can change this" flush>
        <div className="rows">{changes.map((a) => <div key={a} className="row" style={{ gridTemplateColumns: "minmax(0,1fr)" }}><span><span className="row-title" style={{ display: "block" }}>{ACTION_LABELS[a]}</span><span className="row-sub">{whoCan(a).map(roleName).join(", ") || "Nobody"}</span></span></div>)}</div>
      </Section>
      <Section title="History" meta="From the audit log" flush>
        {history.length ? <ul className="tl" style={{ padding: "8px 16px" }}>{history.map((h) => <li key={h.id}><span className="t">{dayMonth(h.at)}</span><span className="k s" /><span>{h.action} · <span >{nameOf(h.objectId)}</span><span className="cell-sub">{roleName(h.role)} {hhmm(h.at)}</span></span><span /></li>)}</ul> : <p className="muted" style={{ margin: 16, fontSize: 13 }}>No changes in the log yet.</p>}
      </Section>
    </>
  );
  const now = Date.parse(D.DEMO_NOW);
  const attention: { k: string; t: string; sub?: string; href: string }[] = [
    ...D.standingApprovals.filter((a) => !a.revokedAt && (Date.parse(a.until) - now) / 864e5 <= 3).map((a) => ({ k: a.id, t: `${D.byId.line(a.lineId)?.short ?? a.lineId} standing approval expires ${dayMonth(a.until)}`, href: "/settings/approvals" })),
    ...D.webhooks.filter((w) => w.status === "failing" || w.status === "paused").map((w) => ({ k: w.id, t: `Webhook ${w.status}: ${new URL(w.url).hostname}`, sub: w.note, href: "/settings/integrations" })),
    ...D.integrations.filter((i) => i.status !== "connected").map((i) => ({ k: i.id, t: `${i.name} ${i.status}`, href: "/settings/integrations" })),
    ...D.signedWindows.filter((w) => (Date.parse(w.expiresAt) - now) / 864e5 <= 14).map((w) => ({ k: w.lineId + w.param, t: `${w.name} window expires ${dayMonth(w.expiresAt)}`, href: "/settings/limits" })),
  ];
  return (
    <Workspace crumbs={[{ label: "Demonstration plant", href: "/" }, { label: "Settings", href: "/settings" }, { label: s.label }]} askContext={s.label}>
      <div className="set-layout">
        <nav className="set-side" aria-label="Settings sections">
          <div className="set-side-h">Settings</div>
          {SECTIONS.map((x) => <Link key={x.key} href={x.href} className={`set-link${x.key === section ? " on" : ""}`} aria-current={x.key === section ? "page" : undefined}><span>{x.label}</span><span className="set-sub">{x.sub}</span></Link>)}
          
        </nav>
        <div className="set-main">
          <PageHeader eyebrow="Settings" title={title} meta={meta} actions={actions} />
          {attention.length && section === "limits" ? <div className="set-attn"><b>Needs attention</b>{attention.slice(0, 3).map((x) => <Link key={x.k} href={x.href}>{x.t}</Link>)}</div> : null}
          <div className="stack">
            {children}
            {side ? <div className="stack">{side}</div> : null}
            <div className="set-meta">{aside}</div>
          </div>
        </div>
      </div>
    </Workspace>
  );
}

export function GrantTag({ v }: { v: "allow" | "view" | "hidden" }) {
  return v === "allow" ? <Tag tone="success">Allow</Tag> : v === "view" ? <Tag>View</Tag> : <span className="muted">Hidden</span>;
}
