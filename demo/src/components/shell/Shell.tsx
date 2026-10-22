/** Server parts of the shell. AppShell wraps every page; Workspace adds the 44px breadcrumb bar for a page. */
import type { ReactNode } from "react";
import { inboxItems, suggestedQuestions } from "@/lib/demo/data";
import { DEFAULT_ROLE } from "@/lib/role";
import { AskPanelFrame, AskProvider, BottomBar, Rail } from "./ShellClient";
import { AskPanelContents } from "@/components/ask/Panel";

export function AppShell({ children }: { children: ReactNode }) {
  const waiting = inboxItems.filter((i) => i.bucket === "waiting").length;
  return (
    <AskProvider>
      <a className="skip" href="#main">Skip to content</a>
      <div className="app">
        <Rail inboxCount={waiting} />
        <div className="main" data-role={DEFAULT_ROLE}>
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

import Link from "next/link";
import { CrumbTools } from "./CrumbTools";

export function Workspace({ crumbs, children, askContext }: { crumbs: Crumb[]; children: ReactNode; askContext?: string }) {
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
        <CrumbTools askContext={askContext} />
      </header>
      <main className="workspace" id="main"><div className="page">{children}</div></main>
    </>
  );
}
