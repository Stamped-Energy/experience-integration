"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ModuleDefinition } from "@/lib/module/types";
import { lastScreenHref, moduleFromPath, saveLastScreen } from "@/lib/module/last-screen";
import { ModuleMobileStrip, ModuleNav } from "./ModuleNav";

export function ModuleShell({ module, children }: { module: ModuleDefinition; children: ReactNode }) {
  const path = usePathname();
  useEffect(() => {
    const m = moduleFromPath(path);
    if (m) saveLastScreen(m, path);
  }, [path]);
  return (
    <div className="module-shell">
      <ModuleNav module={module} />
      <div className="module-workspace">
        <ModuleMobileStrip module={module} />
        {children}
      </div>
    </div>
  );
}

/** Rail link that restores the last screen for Process or Quality (ADR-042 U2). */
export function ModuleRailLink({
  module,
  fallback,
  className,
  children,
  ...rest
}: {
  module: "process" | "quality";
  fallback: string;
  className?: string;
  children: ReactNode;
  "aria-current"?: "page" | undefined;
  "aria-label"?: string;
}) {
  const router = useRouter();
  const path = usePathname();
  const onModule = path.startsWith(`/${module}`);
  return (
    <Link
      href={onModule ? fallback : fallback}
      className={className}
      onClick={(e) => {
        if (onModule) return;
        e.preventDefault();
        router.push(lastScreenHref(module, fallback));
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}
