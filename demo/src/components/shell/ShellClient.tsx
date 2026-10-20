"use client";
/** Client parts of the shell: rail, bottom bar, Ask panel state, role switcher, display toggles. */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { NAV, areaFor } from "@/lib/nav";
import { Icon } from "./icons";
import type { RoleId } from "@/lib/demo/types";

const ICON: Record<string, (p: object) => ReactNode> = Icon as never;

export function Rail({ inboxCount }: { inboxCount: number }) {
  const area = areaFor(usePathname());
  const g1 = NAV.filter((n) => n.group === 1);
  const g2 = NAV.filter((n) => n.group === 2);
  const item = (n: (typeof NAV)[number]) => (
    <Link key={n.key} href={n.href} className="rail-item" aria-current={area === n.key ? "page" : undefined} aria-label={n.label}>
      {ICON[n.key]({})}
      {n.key === "inbox" && inboxCount > 0 ? <span className="rail-count">{inboxCount}</span> : null}
      {n.soon ? <span className="rail-soon" /> : null}
      <span className="rail-tip">{n.label}</span>
    </Link>
  );
  return (
    <nav className="rail" aria-label="Areas">
      <Link href="/" className="rail-mark" aria-label="Stamped home">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/stamped-logo.png" alt="Stamped" width={28} height={28} /></Link>
      {g1.map(item)}
      <div className="rail-sep" />
      {g2.map(item)}
      <div className="rail-spacer" />
      <DisplayToggles />
    </nav>
  );
}

export function BottomBar() {
  const area = areaFor(usePathname());
  return (
    <nav className="bottombar" aria-label="Areas">
      {NAV.filter((n) => n.mobile).map((n) => (
        <Link key={n.key} href={n.href} aria-current={area === n.key ? "page" : undefined}>
          {ICON[n.key]({})}
          {n.label}
        </Link>
      ))}
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
        <Icon.density /><span className="rail-tip">{density === "compact" ? "Comfortable density" : "Compact density"}</span>
      </button>
      <button className="rail-item" type="button" aria-pressed={theme === "dark"} aria-label="Dark theme for panel PCs" onClick={() => flip("theme", theme === "dark" ? "light" : "dark")}>
        <Icon.moon /><span className="rail-tip">{theme === "dark" ? "Light theme" : "Dark theme"}</span>
      </button>
    </>
  );
}

/** Inline script for <head>: applies saved theme and density before paint. */
export const DISPLAY_SCRIPT = `try{var d=document.documentElement,t=localStorage.getItem('stamped-theme'),n=localStorage.getItem('stamped-density');if(t)d.dataset.theme=t;if(n)d.dataset.density=n;}catch(e){}`;

export function RoleSwitcher({ role, roles }: { role: RoleId; roles: { id: RoleId; name: string }[] }) {
  const router = useRouter();
  return (
    <label className="role-switch">
      <span className="label">View as</span>
      <select
        className="select"
        value={role}
        onChange={(e) => {
          document.cookie = `stamped-role=${e.target.value}; path=/; max-age=31536000; samesite=lax`;
          router.refresh();
        }}
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

export function AskButton({ context, label = "Ask Stamped", className = "btn btn-sm" }: { context?: string; label?: string; className?: string }) {
  const { show } = useAsk();
  return <button type="button" className={className} onClick={() => show(context)}><Icon.ask />{label}</button>;
}

export function AskPanelFrame({ children, suggestions }: { children: ReactNode; suggestions: string[] }) {
  const { open, context, hide } = useAsk();
  const [q, setQ] = useState("");
  const [asked, setAsked] = useState<string[]>([]);
  return (
    <aside className="ask-panel" data-open={open} aria-label="Ask Stamped" aria-hidden={!open}>
      <div className="ask-head">
        <h2>Ask Stamped</h2>
        {context ? <span className="tag">{context}</span> : null}
        <button type="button" className="icon-btn" style={{ marginLeft: "auto" }} onClick={hide} aria-label="Close Ask"><Icon.close /></button>
      </div>
      <div className="ask-body">
        {children}
        {asked.map((a, i) => (
          <div key={i} className="stack-sm">
            <div className="ask-msg-person">{a}</div>
            <div className="ask-claims">
              <div className="ask-claim">
                <span>In this demonstration, answers come from the saved threads above. In a plant, each claim carries its evidence id and label.</span>
                <span className="meta"><span className="tag">Unknown</span><span className="muted">Abstained: no demo source for this question</span></span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <form className="ask-foot" onSubmit={(e) => { e.preventDefault(); if (q.trim()) { setAsked((x) => [...x, q.trim()]); setQ(""); } }}>
        <div className="chips">{suggestions.slice(0, 3).map((s) => <button key={s} type="button" className="chip" onClick={() => setQ(s)}>{s}</button>)}</div>
        <div className="ask-input">
          <input value={q} onChange={(e) => setQ(e.target.value)} name="question" autoComplete="off" placeholder="Ask about a line, lot or change…" aria-label="Question" />
          <button className="btn btn-primary" type="submit">Ask</button>
        </div>
        <span className="muted" style={{ fontSize: 12 }}>Ask reads only. It cannot change a setting.</span>
      </form>
    </aside>
  );
}
