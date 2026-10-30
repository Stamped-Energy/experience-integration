"use client";
/** Whole-row navigation for DataTable. Nested links/buttons keep their own handlers via closest(). */
import { useRouter } from "next/navigation";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";

export function ClickableRow({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter();

  function navigate(e: MouseEvent | KeyboardEvent) {
    if ("metaKey" in e && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) {
      window.open(href, "_blank");
      return;
    }
    router.push(href);
  }

  function onClick(e: MouseEvent<HTMLTableRowElement>) {
    const t = e.target as HTMLElement;
    if (t.closest("a, button, input, select, textarea, label, [data-no-nav]")) return;
    if (e.defaultPrevented) return;
    navigate(e);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTableRowElement>) {
    if (e.key !== "Enter" && e.key !== " ") return;
    const t = e.target as HTMLElement;
    if (t !== e.currentTarget && t.closest("a, button, input, select, textarea, [data-no-nav]")) return;
    e.preventDefault();
    navigate(e);
  }

  return (
    <tr className="clickable-row" role="link" tabIndex={0} data-href={href} onClick={onClick} onKeyDown={onKeyDown}>
      {children}
    </tr>
  );
}
