"use client";
/** A card folds to a summary row; optional detail link on the summary, chevron toggles expand. */
import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { clickableSurface, stretchOver } from "@/components/ui/StretchLink";

export function FoldCard({
  summary,
  children,
  labelledBy,
  anchor,
  detailHref,
}: {
  summary: ReactNode;
  children: ReactNode;
  labelledBy: string;
  anchor?: string;
  detailHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const surface = detailHref ? clickableSurface : undefined;
  return (
    <article id={anchor} className={["card ex-card", surface].filter(Boolean).join(" ")} aria-labelledby={labelledBy} data-open={open}>
      <div className="ex-fold-row">
        {detailHref ? (
          <Link href={detailHref} className="ex-fold ex-fold-link" scroll={false} aria-labelledby={labelledBy}>
            {summary}
          </Link>
        ) : (
          <button type="button" className="ex-fold" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
            {summary}
          </button>
        )}
        <button
          type="button"
          className={`ex-chev-btn ${stretchOver}`}
          aria-expanded={open}
          aria-controls={id}
          aria-label={open ? "Collapse action" : "Expand action"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((o) => !o);
          }}
        >
          <svg className="ex-chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
      <div className="ex-body" id={id}>
        {children}
      </div>
    </article>
  );
}
