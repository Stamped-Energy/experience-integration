"use client";
/** A card folds to a summary row that opens on tap or Enter/Space (a real button with aria-expanded). */
import { useId, useState, type ReactNode } from "react";

export function FoldCard({ summary, children, labelledBy, anchor }: { summary: ReactNode; children: ReactNode; labelledBy: string; anchor?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <article id={anchor} className="card ex-card" aria-labelledby={labelledBy} data-open={open}>
      <button type="button" className="ex-fold" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        {summary}
        <svg className="ex-chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden><path d="m6 9 6 6 6-6" /></svg>
      </button>
      <div className="ex-body" id={id}>{children}</div>
    </article>
  );
}
