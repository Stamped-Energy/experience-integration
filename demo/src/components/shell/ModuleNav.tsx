"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ModuleDefinition } from "@/lib/module/types";
import { screenActive } from "@/lib/module/definitions";
import { countForScreen } from "@/lib/module/counts";

/** Primary module pages as a horizontal tab row under the header (coral underline). */
export function ModulePageTabs({ module }: { module: ModuleDefinition }) {
  const path = usePathname();
  const screens = module.groups.flatMap((g) => g.screens);
  return (
    <nav className="module-page-tabs" aria-label={`${module.label} pages`}>
      <div className="module-page-tabs-inner" role="tablist">
        {screens.map((s) => {
          const n = countForScreen(module.id, s.id);
          const active = screenActive(s.href, path);
          return (
            <Link
              key={s.id}
              href={s.href}
              role="tab"
              className="module-page-tab"
              aria-current={active ? "page" : undefined}
              aria-selected={active}
            >
              {s.label}
              {n ? <span className="cnt">{n}</span> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** @deprecated sidebar removed; kept as alias for any stray imports */
export function ModuleNav({ module }: { module: ModuleDefinition }) {
  return <ModulePageTabs module={module} />;
}

export function ModuleMobileStrip({ module }: { module: ModuleDefinition }) {
  const path = usePathname();
  const screens = module.groups.flatMap((g) => g.screens);
  return (
    <div className="module-strip-wrap">
      <div className="module-strip" role="navigation" aria-label={`${module.label} screens`}>
        {screens.map((s) => (
          <Link key={s.id} href={s.href} aria-current={screenActive(s.href, path) ? "page" : undefined}>
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
