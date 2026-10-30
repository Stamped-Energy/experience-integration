"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ModuleDefinition } from "@/lib/module/types";
import { lastScreenHref, moduleFromPath, saveLastScreen } from "@/lib/module/last-screen";

const ModuleCtx = createContext<ModuleDefinition | null>(null);
export function useActiveModule() {
  return useContext(ModuleCtx);
}

/** Thin provider for module pages. Nav lives in SideNav; sub-views use HubTabs. */
export function ModuleShell({ module, children }: { module: ModuleDefinition; children: ReactNode }) {
  const path = usePathname();
  useEffect(() => {
    const m = moduleFromPath(path);
    if (m) saveLastScreen(m, path);
  }, [path]);
  return <ModuleCtx.Provider value={module}>{children}</ModuleCtx.Provider>;
}

/** Restores the last screen for Process or Quality when entering from outside. */
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
      href={fallback}
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
