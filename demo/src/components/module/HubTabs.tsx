"use client";

import { usePathname } from "next/navigation";
import { Tabs } from "@/components/ui/primitives";
import type { HubDef } from "@/lib/module/hubs";
import { defaultSiteId, effectiveFlags, processTabFlagId } from "@/lib/demo/screenFlags";

export function HubTabs({ hub, label }: { hub: HubDef; label: string }) {
  const path = usePathname();
  const flags = effectiveFlags(defaultSiteId(), "process");
  const items = hub.tabs
    .filter((t) => {
      const tabFlag = processTabFlagId(t.href);
      return tabFlag == null || flags[tabFlag] !== false;
    })
    .map((t) => ({
      href: t.href,
      label: t.label,
      active: t.match(path),
    }));
  return <Tabs label={label} items={items} />;
}
