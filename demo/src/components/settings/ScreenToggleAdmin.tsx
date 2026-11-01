"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  baseFlags,
  defaultSiteId,
  effectiveFlags,
  readOverrides,
  siteIds,
  siteLabel,
  writeOverrides,
  type ScreenFlagModule,
} from "@/lib/demo/screenFlags";
import { PROCESS_HUBS, QUALITY_HUBS } from "@/lib/module/hubs";
import { Section, Tag } from "@/components/ui/primitives";

const hubs: Record<ScreenFlagModule, typeof PROCESS_HUBS> = {
  process: PROCESS_HUBS,
  quality: QUALITY_HUBS,
};

export function ScreenTogglePanel() {
  const [siteId, setSiteId] = useState(defaultSiteId());
  const [tick, setTick] = useState(0);
  const bump = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    const onFlags = () => bump();
    window.addEventListener("stamped-screen-flags", onFlags);
    return () => window.removeEventListener("stamped-screen-flags", onFlags);
  }, [bump]);

  const overrides = useMemo(() => readOverrides(siteId), [siteId, tick]);

  const toggle = (module: ScreenFlagModule, id: string, next: boolean) => {
    const base = baseFlags(siteId, module);
    const merged = { ...readOverrides(siteId) };
    merged[id] = next;
    for (const key of Object.keys(base)) {
      if (merged[key] === base[key]) delete merged[key];
    }
    writeOverrides(siteId, merged);
    bump();
  };

  return (
    <>
      <p className="pfd-demo-banner">Demonstration · toggles layer on top of demo/src/config/screens.json</p>
      <Section title="Site" meta="Which plant configuration to edit">
        <div style={{ padding: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <label className="secondary">
            Site{" "}
            <select value={siteId} onChange={(e) => setSiteId(e.target.value)} aria-label="Site">
              {siteIds().map((id) => (
                <option key={id} value={id}>
                  {siteLabel(id)}
                </option>
              ))}
            </select>
          </label>
          <Tag tone="neutral">{siteLabel(siteId)}</Tag>
        </div>
      </Section>
      {(["process", "quality"] as ScreenFlagModule[]).map((module) => {
        const flags = effectiveFlags(siteId, module);
        return (
          <Section key={module} title={module === "process" ? "Process screens" : "Quality screens"} flush>
            <ul className="rows switch-rows" style={{ margin: 0 }}>
              {hubs[module].map((hub) => {
                const on = flags[hub.id] !== false;
                const overridden = hub.id in overrides;
                return (
                  <li key={hub.id} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto auto" }}>
                    <span>
                      <span className="row-title">{hub.sidebarLabel}</span>
                      <span className="row-sub">{hub.sidebarHref}</span>
                    </span>
                    {overridden ? <Tag tone="warning">Override</Tag> : <Tag tone="neutral">Config</Tag>}
                    <label className="switch-row">
                      <input
                        type="checkbox"
                        checked={on}
                        aria-label={`${hub.sidebarLabel} enabled`}
                        onChange={(e) => toggle(module, hub.id, e.target.checked)}
                      />
                      <span>{on ? "On" : "Off"}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </Section>
        );
      })}
    </>
  );
}
