"use client";
/** Arrow keys move focus between plant map tiles: left and right along a lane, up and down to the nearest tile in the next lane. */
import type { ReactNode, KeyboardEvent } from "react";

export function TileKeys({ children, className }: { children: ReactNode; className?: string }) {
  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    const tiles = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[data-tile]"));
    const cur = document.activeElement as HTMLElement | null;
    const i = cur ? tiles.indexOf(cur) : -1;
    if (i < 0) return;
    e.preventDefault();
    let next: HTMLElement | undefined;
    if (e.key === "ArrowLeft") next = tiles[i - 1];
    else if (e.key === "ArrowRight") next = tiles[i + 1];
    else {
      const r = cur!.getBoundingClientRect();
      const cands = tiles.filter((t) => { const b = t.getBoundingClientRect(); return e.key === "ArrowDown" ? b.top > r.bottom - 2 : b.bottom < r.top + 2; });
      const rowY = e.key === "ArrowDown" ? Math.min(...cands.map((t) => t.getBoundingClientRect().top)) : Math.max(...cands.map((t) => t.getBoundingClientRect().top));
      next = cands.filter((t) => Math.abs(t.getBoundingClientRect().top - rowY) < 4).sort((a, b) => Math.abs(a.getBoundingClientRect().left - r.left) - Math.abs(b.getBoundingClientRect().left - r.left))[0];
    }
    next?.focus();
  }
  return <div className={className} onKeyDown={onKey}>{children}</div>;
}
