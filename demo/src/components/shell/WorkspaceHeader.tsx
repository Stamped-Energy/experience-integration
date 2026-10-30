"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CrumbTools } from "./CrumbTools";
import { StampedMark } from "./StampedMark";
import { ModuleSwitcher } from "./ModuleSwitcher";
import { ModulePageTabs } from "./ModuleNav";
import { useActiveModule } from "./ModuleShell";

export interface Crumb { label: string; href?: string }

export function WorkspaceHeader({ crumbs, askContext }: { crumbs: Crumb[]; askContext?: string }) {
  const module = useActiveModule();
  const trail = crumbs.length > 1 ? crumbs.slice(1) : [];
  return (
    <>
      <header className="crumbbar topbar">
        <div className="topbar-brand">
          <Link href="/" className="topbar-logo" aria-label="Stamped home">
            <StampedMark size={22} />
            <span className="topbar-wordmark">Stamped</span>
          </Link>
          <span className="topbar-divider" aria-hidden />
          <ModuleSwitcher />
        </div>
        {trail.length ? (
          <nav className="crumbs crumb-mid-only" aria-label="Breadcrumb">
            {trail.map((c, i) => (
              <span key={i} style={{ display: "contents" }}>
                {i > 0 ? <span className="crumb-sep" aria-hidden>/</span> : null}
                {c.href && i < trail.length - 1 ? (
                  <Link href={c.href}>{c.label}</Link>
                ) : (
                  <span aria-current={i === trail.length - 1 ? "page" : undefined}>{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}
        <CrumbTools askContext={askContext} />
      </header>
      {module ? <ModulePageTabs module={module} /> : null}
    </>
  );
}

export function WorkspaceFrame({
  crumbs,
  children,
  askContext,
}: {
  crumbs: Crumb[];
  children: ReactNode;
  askContext?: string;
}) {
  return (
    <>
      <WorkspaceHeader crumbs={crumbs} askContext={askContext} />
      <main className="workspace" id="main">
        <div className="page">{children}</div>
      </main>
    </>
  );
}
