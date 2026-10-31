"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CrumbTools } from "./CrumbTools";

export interface Crumb { label: string; href?: string }

/** Classic crumb bar — module chrome lives in SideNav. */
export function WorkspaceHeader({ crumbs, askContext }: { crumbs: Crumb[]; askContext?: string }) {
  return (
    <header className="crumbbar">
      <nav className="crumbs" aria-label="Breadcrumb">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: "contents" }}>
            {i > 0 ? <span className="crumb-sep" aria-hidden>/</span> : null}
            {c.href && i < crumbs.length - 1 ? (
              <Link href={c.href}>{c.label}</Link>
            ) : (
              <span aria-current={i === crumbs.length - 1 ? "page" : undefined}>{c.label}</span>
            )}
          </span>
        ))}
      </nav>
      <CrumbTools askContext={askContext} />
    </header>
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
