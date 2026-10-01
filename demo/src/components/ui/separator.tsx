import type { CSSProperties } from "react";

/** shadcn-inspired horizontal rule for section breaks. */
export function Separator({
  style,
  className,
}: {
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <hr
      className={className ? `forge-separator ${className}` : "forge-separator"}
      style={style}
    />
  );
}
