import Link from "next/link";
import type { ReactNode } from "react";

/** Empty state when list filters hide every row. */
export function FilterEmpty({
  clearHref,
  hint,
}: {
  clearHref?: string;
  hint?: ReactNode;
}) {
  return (
    <div className="filter-empty" role="status">
      <p className="filter-empty-title">No actions match these filters.</p>
      {hint ? <p className="muted filter-empty-hint">{hint}</p> : null}
      {clearHref ? (
        <Link className="btn btn-sm btn-outline" href={clearHref} scroll={false}>
          Clear filters
        </Link>
      ) : null}
    </div>
  );
}
