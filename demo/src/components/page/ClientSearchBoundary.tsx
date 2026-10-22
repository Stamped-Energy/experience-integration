"use client";

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

/** Reads URL search params on the client so the route page can stay statically generated. */
export function ClientSearchBoundary({ children }: { children: (sp: URLSearchParams) => ReactNode }) {
  const sp = useSearchParams();
  return <>{children(sp)}</>;
}
