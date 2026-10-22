"use client";
/** Client bits of Ask: numbered source markers that open the Sources strip, and the composer with its thinking state. */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent, type ReactNode } from "react";
import { StampedMascot, type MascotMode } from "@/components/mascot/StampedMascot";

export function SourceMark({ n }: { n: number }) {
  function open(e: MouseEvent<HTMLButtonElement>) {
    const turn = e.currentTarget.closest(".turn");
    const d = turn?.querySelector<HTMLDetailsElement>("details.src-strip");
    if (!d) return;
    d.open = true;
    const li = d.querySelectorAll("li")[n - 1] as HTMLElement | undefined;
    li?.scrollIntoView({ block: "nearest" });
    li?.classList.add("hit");
    setTimeout(() => li?.classList.remove("hit"), 1200);
  }
  return <button type="button" className="smark" onClick={open} aria-label={`Source ${n}`}>{n}</button>;
}

export function Composer({ big, steps, autoFocus, placeholder = "Ask about a line, a lot or a change", footnote, foot, onMood }: { big?: boolean; steps: Record<string, string>; autoFocus?: boolean; placeholder?: string; footnote?: boolean; foot?: string; onMood?: (m: MascotMode) => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [step, setStep] = useState<string | null>(null);
  function go(e: React.FormEvent) {
    e.preventDefault();
    const v = q.trim();
    if (!v) return;
    setStep(steps[v] ?? "Reading plant data");
    onMood?.("thinking");
    setTimeout(() => router.push(`/ask?q=${encodeURIComponent(v)}`), 700);
  }
  return (
    <form className={`composer2${big ? " big" : ""}`} onSubmit={go} role="search">
      {step ? <p className="thinking" role="status">{onMood ? null : <StampedMascot mode="thinking" size={20} />}{step}…</p> : null}
      <div className="c-row">
        <input value={q} onChange={(e) => { setQ(e.target.value); onMood?.(e.target.value.trim() ? "listening" : "ambient"); }} onBlur={() => { if (!step) onMood?.("ambient"); }} autoFocus={autoFocus} name="q" autoComplete="off" placeholder={placeholder} aria-label="Question" />
        <button className="btn btn-primary" type="submit" disabled={!!step}>Ask</button>
      </div>
      {foot || footnote ? <span className="c-foot">{foot ?? "Ask reads only."}</span> : null}
    </form>
  );
}

/** Overview opening: the same mascot as Ask, listening while you type. */
export function HomeAsk({ steps }: { steps: Record<string, string> }) {
  const [mood, setMood] = useState<MascotMode>("ambient");
  return (
    <div className="home-ask">
      <div className="ask-mascot"><StampedMascot mode={mood} size={160} arrive label="Stamped assistant" /></div>
      <Composer big steps={steps} foot="Ask the Stamped agent" onMood={setMood} />
    </div>
  );
}

/** Ask empty state: the mascot above the heading, listening while you type and thinking once you ask. */
export function AskHero({ steps, children }: { steps: Record<string, string>; children?: ReactNode }) {
  const [mood, setMood] = useState<MascotMode>("ambient");
  return (
    <>
      <div className="ask-mascot"><StampedMascot mode={mood} size={128} arrive label="Stamped assistant" /></div>
      <h1>Ask about your plant</h1>
      <p>Reads plant data and cites it. It cannot change a setting.</p>
      <div className="d-only"><Composer big autoFocus steps={steps} onMood={setMood} /></div>
      {children}
    </>
  );
}

const SUGGEST_PAGE = 8;

/** Eight example questions at a time. Open more reveals the next eight. */
export function SuggestList({ items }: { items: { q: string; href: string }[] }) {
  const [n, setN] = useState(SUGGEST_PAGE);
  const more = items.length - n;
  return (
    <div className="sugg-wrap">
      <div className="sugg">{items.slice(0, n).map((s) => <Link key={s.q} prefetch={false} href={s.href}>{s.q}</Link>)}</div>
      {more > 0 ? <button type="button" className="btn btn-sm show-more" onClick={() => setN((x) => x + SUGGEST_PAGE)}>Open more</button> : null}
    </div>
  );
}
