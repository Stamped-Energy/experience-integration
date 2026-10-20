"use client";
/**
 * Adjust in band (spec §2.2 journey 3a, HAX G9). Any value inside the signed band (or Stamped's narrowing, whichever is
 * tighter) can be sent instead of the proposal. Values outside are refused with the reason; nothing is written in the showcase.
 */
import { useId, useState } from "react";

export interface AdjustSpec { name: string; unit: string; current: number; proposed: number; band: [number, number]; step: number; bandLabel: string }

export function AdjustInBand({ spec, onCancel, onSend }: { spec: AdjustSpec; onCancel: () => void; onSend: (v: number) => void }) {
  const id = useId();
  const [raw, setRaw] = useState(String(spec.proposed));
  const v = Number(raw);
  const dp = (String(spec.step).split(".")[1] ?? "").length;
  const valid = raw.trim() !== "" && Number.isFinite(v) && v >= spec.band[0] && v <= spec.band[1];
  const err = !valid ? (Number.isFinite(v) && raw.trim() !== "" ? `Outside the band. Send a value from ${spec.band[0]} to ${spec.band[1]} ${spec.unit}.` : "Enter a number.") : null;
  const nudge = (d: number) => setRaw(String(Math.min(spec.band[1], Math.max(spec.band[0], +(v + d).toFixed(dp)))));
  const pos = (x: number) => `${((x - spec.band[0]) / (spec.band[1] - spec.band[0])) * 100}%`;
  return (
    <form className="adjust" onSubmit={(e) => { e.preventDefault(); if (valid) onSend(v); }} aria-label={`Adjust ${spec.name} inside the band`}>
      <div className="adjust-row">
        <label htmlFor={id} className="adjust-label">{spec.name}<span className="muted"> · {spec.bandLabel} {spec.band[0]} to {spec.band[1]} {spec.unit}</span></label>
        <div className="adjust-field" data-invalid={!valid || undefined}>
          <button type="button" className="btn btn-sm" onClick={() => nudge(-spec.step)} aria-label={`Lower by ${spec.step}`}>−</button>
          <input id={id} inputMode="decimal" value={raw} onChange={(e) => setRaw(e.target.value)} aria-invalid={!valid} aria-describedby={`${id}-h`} />
          <span className="unit">{spec.unit}</span>
          <button type="button" className="btn btn-sm" onClick={() => nudge(spec.step)} aria-label={`Raise by ${spec.step}`}>+</button>
        </div>
      </div>
      <div className="adjust-track" aria-hidden>
        <div className="fill" />
        <i className="cur" style={{ left: pos(spec.current) }} title="Now" />
        <i className="prop" style={{ left: pos(spec.proposed) }} title="Proposed" />
        {valid ? <i className="mine" style={{ left: pos(v) }} /> : null}
      </div>
      <div className="adjust-foot">
        <span id={`${id}-h`} className={err ? "adjust-err" : "muted"}>{err ?? `Now ${spec.current}, proposed ${spec.proposed}, yours ${v} ${spec.unit}. The model band is for the proposal; a different value is recorded as your adjustment.`}</span>
        <span className="spacer" />
        <button type="button" className="btn btn-quiet btn-sm" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={!valid}>Send {valid ? `${v} ${spec.unit}` : ""}</button>
      </div>
    </form>
  );
}
