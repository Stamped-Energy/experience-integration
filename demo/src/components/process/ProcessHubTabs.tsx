"use client";

import { usePathname } from "next/navigation";
import { hubForProcessPath } from "@/lib/module/hubs";
import { HubTabs } from "@/components/module/HubTabs";

export function ProcessHubTabs() {
  const path = usePathname();
  const hub = hubForProcessPath(path);
  if (!hub) return null;
  return <HubTabs hub={hub} label={`Process · ${hub.sidebarLabel}`} />;
}
