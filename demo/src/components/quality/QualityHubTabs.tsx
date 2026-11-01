"use client";

import { usePathname } from "next/navigation";
import { hubForQualityPath } from "@/lib/module/hubs";
import { HubTabs } from "@/components/module/HubTabs";

export function QualityHubTabs() {
  const path = usePathname();
  const hub = hubForQualityPath(path);
  if (!hub) return null;
  return <HubTabs hub={hub} label={`Quality · ${hub.sidebarLabel}`} />;
}
