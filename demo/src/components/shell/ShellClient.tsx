"use client";
/** Client parts of the shell: rail, bottom bar, Ask panel state, role switcher, display toggles. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { NAV, areaFor } from "@/lib/nav";
import { ModuleRailLink } from "./ModuleShell";
import { Icon } from "./icons";
import { StampedMark } from "./StampedMark";
import { StampedMascot } from "@/components/mascot/StampedMascot";
import type { RoleId } from "@/lib/demo/types";
import { useSetRole } from "@/lib/role.client";

const ICON: Record<string, (p: object) => ReactNode> = Icon as never;

export function Rail({ inboxCount }: { inboxCount: number }) {
  const area = areaFor(usePathname());
  const g1 = NAV.filter((n) => n.group === 1);
  const g2 = NAV.filter((n) => n.group === 2 && !n.soon);
  const item = (n: (typeof NAV)[number]) => {
    const body = (
      <>
        {ICON[n.key]({})}
        {n.key === "inbox" && inboxCount > 0 ? <span className="rail-count">{inboxCount}</span> : null}
        {n.soon ? <span className="rail-soon" /> : null}
        <span className="rail-label">{n.label}</span>
        <span className="rail-tip">{n.label}</span>
      </>
    );
    const cls = "rail-item";
    const cur = area === n.key ? "page" : undefined;
    if (n.key === "process") {
      return (
        <ModuleRailLink key={n.key} module="process" fallback="/process/proposals" className={cls} aria-current={cur} aria-label={n.label}>
          {body}
        </ModuleRailLink>
      );
    }
    if (n.key === "quality") {
      return (
        <ModuleRailLink key={n.key} module="quality" fallback="/quality/actions" className={cls} aria-current={cur} aria-label={n.label}>
          {body}
        </ModuleRailLink>
      );
    }
    return (
      <Link key={n.key} href={n.href} className={cls} aria-current={cur} aria-label={n.label}>
        {body}
      </Link>
    );
  };
  return (
    <nav className="rail" id="app-rail" aria-label="Areas">
      <Link href="/" className="rail-mark" aria-label="Stamped home"><StampedMark size={28} /></Link>
      {g1.map(item)}
      <div className="rail-sep" />
      {g2.map(item)}
      <div className="rail-spacer" />
      <DisplayToggles />
      <RailToggle />
    </nav>
  );
}

export function BottomBar() {
  const area = areaFor(usePathname());
  const link = (n: (typeof NAV)[number]) => {
    if (n.key === "process") {
      return (
        <ModuleRailLink key={n.key} module="process" fallback="/process/proposals" aria-current={area === n.key ? "page" : undefined}>
          {ICON[n.key]({})}
          {n.label}
        </ModuleRailLink>
      );
    }
    if (n.key === "quality") {
      return (
        <ModuleRailLink key={n.key} module="quality" fallback="/quality/actions" aria-current={area === n.key ? "page" : undefined}>
          {ICON[n.key]({})}
          {n.label}
        </ModuleRailLink>
      );
    }
    return (
      <Link key={n.key} href={n.href} aria-current={area === n.key ? "page" : undefined}>
        {ICON[n.key]({})}
        {n.label}
      </Link>
    );
  };
  return (
    <nav className="bottombar" aria-label="Areas">
      {NAV.filter((n) => n.mobile).map(link)}
    </nav>
  );
}

function DisplayToggles() {
  const [theme, setTheme] = useState<string>("light");
  const [density, setDensity] = useState<string>("comfortable");
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme ?? "light");
    setDensity(document.documentElement.dataset.density ?? "comfortable");
  }, []);
  const flip = (k: "theme" | "density", v: string) => {
    document.documentElement.dataset[k] = v;
    localStorage.setItem(`stamped-${k}`, v);
    (k === "theme" ? setTheme : setDensity)(v);
  };
  return (
    <>
      <button className="rail-item" type="button" aria-pressed={density === "compact"} aria-label="Compact density for panel PCs" onClick={() => flip("density", density === "compact" ? "comfortable" : "compact")}>
        <Icon.density /><span className="rail-label">{density === "compact" ? "Comfortable" : "Compact"}</span><span className="rail-tip">{density === "compact" ? "Comfortable density" : "Compact density"}</span>
      </button>
      <button className="rail-item" type="button" aria-pressed={theme === "dark"} aria-label="Dark theme for panel PCs" onClick={() => flip("theme", theme === "dark" ? "light" : "dark")}>
        <Icon.moon /><span className="rail-label">{theme === "dark" ? "Light theme" : "Dark theme"}</span><span className="rail-tip">{theme === "dark" ? "Light theme" : "Dark theme"}</span>
      </button>
    </>
  );
}

/** Expands the desktop rail to show labels. The saved state is applied to <html data-rail> before paint, so the server markup never differs. */
function RailToggle() {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => { setExpanded(document.documentElement.dataset.rail === "expanded"); }, []);
  const flip = () => {
    const next = !expanded;
    document.documentElement.dataset.rail = next ? "expanded" : "collapsed";
    try { localStorage.setItem("stamped-rail", next ? "expanded" : "collapsed"); } catch {}
    setExpanded(next);
  };
  const label = expanded ? "Collapse sidebar" : "Expand sidebar to show labels";
  return (
    <button className="rail-item rail-toggle" type="button" aria-expanded={expanded} aria-controls="app-rail" aria-label={label} onClick={flip}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="4" y="5" width="16" height="14" rx="1.5" /><path d="M9 5v14" /><path className="rail-toggle-chev" d="m13 10 2 2-2 2" /></svg>
      <span className="rail-label">{expanded ? "Collapse" : "Expand"}</span>
      <span className="rail-tip">{expanded ? "Collapse sidebar" : "Expand sidebar"}</span>
    </button>
  );
}

/** Inline script for <head>: applies saved theme, density and sidebar state before paint. */
export const DISPLAY_SCRIPT = `try{var d=document.documentElement,t=localStorage.getItem('stamped-theme'),n=localStorage.getItem('stamped-density'),r=localStorage.getItem('stamped-rail'),c=document.cookie.match(/stamped-role=([^;]+)/),role=c&&c[1]?c[1]:'plant-head';if(t)d.dataset.theme=t;if(n)d.dataset.density=n;if(r)d.dataset.rail=r;d.dataset.role=role;var m=document.querySelector('.main');if(m)m.dataset.role=role;}catch(e){}`;

export function RoleSwitcher({ role, roles }: { role: RoleId; roles: { id: RoleId; name: string }[] }) {
  const setRole = useSetRole();
  return (
    <label className="role-switch">
      <span className="label">View as</span>
      <select
        className="select"
        value={role}
        onChange={(e) => setRole(e.target.value as RoleId)}
      >
        {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>
    </label>
  );
}

/* ---------- Ask panel ---------- */
interface AskCtx { open: boolean; context?: string; show: (context?: string) => void; hide: () => void }
const Ctx = createContext<AskCtx>({ open: false, show: () => {}, hide: () => {} });
export const useAsk = () => useContext(Ctx);

export function AskProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<string | undefined>();
  const show = useCallback((c?: string) => { setContext(c); setOpen(true); }, []);
  const hide = useCallback(() => setOpen(false), []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  return <Ctx.Provider value={{ open, context, show, hide }}>{children}</Ctx.Provider>;
}

function LaunchMascot() {
  const [live, setLive] = useState(false);
  useEffect(() => { setLive(true); }, []);
  return live ? <StampedMascot mode="ambient" size={18} seed={1} /> : <span className="ask-launch-mark" aria-hidden />;
}

export function AskButton({ context, label = "Ask Stamped", className = "btn btn-sm", mascot = false }: { context?: string; label?: string; className?: string; mascot?: boolean }) {
  const { show } = useAsk();
  return (
    <button type="button" className={mascot ? `${className} ask-launch` : className} onClick={() => show(context)}>
      {mascot ? <LaunchMascot /> : <Icon.ask />}
      {label}
    </button>
  );
}

export function AskPanelFrame({ children, suggestions }: { children: ReactNode; suggestions: string[] }) {
  const { open, context, hide, show } = useAsk();
  const [q, setQ] = useState("");
  const [asked, setAsked] = useState<string[]>([]);
  return (
    <aside className="ask-panel" data-open={open} aria-label="Ask Stamped" aria-hidden={!open}>
      <div className="ask-head">
        <StampedMascot mode={open ? (asked.length && !q ? "warning" : q.trim() ? "listening" : "ambient") : "ambient"} size={30} arrive key={open ? "o" : "c"} />
        <h2>Ask Stamped</h2>
        {context ? <span className="tag scope-chip" title={context}><span className="scope-txt">About: {context}</span><button type="button" onClick={() => show()} aria-label={`Remove scope ${context}`}>×</button></span> : null}
        <button type="button" className="icon-btn" style={{ marginLeft: "auto" }} onClick={hide} aria-label="Close Ask"><Icon.close /></button>
      </div>
      <div className="ask-body">
        {children}
        {asked.map((a, i) => (
          <div key={i} className="stack-sm">
            <div className="ask-msg-person">{a}</div>
            <div className="ask-claims">
              <div className="ask-claim">
                <span>Not enough plant data to answer that yet. Try the full Ask page, or ask about a line, lot or action.</span>
                <span className="meta"><span className="tag tag-warning">Abstained</span><a className="link" href={`/ask?q=${encodeURIComponent(a)}`}>Open in Ask</a></span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <form className="ask-foot" onSubmit={(e) => { e.preventDefault(); if (q.trim()) { setAsked((x) => [...x, q.trim()]); setQ(""); } }}>
        <div className="chips">{suggestions.slice(0, 3).map((s) => <button key={s} type="button" className="chip" onClick={() => setQ(s)}>{s}</button>)}</div>
        <div className="ask-input">
          <input value={q} onChange={(e) => setQ(e.target.value)} name="question" autoComplete="off" placeholder="Ask about a line, a lot or a change" aria-label="Question" />
          <button className="btn btn-primary" type="submit">Ask</button>
        </div>
        <span className="muted" style={{ fontSize: 12 }}>Ask reads only. It cannot change a setting.</span>
      </form>
    </aside>
  );
}
