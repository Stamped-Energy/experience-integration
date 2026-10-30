/** Server parts of the shell. AppShell wraps every page; Workspace adds the header bar for a page. */
import type { ReactNode } from "react";
import { suggestedQuestions } from "@/lib/demo/data";
import { DEFAULT_ROLE } from "@/lib/role";
import { AskPanelFrame, AskProvider, BottomBar } from "./ShellClient";
import { AskPanelContents } from "@/components/ask/Panel";
import { WorkspaceFrame, type Crumb } from "./WorkspaceHeader";

export type { Crumb };

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AskProvider>
      <a className="skip" href="#main">Skip to content</a>
      <div className="app app-topnav">
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

export function Workspace({ crumbs, children, askContext }: { crumbs: Crumb[]; children: ReactNode; askContext?: string }) {
  return (
    <WorkspaceFrame crumbs={crumbs} askContext={askContext}>
      {children}
    </WorkspaceFrame>
  );
}
