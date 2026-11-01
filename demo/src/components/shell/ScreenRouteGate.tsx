"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  defaultSiteId,
  effectiveFlags,
  isScreenEnabled,
  overviewHref,
  screenIdFromPath,
} from "@/lib/demo/screenFlags";

function subscribeFlags(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener("stamped-screen-flags", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("stamped-screen-flags", handler);
    window.removeEventListener("storage", handler);
  };
}

function useScreenFlagsRevision(): void {
  const siteId = defaultSiteId();
  useSyncExternalStore(
    subscribeFlags,
    () =>
      `${JSON.stringify(effectiveFlags(siteId, "process"))}|${JSON.stringify(effectiveFlags(siteId, "quality"))}`,
    () => "ssr",
  );
}

/** Redirects when a module screen is disabled via config + localStorage overrides. */
export function ScreenRouteGate({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const siteId = defaultSiteId();
  const hit = screenIdFromPath(path);
  useScreenFlagsRevision();

  const disabled = hit ? !isScreenEnabled(siteId, hit.module, hit.id) : false;

  useLayoutEffect(() => {
    if (!hit || !disabled) return;
    window.location.replace(overviewHref(hit.module));
  }, [disabled, hit]);

  if (disabled) {
    return null;
  }
  return children;
}
