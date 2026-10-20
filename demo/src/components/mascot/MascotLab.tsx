"use client";
/** Mascot lab: every state and expression, and the live behaviour for each activity mode. Not linked from the menu. */
import { useState } from "react";
import { MASCOT_EXPRESSIONS, MASCOT_STATES } from "@/lib/mascot/engine";
import { MASCOT_MODES, type BehaviourFrame, type MascotMode } from "@/lib/mascot/behaviour";
import { StampedMascot } from "./StampedMascot";

export function MascotLab() {
  const [mode, setMode] = useState<MascotMode>("ambient");
  const [fast, setFast] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [now, setNow] = useState<BehaviourFrame | null>(null);
  function seen(f: BehaviourFrame) {
    setNow(f);
    setLog((l) => (l[0] === `${f.state} · ${f.expression}` ? l : [`${f.state} · ${f.expression}`, ...l].slice(0, 12)));
  }
  return (
    <div className="page mascot-lab">
      <h1>Mascot</h1>
      <p className="muted">The Stamped mascot, built on bloub (MIT). Pick an activity to watch how it behaves. Move the pointer near it and the eyes follow.</p>
      <section className="lab-live">
        <StampedMascot key={fast ? "f" : "s"} mode={mode} size={200} arrive label="Stamped assistant, live" idleTimes={fast ? { bored: 8, sleepy: 16, doze: 26 } : undefined} onBehaviour={seen} />
        <div>
          <div className="lab-modes" role="group" aria-label="Activity">
            {MASCOT_MODES.map((m) => <button key={m} type="button" className={`btn${m === mode ? " btn-primary" : ""}`} aria-pressed={m === mode} onClick={() => setMode(m)}>{m}</button>)}
          </div>
          <label className="lab-fast"><input type="checkbox" checked={fast} onChange={(e) => setFast(e.target.checked)} /> Short idle timers (bored at 8 s, sleepy at 16 s, dozing at 26 s)</label>
          <p className="lab-now" data-testid="lab-now">Now: <b>{now?.state ?? "arrival"}</b>, face <b>{now?.expression ?? "neutral"}</b></p>
          <ol className="lab-log">{log.map((l, i) => <li key={i}>{l}</li>)}</ol>
        </div>
      </section>
      <h2>States ({MASCOT_STATES.length})</h2>
      <div className="lab-grid">
        {MASCOT_STATES.map((s) => <figure key={s}><StampedMascot state={s} size={96} label={s} replay /><figcaption>{s}</figcaption></figure>)}
      </div>
      <h2>Expressions ({MASCOT_EXPRESSIONS.length})</h2>
      <div className="lab-grid">
        {MASCOT_EXPRESSIONS.map((e) => <figure key={e}><StampedMascot state="idle" expression={e} size={96} label={e} /><figcaption>{e}</figcaption></figure>)}
      </div>
      <h2>Small sizes</h2>
      <div className="lab-row">{MASCOT_MODES.map((m) => <figure key={m}><StampedMascot mode={m} size={28} label={m} /><figcaption>{m}</figcaption></figure>)}</div>
    </div>
  );
}
