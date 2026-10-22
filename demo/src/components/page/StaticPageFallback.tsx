import type { ReactNode } from "react";

export function StaticPageFallback({ children }: { children: ReactNode }) {
  return <div className="page" aria-busy="true">{children}</div>;
}
