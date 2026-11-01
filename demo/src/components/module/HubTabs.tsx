"use client";

import { usePathname } from "next/navigation";
import { Tabs } from "@/components/ui/primitives";
import type { HubDef } from "@/lib/module/hubs";

export function HubTabs({ hub, label }: { hub: HubDef; label: string }) {
  const path = usePathname();
  const items = hub.tabs.map((t) => ({
    href: t.href,
    label: t.label,
    active: t.match(path),
  }));
  return <Tabs label={label} items={items} />;
}
