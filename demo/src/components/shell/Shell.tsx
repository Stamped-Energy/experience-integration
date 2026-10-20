/** Server parts of the shell. AppShell wraps every page; Workspace adds the 44px breadcrumb bar for a page. */
import Link from "next/link";
import { nameOf } from "@/lib/names";
import type { ReactNode } from "react";
import { inboxItems, leases, roles, suggestedQuestions } from "@/lib/demo/data";
import { currentRole } from "@/lib/role";
import { AskButton, AskPanelFrame, AskProvider, BottomBar, Rail, RoleSwitcher } from "./ShellClient";
import { SearchLaunch } from "./Search";
import { Tag } from "@/components/ui/primitives";
import { AskPanelContents } from "@/components/ask/Panel";

export async function AppShell({ children }: { children: ReactNode }) {
  const role = await currentRole();
  const waiting = inboxItems.filter((i) => i.bucket === "waiting").length;
  return (
    <AskProvider>
      <a className="skip" href="#main">Skip to content</a>
      <div className="app">
        <Rail inboxCount={waiting} />
        <div className="main" data-role={role}>
          {children}
        </div>
      </div>
      <BottomBar />
      <AskPanelFrame suggestions={suggestedQuestions}>
        <AskPanelContents />
      </AskPanelFrame>
    </AskProvider>
  );
}

export interface Crumb { label: string; href?: string }

export async function Workspace({ crumbs, children, askContext }: { crumbs: Crumb[]; children: ReactNode; askContext?: string }) {
  const role = await currentRole();
  const lease = leases[0];
  return (
    <>
      <header className="crumbbar">
        <nav className="crumbs" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={i} className={i > 0 && i < crumbs.length - 1 ? "crumb-mid" : undefined} style={{ display: "contents" }}>
              {i > 0 ? <span className="crumb-sep" aria-hidden>/</span> : null}
              {c.href && i < crumbs.length - 1 ? <Link href={c.href}>{c.label}</Link> : <span aria-current={i === crumbs.length - 1 ? "page" : undefined}>{c.label}</span>}
            </span>
          ))}
        </nav>
        <div className="crumb-tools">
          <SearchLaunch />
          <RoleSwitcher role={role} roles={roles.map((r) => ({ id: r.id, name: r.name }))} />
          <Tag tone={lease.state === "active" && lease.offlineMin === 0 ? "success" : "warning"} dot title={`Lease ${nameOf(lease.id)}: at most ${lease.maxOfflineH} h offline, never more than ${lease.hardCapH} h`}>
            {lease.offlineMin === 0 ? "Connected" : `Offline · ${lease.offlineMin} min of 4 h`}
          </Tag>
          <AskButton context={askContext} className="btn btn-sm btn-accent" mascot />
        </div>
      </header>
      <main className="workspace" id="main"><div className="page">{children}</div></main>
    </>
  );
}
