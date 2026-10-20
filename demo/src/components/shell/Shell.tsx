/** Server parts of the shell. AppShell wraps every page; Workspace adds the 44px breadcrumb bar for a page. */
import Link from "next/link";
import type { ReactNode } from "react";
import { askThreads, inboxItems, leases, roles, suggestedQuestions } from "@/lib/demo/data";
import { currentRole } from "@/lib/role";
import { AskButton, AskPanelFrame, AskProvider, BottomBar, Rail, RoleSwitcher } from "./ShellClient";
import { Icon } from "./icons";
import { EvidenceTag, Tag } from "@/components/ui/primitives";

export function DemoBand() {
  return (
    <div className="demo-band" role="note">
      <strong>Demonstration plant. Illustrative data.</strong>
      <span className="sep" />
      <span>Fictional plant, figures tagged Illustrative</span>
      <span className="authority">Stamped works inside limits set beforehand.</span>
    </div>
  );
}

export async function AppShell({ children }: { children: ReactNode }) {
  const role = await currentRole();
  const waiting = inboxItems.filter((i) => i.bucket === "waiting").length;
  const t = askThreads[0];
  return (
    <AskProvider>
      <div className="app">
        <Rail inboxCount={waiting} />
        <div className="main" data-role={role}>
          <DemoBand />
          {children}
        </div>
      </div>
      <BottomBar />
      <AskPanelFrame suggestions={suggestedQuestions}>
        <div className="ask-msg-person">{t.messages[0].text}</div>
        <div className="ask-claims">
          {t.messages[1].claims!.map((c) => (
            <div key={c.text} className="ask-claim">
              <span>{c.text}</span>
              <span className="meta"><EvidenceTag label={c.label} />{c.evidenceIds.map((e) => <span key={e} className="mono muted">{e}</span>)}</span>
            </div>
          ))}
        </div>
        <Link className="link" href="/inbox/in-2" style={{ fontSize: 13 }}>Open the card this answer points to</Link>
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
          <label className="search">
            <Icon.search width={14} height={14} />
            <input type="search" placeholder="Search lines, lots, cards" aria-label="Search" />
            <kbd>/</kbd>
          </label>
          <RoleSwitcher role={role} roles={roles.map((r) => ({ id: r.id, name: r.name }))} />
          <Tag tone={lease.state === "active" && lease.offlineMin === 0 ? "success" : "warning"} dot title={`Lease ${lease.id}: at most ${lease.maxOfflineH} h offline, never more than ${lease.hardCapH} h`}>
            {lease.offlineMin === 0 ? "Connected" : `Offline · ${lease.offlineMin} min of 4 h`}
          </Tag>
          <AskButton context={askContext} className="btn btn-sm btn-accent" />
        </div>
      </header>
      <main className="workspace" id="main"><div className="page">{children}</div></main>
    </>
  );
}
