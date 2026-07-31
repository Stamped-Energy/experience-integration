import type { ComponentType, ReactNode, SVGProps } from "react";

type IconComp = ComponentType<SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }>;

/** shadcn-inspired empty state - calm placeholder when a list or panel has nothing to show. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: IconComp;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="forge-empty">
      {Icon ? (
        <span className="forge-empty__icon" aria-hidden>
          <Icon size={22} strokeWidth={2} />
        </span>
      ) : null}
      <p className="forge-empty__title">{title}</p>
      {description ? <p className="forge-empty__desc">{description}</p> : null}
      {action ? <div className="forge-empty__action">{action}</div> : null}
    </div>
  );
}
