import Link from "next/link";
import type { ReactNode } from "react";

/** Empty state when list filters hide every row. Matches EmptyState chrome. */
export function FilterEmpty({
  clearHref,
  hint,
}: {
  clearHref?: string;
  hint?: ReactNode;
}) {
  return (
    <div className="empty filter-empty" role="status">
      <h3 className="filter-empty-title">No actions match these filters.</h3>
      {hint ? <p className="muted filter-empty-hint">{hint}</p> : null}
      {clearHref ? (
        <Link className="btn btn-sm btn-outline" href={clearHref} scroll={false}>
          Clear filters
        </Link>
      ) : null}
    </div>
  );
}
