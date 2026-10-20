"use client";
import type { ReactNode } from "react";
import { useAsk } from "@/components/shell/ShellClient";

export type PanelItem = { id: string; assetId?: string; lineId: string; node: ReactNode };
/** Picks the conversation for the scope chip: asset, then line, then the general fallback. */
export function PanelPicker({ items, names, fallback }: { items: PanelItem[]; names: { assets: Record<string, { id: string; lineId: string }>; lines: Record<string, string> }; fallback: ReactNode }) {
  const { context } = useAsk();
  const c = (context ?? "").toLowerCase();
  const asset = Object.entries(names.assets).find(([n]) => c.includes(n))?.[1];
  const lineId = asset?.lineId ?? Object.entries(names.lines).sort((a, b) => b[0].length - a[0].length).find(([n]) => c.includes(n))?.[1];
  const pick = (asset && items.find((i) => i.assetId === asset.id)) || (lineId && items.find((i) => !i.assetId && i.lineId === lineId)) || undefined;
  return <>{pick ? pick.node : fallback}</>;
}
