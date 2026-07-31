import type { ReactNode } from "react";
import "@/styles/forge-disclosure.css";

/** Collapsed-by-default disclosure for mobile essentials stacks. */
export function ForgeDisclosure({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details className={["forge-disclosure", className].filter(Boolean).join(" ")}>
      <summary className="forge-disclosure__summary">{title}</summary>
      <div className="forge-disclosure__body">{children}</div>
    </details>
  );
}
