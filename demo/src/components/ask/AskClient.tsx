"use client";
/** Client bits of Ask: numbered source markers that open the Sources strip, and the composer with its thinking state. */
import { useRouter } from "next/navigation";
import { useState, type MouseEvent, type ReactNode } from "react";
import { StampedMascot, type MascotState } from "@/components/mascot/StampedMascot";

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

export function Composer({ big, steps, autoFocus, placeholder = "Ask about a line, a lot or a change", footnote, onMood }: { big?: boolean; steps: Record<string, string>; autoFocus?: boolean; placeholder?: string; footnote?: boolean; onMood?: (m: MascotState) => void }) {
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
      {step ? <p className="thinking" role="status">{onMood ? null : <StampedMascot state="thinking" size={20} />}{step}…</p> : null}
      <div className="c-row">
        <input value={q} onChange={(e) => { setQ(e.target.value); onMood?.(e.target.value.trim() ? "listening" : "idle"); }} onBlur={() => { if (!step) onMood?.("idle"); }} autoFocus={autoFocus} name="q" autoComplete="off" placeholder={placeholder} aria-label="Question" />
        <button className="btn btn-primary" type="submit" disabled={!!step}>Ask</button>
      </div>
      {footnote ? <span className="c-foot">Ask reads only.</span> : null}
    </form>
  );
}

/** Ask empty state: the mascot above the heading, listening while you type and thinking once you ask. */
export function AskHero({ steps, children }: { steps: Record<string, string>; children?: ReactNode }) {
  const [mood, setMood] = useState<MascotState>("idle");
  return (
    <>
      <div className="ask-mascot"><StampedMascot state={mood} size={96} arrive label="Stamped assistant" /></div>
      <h1>Ask about your plant</h1>
      <p>Reads plant data and cites it. It cannot change a setting.</p>
      <Composer big autoFocus steps={steps} onMood={setMood} />
      {children}
    </>
  );
}
