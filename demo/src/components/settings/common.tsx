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

export type SettingsKey = "limits" | "approvals" | "people" | "routing" | "integrations" | "plant";
export const SECTIONS: { key: SettingsKey; label: string; href: string; sub: string }[] = [
  { key: "limits", label: "Signed limits", href: "/settings/limits", sub: `${D.signedWindows.length} windows` },
  { key: "approvals", label: "Standing approvals", href: "/settings/approvals", sub: `${D.standingApprovals.filter((a) => !a.revokedAt).length} active · ${D.standingApprovals.filter((a) => a.revokedAt).length} revoked` },
  { key: "people", label: "People and roles", href: "/settings/people", sub: `${D.people.length} people · ${D.roles.length} roles` },
  { key: "routing", label: "Routing and notifications", href: "/settings/routing", sub: `${D.assignments.length} scopes` },
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
  const recent = D.auditEvents.slice(0, 6);
  const left = (
    <>
      <Section title="Needs attention" meta={`${attention.length} items`} flush>
        <div className="rows">{attention.length ? attention.map((x) => <Link key={x.k} href={x.href} className="row" style={{ gridTemplateColumns: "minmax(0,1fr)" }}><span><span className="row-title" style={{ display: "block" }}>{x.t}</span>{x.sub && <span className="row-sub">{x.sub}</span>}</span></Link>) : <p className="muted" style={{ margin: 16, fontSize: 13 }}>Nothing waiting.</p>}</div>
      </Section>
      <Section title="Recent changes" meta="All settings" flush>
        <ul className="tl" style={{ padding: "8px 16px" }}>{recent.map((h) => <li key={h.id}><span className="t">{dayMonth(h.at)}</span><span className="k s" /><span>{h.action}<span className="cell-sub">{roleName(h.role)} {hhmm(h.at)}</span></span><span /></li>)}</ul>
      </Section>
    </>
  );
  return (
    <Workspace crumbs={[{ label: "Demonstration plant", href: "/" }, { label: "Settings", href: "/settings" }, { label: s.label }]} askContext={s.label}>
      <PageHeader eyebrow="Settings" title={title} meta={meta} actions={actions} />
      <div className="grid">
        <div className="span-3 stack">
          <Section title="Settings" flush>
            <nav aria-label="Settings sections">
            <div className="rows set-nav">{SECTIONS.map((x) => <Link key={x.key} href={x.href} className={`row${x.key === section ? " on" : ""}`} aria-current={x.key === section ? "page" : undefined} style={{ gridTemplateColumns: "minmax(0,1fr)" }}><span><span className="row-title" style={{ display: "block" }}>{x.label}</span><span className="row-sub">{x.sub}</span></span></Link>)}</div>
            </nav>
          </Section>
          <div className="set-note">Every change here is illustrative in the demonstration plant. Nothing is saved.</div>
          <div className="xl-hide stack">{aside}</div>
          <div className="xl-only stack">{side ? aside : left}</div>
        </div>
        <div className="span-9 xl-span-6 stack">
          {children}
          {side && <div className="xl-hide stack">{side}</div>}
        </div>
        <div className="xl-only stack xl-span-3">{side ?? aside}</div>
      </div>
    </Workspace>
  );
}

export function GrantTag({ v }: { v: "allow" | "view" | "hidden" }) {
  return v === "allow" ? <Tag tone="success">Allow</Tag> : v === "view" ? <Tag>View</Tag> : <span className="muted">Hidden</span>;
}
