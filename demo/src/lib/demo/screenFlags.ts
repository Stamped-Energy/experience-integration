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

/** Hub ids plus tab-level Process flags (OEE / SMED) that can be toggled independently of Performance. */
function flagIds(module: ScreenFlagModule): string[] {
  const hubs = (module === "process" ? PROCESS_HUBS : QUALITY_HUBS).map((h) => h.id);
  return module === "process" ? [...hubs, "oee", "smed"] : hubs;
}

const TAB_FLAG_LABELS: Record<string, string> = {
  oee: "OEE",
  smed: "Changeovers (SMED)",
};

export function flagLabel(module: ScreenFlagModule, id: string): string {
  if (module === "process" && TAB_FLAG_LABELS[id]) return TAB_FLAG_LABELS[id];
  const hubs = module === "process" ? PROCESS_HUBS : QUALITY_HUBS;
  return hubs.find((h) => h.id === id)?.sidebarLabel ?? id;
}

export function orderedFlagIds(module: ScreenFlagModule): string[] {
  return flagIds(module);
}

export function baseFlags(siteId: string, module: ScreenFlagModule): Record<string, boolean> {
  const site = BASE.sites[siteId] ?? BASE.sites[BASE.defaultSiteId];
  const mod = site?.modules[module] ?? {};
  const out: Record<string, boolean> = {};
  for (const id of flagIds(module)) {
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
  // Tab-level Process flags before hub match so OEE / SMED can hide without killing Performance.
  if (path === "/process/oee") return { module: "process", id: "oee" };
  if (path === "/process/smed") return { module: "process", id: "smed" };
  // Match via hub tabs, not sidebarHref prefix (Lines uses `/process`, which would swallow every Process path).
  const process = PROCESS_HUBS.find((h) => h.tabs.some((t) => t.match(path)));
  if (process) return { module: "process", id: process.id };
  const quality = QUALITY_HUBS.find((h) => h.tabs.some((t) => t.match(path)));
  if (quality) return { module: "quality", id: quality.id };
  return null;
}

/** Pitch meeting: hide OEE, SMED and Engineering; keep cycle time and tool life under Performance. */
export function applyPitchPreset(siteId: string) {
  const processBase = baseFlags(siteId, "process");
  const overrides: Record<string, boolean> = {
    ...readOverrides(siteId),
    oee: false,
    smed: false,
    engineering: false,
  };
  for (const key of Object.keys(overrides)) {
    if (key in processBase && overrides[key] === processBase[key]) delete overrides[key];
  }
  writeOverrides(siteId, overrides);
}

/** Tab href → optional Process tab-level flag id. */
export function processTabFlagId(href: string): "oee" | "smed" | null {
  if (href === "/process/oee") return "oee";
  if (href === "/process/smed") return "smed";
  return null;
}

export function overviewHref(module: ScreenFlagModule): string {
  return module === "process" ? "/process/proposals" : "/quality/actions";
}
