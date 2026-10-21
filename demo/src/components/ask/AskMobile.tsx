"use client";
/** Mobile Ask chrome: a minimal top bar (back, title, history, new chat), a history sheet, and scroll that follows the newest turn. */
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const svg = { viewBox: "0 0 24 24", width: 22, height: 22, fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export function AskMobileBar({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const sp = useSearchParams();
  useEffect(() => { setOpen(false); }, [path, sp]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);
  return (
    <>
      <header className="askm-bar">
        <Link href="/" className="askm-btn" aria-label="Back to Home"><svg {...svg}><path d="M15 5l-7 7 7 7" /></svg></Link>
        <span className="askm-title">{title}</span>
        <button type="button" className="askm-btn" aria-label="Past questions" aria-expanded={open} onClick={() => setOpen(true)}><svg {...svg}><path d="M4 12a8 8 0 1 0 2.3-5.6" /><path d="M4 4.5V8h3.5" /><path d="M12 8v4.5l3 1.8" /></svg></button>
        <Link href="/ask" className="askm-btn" aria-label="New question"><svg {...svg}><path d="M12 20h8" /><path d="M16.5 3.8a2 2 0 0 1 2.8 2.8L8 18l-4 1 1-4z" /></svg></Link>
      </header>
      {open ? (
        <div className="askm-sheet" role="dialog" aria-modal="true" aria-label="Past questions">
          <button type="button" className="askm-scrim" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="askm-sheet-body">
            <div className="askm-sheet-head"><b>Past questions</b><button type="button" className="askm-btn" aria-label="Close" onClick={() => setOpen(false)}><svg {...svg}><path d="M6 6l12 12M18 6 6 18" /></svg></button></div>
            {children}
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Brings the newest question to the top of the view on load, and keeps the bottom in view while the keyboard is open. */
export function FollowNewest() {
  const path = usePathname();
  const sp = useSearchParams();
  useEffect(() => {
    const box = document.querySelector<HTMLElement>(".askx-main");
    if (!box) return;
    const turns = box.querySelectorAll<HTMLElement>(".turn");
    const last = turns[turns.length - 1];
    if (last && turns.length > 1) box.scrollTo({ top: last.offsetTop - 8, behavior: "smooth" });
    const vv = window.visualViewport;
    if (!vv) return;
    const keep = () => { if (document.activeElement?.closest(".askx-pin")) box.scrollTo({ top: box.scrollHeight, behavior: "smooth" }); };
    vv.addEventListener("resize", keep);
    return () => vv.removeEventListener("resize", keep);
  }, [path, sp]);
  return null;
}
