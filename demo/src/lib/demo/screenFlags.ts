"use client";

import config from "@/config/screens.json";
import { PROCESS_HUBS, QUALITY_HUBS } from "@/lib/module/hubs";

export type ScreenFlagModule = "process" | "quality";

const STORAGE_KEY = "stamped-screen-flags";

type SiteConfig = {
  label: string;
  modules: Record<string, Record<string, boolean>>;
};

type ScreenConfig = {
  defaultSiteId: string;
  sites: Record<string, SiteConfig>;
};

const BASE = config as ScreenConfig;

export function siteIds(): string[] {
  return Object.keys(BASE.sites);
}

export function defaultSiteId(): string {
  return BASE.defaultSiteId;
}

export function siteLabel(siteId: string): string {
  return BASE.sites[siteId]?.label ?? siteId;
}

function hubIds(module: ScreenFlagModule): string[] {
  return (module === "process" ? PROCESS_HUBS : QUALITY_HUBS).map((h) => h.id);
}

export function baseFlags(siteId: string, module: ScreenFlagModule): Record<string, boolean> {
  const site = BASE.sites[siteId] ?? BASE.sites[BASE.defaultSiteId];
  const mod = site?.modules[module] ?? {};
  const out: Record<string, boolean> = {};
  for (const id of hubIds(module)) {
    out[id] = mod[id] !== false;
  }
  return out;
}

export function readOverrides(siteId: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Record<string, boolean>>;
    return parsed[siteId] ?? {};
  } catch {
    return {};
  }
}

export function writeOverrides(siteId: string, overrides: Record<string, boolean>) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, Record<string, boolean>>) : {};
    all[siteId] = overrides;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent("stamped-screen-flags"));
  } catch {
    /* ignore */
  }
}

export function effectiveFlags(siteId: string, module: ScreenFlagModule): Record<string, boolean> {
  const base = baseFlags(siteId, module);
  const overrides = readOverrides(siteId);
  const out = { ...base };
  for (const [id, on] of Object.entries(overrides)) {
    if (id in out) out[id] = on;
  }
  return out;
}

export function isScreenEnabled(siteId: string, module: ScreenFlagModule, screenId: string): boolean {
  return effectiveFlags(siteId, module)[screenId] !== false;
}

export function screenIdFromPath(path: string): { module: ScreenFlagModule; id: string } | null {
  const process = PROCESS_HUBS.find((h) => path === h.sidebarHref || path.startsWith(`${h.sidebarHref}/`));
  if (process) return { module: "process", id: process.id };
  const quality = QUALITY_HUBS.find((h) => path === h.sidebarHref || path.startsWith(`${h.sidebarHref}/`));
  if (quality) return { module: "quality", id: quality.id };
  return null;
}

export function overviewHref(module: ScreenFlagModule): string {
  return module === "process" ? "/process/proposals" : "/quality/actions";
}
