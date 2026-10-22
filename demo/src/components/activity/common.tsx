/** Shared helpers for Activity: tabs, crumbs, object links, line lookup and filters for the audit log. */
import Link from "next/link";
import * as D from "@/lib/demo/data";
import type { AuditEvent } from "@/lib/demo/types";
import type { Crumb } from "@/components/shell/Shell";
import { Tabs } from "@/components/ui/primitives";

export function ActivityTabs({ active }: { active: "audit" | "reports" | "summary" }) {
  return <Tabs label="Activity" items={[
    { href: "/activity/summary", label: "Summary", active: active === "summary" },
    { href: "/activity", label: "Audit log", count: D.auditEvents.length, active: active === "audit" },
    { href: "/activity/reports", label: "Reports and exports", count: D.reports.filter((r) => r.status === "awaiting approval").length, active: active === "reports" },
  ]} />;
}
export const crumbs = (...rest: Crumb[]): Crumb[] => [{ label: "Demonstration plant", href: "/" }, { label: "Activity", href: "/activity" }, ...rest];
export const roleName = (r: string) => D.roles.find((x) => x.id === r)?.name ?? r;
export const personName = (id: string) => D.byId.person(id)?.display ?? id;

export function objHref(e: Pick<AuditEvent, "objectType" | "objectId">): string | undefined {
  const id = e.objectId;
  switch (e.objectType) {
    case "proposal": return `/process/proposals/${id}`;
    case "trial": return `/process/trials/${id}`;
    case "run": return `/process/runs/${id}`;
    case "lot": return `/quality/lots/${id}`;
    case "correction": return "/quality/corrections";
    case "window": return "/settings/limits";
    case "approval": return "/settings/approvals";
    case "lease": return "/plant/box";
    case "report": return `/activity/reports?r=${id}`;
  }
}
export function lineOf(e: AuditEvent): string | undefined {
  const o = e.objectId;
  return D.byId.proposal(o)?.lineId ?? D.byId.trial(o)?.lineId ?? D.byId.correction(o)?.toLineId ?? D.signedWindows.find((w) => w.id === o)?.lineId
    ?? D.standingApprovals.find((a) => a.id === o)?.lineId ?? D.runs.find((r) => r.id === o)?.lineId ?? D.byId.lot(o)?.lineIds[0];
}
export const kindOf = (action: string) => /Stop|Revoked/.test(action) ? "Stopped or revoked" : /Signed|Granted|Narrowed/.test(action) ? "Signed or granted" : /Accepted|Declined|Confirmed|Sent/.test(action) ? "Decided" : /written/.test(action) ? "Written" : "Exported or drafted";
export const KINDS = ["Decided", "Signed or granted", "Stopped or revoked", "Written", "Exported or drafted"];

export type AuditFilter = { line?: string; kind?: string; person?: string; day?: string; e?: string; n?: string };
export const auditHref = (f: AuditFilter) => { const p = new URLSearchParams(); for (const [k, v] of Object.entries(f)) if (v) p.set(k, v); const s = p.toString(); return s ? `/activity?${s}` : "/activity"; };
export const dayKey = (iso: string) => iso.slice(0, 10);

export function Chips({ label, items, current, make }: { label: string; items: { v?: string; t: string }[]; current?: string; make: (v?: string) => string }) {
  return <><span className="label">{label}</span>{items.map((i) => <Link key={i.v ?? "all"} scroll={false} prefetch={false} className={`fchip${current === i.v ? " on" : ""}`} href={make(i.v)}>{i.t}</Link>)}</>;
}
