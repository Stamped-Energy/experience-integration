"use client";

/**
 * Vercel / Linear-style module switcher beside the Stamped logo.
 * Lists Process, Quality and the other top-level areas.
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { areaFor } from "@/lib/nav";
import { lastScreenHref } from "@/lib/module/last-screen";

type SwitchItem = {
  key: string;
  label: string;
  href: string;
  soon?: boolean;
};

const MODULES: SwitchItem[] = [
  { key: "process", label: "Process", href: "/process/proposals" },
  { key: "quality", label: "Quality", href: "/quality/actions" },
  { key: "plant", label: "Plant", href: "/plant" },
  { key: "ask", label: "Ask", href: "/ask" },
  { key: "inbox", label: "Inbox", href: "/inbox" },
  { key: "home", label: "Home", href: "/" },
  { key: "planning", label: "Planning", href: "/planning", soon: true },
  { key: "settings", label: "Settings", href: "/settings" },
  { key: "activity", label: "Activity", href: "/activity" },
];

function currentLabel(path: string): string {
  const area = areaFor(path);
  const hit = MODULES.find((m) => m.key === area);
  return hit?.label ?? "Home";
}

export function ModuleSwitcher() {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const label = currentLabel(path);
  const area = areaFor(path);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = (item: SwitchItem) => {
    setOpen(false);
    if (item.soon) {
      router.push(item.href);
      return;
    }
    if (item.key === "process") {
      router.push(lastScreenHref("process", item.href));
      return;
    }
    if (item.key === "quality") {
      router.push(lastScreenHref("quality", item.href));
      return;
    }
    router.push(item.href);
  };

  return (
    <div className="mod-switch" ref={root}>
      <button
        type="button"
        className="mod-switch-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Module: ${label}. Change module`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="mod-switch-label">{label}</span>
        <svg className="mod-switch-chev" width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <ul className="mod-switch-menu" role="listbox" aria-label="Modules">
          {MODULES.map((item) => {
            const active = item.key === area;
            return (
              <li key={item.key} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`mod-switch-item${active ? " is-active" : ""}${item.soon ? " is-soon" : ""}`}
                  onClick={() => go(item)}
                >
                  <span>{item.label}</span>
                  {item.soon ? <span className="mod-switch-soon">Soon</span> : null}
                </button>
              </li>
            );
          })}
          <li className="mod-switch-sep" aria-hidden />
          <li>
            <Link href="/" className="mod-switch-item" onClick={() => setOpen(false)}>
              Stamped home
            </Link>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
