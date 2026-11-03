"use client";
/** A card folds to a summary row; optional detail link on the summary, chevron toggles expand. */
import Link from "next/link";
import { createContext, useContext, useId, useState, type ReactNode } from "react";
import { clickableSurface, stretchOver } from "@/components/ui/StretchLink";

type FoldApi = { open: boolean; toggle: () => void; controlsId: string };

const FoldCtx = createContext<FoldApi | null>(null);

export function useFoldCard() {
  const ctx = useContext(FoldCtx);
  if (!ctx) throw new Error("useFoldCard outside FoldCard");
  return ctx;
}

export function FoldCardChevron({ className }: { className?: string }) {
  const { open, toggle, controlsId } = useFoldCard();
  return (
    <button
      type="button"
      className={[ "ex-chev-btn", stretchOver, className ].filter(Boolean).join(" ")}
      aria-expanded={open}
      aria-controls={controlsId}
      aria-label={open ? "Collapse action" : "Expand action"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
    >
      <svg className="ex-chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
}

export function FoldCard({
  summary,
  children,
  labelledBy,
  anchor,
  detailHref,
  className,
}: {
  summary: ReactNode;
  children: ReactNode;
  labelledBy: string;
  anchor?: string;
  detailHref?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const surface = detailHref ? clickableSurface : undefined;
  const api: FoldApi = { open, toggle: () => setOpen((o) => !o), controlsId: id };
  return (
    <FoldCtx.Provider value={api}>
      <article id={anchor} className={["card ex-card", surface, className].filter(Boolean).join(" ")} aria-labelledby={labelledBy} data-open={open}>
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
        </div>
        <div className="ex-body" id={id}>
          {children}
        </div>
      </article>
    </FoldCtx.Provider>
  );
}
