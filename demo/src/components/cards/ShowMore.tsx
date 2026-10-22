"use client";
/** Shows the first few children, then a button reveals the rest. */
import { Children, useState, type ReactNode } from "react";

export function ShowMore({ children, n = 4, className }: { children: ReactNode; n?: number; className?: string }) {
  const [all, setAll] = useState(false);
  const items = Children.toArray(children);
  return (
    <>
      <div className={className}>{all ? items : items.slice(0, n)}</div>
      {items.length > n ? <button type="button" className="btn btn-sm show-more" onClick={() => setAll((x) => !x)}>{all ? "Show fewer" : `Show more (${items.length - n})`}</button> : null}
    </>
  );
}
