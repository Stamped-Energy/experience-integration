"use client";
/** Client bits of Ask: numbered source markers that open the Sources strip, and the composer with its thinking state. */
import { useRouter } from "next/navigation";
import { Children, isValidElement, useState, type MouseEvent, type ReactNode } from "react";
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

const HIST_PAGE = 10;
const isHead = (c: ReactNode) => isValidElement(c) && !!(c.props as { "data-head"?: boolean })["data-head"];

/** Past conversations: ten rows, then Open more at the bottom of the scroll. */
export function HistScroll({ children }: { children: ReactNode }) {
  const all = Children.toArray(children);
  const items = all.filter((c) => !isHead(c));
  const openAt = items.findIndex((c) => isValidElement(c) && String((c.props as { className?: string }).className ?? "").split(" ").includes("on"));
  const [n, setN] = useState(openAt >= 0 ? Math.ceil((openAt + 1) / HIST_PAGE) * HIST_PAGE : HIST_PAGE);
  let seen = 0;
  const shown: ReactNode[] = [];
  for (const child of all) {
    if (isHead(child)) { shown.push(child); continue; }
    if (seen >= n) break;
    seen++;
    shown.push(child);
  }
  while (shown.length && isHead(shown[shown.length - 1])) shown.pop();
  const more = items.length - seen;
  return (
    <div className="h-scroll">
      {shown}
      {more > 0 ? <button type="button" className="btn btn-sm h-more" onClick={() => setN((x) => x + HIST_PAGE)}>Open more</button> : null}
    </div>
  );
}
