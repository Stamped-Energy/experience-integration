"use client";
/** Revoke the Plant Box lease, with a confirm dialog. Illustrative: nothing is revoked. */
import { useRef, useState } from "react";

export function RevokeLease({ leaseId, allowed, reason }: { leaseId: string; allowed: boolean; reason: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [done, setDone] = useState(false);
  if (done) return <div className="card-foot"><span className="feedback" role="status">Lease {leaseId} revoked on site. The box is recommend-only until a new lease is signed. Illustrative.</span><span className="spacer" /><button type="button" className="btn btn-quiet" onClick={() => setDone(false)}>Undo</button></div>;
  return (
    <div className="card-foot">
      <button type="button" className="btn" disabled={!allowed} onClick={() => ref.current?.showModal()}>Revoke lease</button>
      {!allowed ? <span className="muted" style={{ fontSize: 12 }}>{reason}</span> : null}
      <dialog ref={ref} className="confirm" aria-labelledby="revoke-h">
        <h2 id="revoke-h">Revoke lease {leaseId}?</h2>
        <p>The Plant Box stops writing at once and becomes recommend-only. Running settings stay where they are. A new lease must be signed before the box writes again.</p>
        <p className="muted">Illustrative: nothing is revoked in this demonstration.</p>
        <div className="confirm-actions">
          <button type="button" className="btn" onClick={() => ref.current?.close()}>Cancel</button>
          <button type="button" className="btn btn-accent" onClick={() => { ref.current?.close(); setDone(true); }}>Revoke lease</button>
        </div>
      </dialog>
    </div>
  );
}
