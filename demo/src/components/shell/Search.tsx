"use client";
/** Centered search. The crumb bar opens it. An empty box lists places to jump. Typing filters lines, lots and cards. */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import * as D from "@/lib/demo/data";
import { Icon } from "./icons";

type Hit = { href: string; title: string; hint: string; kind: string; text: string };

const PAGES: Hit[] = [
  { href: "/", title: "Overview", hint: "The plant, the value, and where to look", kind: "Page", text: "home overview" },
  { href: "/?view=plant", title: "Plant", hint: "What needs a decision today", kind: "Page", text: "plant today" },
  { href: "/?view=shift", title: "Shift", hint: "Handover and the settings now running", kind: "Page", text: "shift handover" },
  { href: "/?view=line", title: "My line now", hint: "The setting inside its signed band", kind: "Page", text: "line now" },
  { href: "/?view=owner", title: "Owner", hint: "Value at this plant's prices", kind: "Page", text: "owner value" },
  { href: "/inbox", title: "Inbox", hint: "Decisions waiting for a person", kind: "Page", text: "inbox decisions" },
  { href: "/quality", title: "Quality", hint: "Lots, specs and what is at risk", kind: "Page", text: "quality lots" },
  { href: "/process", title: "Process", hint: "Lines, settings and proposals", kind: "Page", text: "process lines" },
];

function catalog(): Hit[] {
  const lines = D.lines.map((l) => ({ href: `/process?line=${l.id}`, title: l.name, hint: `${l.product} · ${l.status}`, kind: "Line", text: `${l.short} ${l.product} ${l.status} ${l.mode}` }));
  const cards = D.inboxItems.map((i) => ({ href: `/inbox/${i.id}`, title: i.title, hint: i.bucket === "waiting" ? "Waiting for a person" : i.bucket === "task" ? "Task" : "Decided", kind: "Card", text: `${i.title} ${i.kind} ${i.ref}` }));
  const lots = D.lots.map((l) => {
    const prop = D.lotProperties.find((p) => p.lotId === l.id);
    const code = l.id.replace(/^lot-/, "").toUpperCase();
    return { href: `/quality?lot=${l.id}`, title: code, hint: `${prop ? `${prop.name} ${prop.predicted.point} ${prop.unit}` : "Lot"} · ${l.riskWord}`, kind: "Lot", text: `${code} ${l.id} ${l.status} ${l.riskWord} ${prop?.name ?? ""}` };
  });
  const assets = D.assets.map((a) => ({ href: `/process?line=${a.lineId}`, title: a.name, hint: D.byId.line(a.lineId)?.short ?? "Line", kind: "Asset", text: a.name }));
  return [...PAGES, ...lines, ...cards, ...lots, ...assets];
}

const ALL = catalog();
const READY = [...PAGES, ...ALL.filter((h) => h.kind === "Card" && h.hint === "Waiting for a person")];

function filter(q: string): Hit[] {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return READY;
  return ALL.filter((h) => words.every((w) => `${h.title} ${h.hint} ${h.kind} ${h.text}`.toLowerCase().includes(w))).slice(0, 8);
}

export function SearchLaunch() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      e.preventDefault();
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <>
      <button type="button" className="search" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-keyshortcuts="/">
        <Icon.search width={14} height={14} />
        <span>Search lines, lots, cards…</span>
        <kbd>/</kbd>
      </button>
      {open ? <SearchDialog onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const dlg = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const hits = useMemo(() => filter(q), [q]);
  useEffect(() => { dlg.current?.showModal(); }, []);
  useEffect(() => { setActive(0); }, [q]);

  function go(href: string) {
    onClose();
    router.push(href);
  }
  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((n) => Math.min(n + 1, hits.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((n) => Math.max(n - 1, 0)); }
    else if (e.key === "Enter" && hits[active]) { e.preventDefault(); go(hits[active].href); }
  }

  return (
    <dialog ref={dlg} className="search-dialog" aria-labelledby="search-dialog-title" onClose={onClose} onClick={(e) => { if (e.target === dlg.current) dlg.current?.close(); }}>
      <h2 className="sr-only" id="search-dialog-title">Search</h2>
      <div className="search-dlg-bar">
        <Icon.search width={18} height={18} />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} type="search" placeholder="Search lines, lots, cards…" aria-label="Search" autoComplete="off" spellCheck={false} />
        <button type="button" className="search-dlg-esc" onClick={() => dlg.current?.close()} aria-label="Close search"><kbd>Esc</kbd></button>
      </div>
      <div className="search-dlg-body">
        {hits.length ? <div className="search-dlg-label">{q.trim() ? `${hits.length} match${hits.length === 1 ? "" : "es"}` : "Jump to"}</div> : <p className="search-dlg-none">Nothing matches.</p>}
        <ul className="search-dlg-list">
          {hits.map((h, n) => (
            <li key={`${h.kind}-${h.href}-${h.title}`}>
              <Link href={h.href} className={`search-hit${n === active ? " on" : ""}`} onClick={(e) => { e.preventDefault(); go(h.href); }} onMouseEnter={() => setActive(n)}>
                <span className="kind">{h.kind}</span>
                <span className="title">{h.title}</span>
                <span className="hint">{h.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="search-dlg-foot" aria-hidden="true">
        <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
        <span><kbd>Enter</kbd> open</span>
        <span><kbd>Esc</kbd> close</span>
      </div>
    </dialog>
  );
}
