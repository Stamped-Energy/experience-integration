"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ModuleDefinition } from "@/lib/module/types";
import { screenActive } from "@/lib/module/definitions";
import { countForScreen } from "@/lib/module/counts";

export function ModuleNav({ module }: { module: ModuleDefinition }) {
  const path = usePathname();
  const waiting = countForScreen(module.id, "proposals") ?? 0;
  return (
    <nav className="module-nav" aria-label={`${module.label} screens`}>
      <div className="module-nav-head">
        <h2>{module.label}</h2>
      </div>
      {module.groups.map((g) => (
        <div key={g.id} className="module-nav-group">
          <span className="label">{g.label}</span>
          {g.screens.map((s) => {
            const n = countForScreen(module.id, s.id);
            return (
              <Link key={s.id} href={s.href} className="module-nav-link" aria-current={screenActive(s.href, path) ? "page" : undefined}>
                {s.label}
                {n ? <span className="cnt">{n}</span> : null}
              </Link>
            );
          })}
        </div>
      ))}
      <div className="module-nav-foot">
        {waiting ? <p>{waiting} proposal{waiting === 1 ? "" : "s"} waiting on a person</p> : <p>Scan first, decide through the card</p>}
      </div>
    </nav>
  );
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
