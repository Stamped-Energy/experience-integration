"use client";
/** A button that opens a confirm dialog before an illustrative change. Nothing is saved. */
import { useRef, useState, type ReactNode } from "react";

export function ConfirmAction({ label, title, body, confirm, done, allowed = true, reason, primary, small = true }: { label: string; title: string; body: ReactNode; confirm: string; done: string; allowed?: boolean; reason?: string; primary?: boolean; small?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [ok, setOk] = useState(false);
  if (ok) return <span className="set-done" role="status">{done} <button type="button" className="btn btn-quiet btn-sm" onClick={() => setOk(false)}>Undo</button></span>;
  return (
    <>
      <button type="button" className={`btn${primary ? " btn-primary" : ""}${small ? " btn-sm" : ""}`} disabled={!allowed} title={!allowed ? reason : undefined} onClick={() => ref.current?.showModal()}>{label}</button>
      <dialog ref={ref} className="confirm" aria-label={title}>
        <h2>{title}</h2>
        <div className="confirm-body">{body}</div>
        <p className="muted">Illustrative: nothing is changed in this demonstration.</p>
        <div className="confirm-actions">
          <button type="button" className="btn" onClick={() => ref.current?.close()}>Cancel</button>
          <button type="button" className="btn btn-accent" onClick={() => { ref.current?.close(); setOk(true); }}>{confirm}</button>
        </div>
      </dialog>
    </>
  );
}
