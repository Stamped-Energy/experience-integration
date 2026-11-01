/** Shared whole-card click: put className={clickableSurface} on the card, wrap the primary title in StretchLink, put nested controls in stretchOver. */
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export const clickableSurface = "clickable-surface";
export const stretchOver = "stretch-over";

export function StretchLink({ href, children, className, ...rest }: ComponentProps<typeof Link> & { children: ReactNode }) {
  return (
    <Link href={href} className={["stretch-link", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </Link>
  );
}
