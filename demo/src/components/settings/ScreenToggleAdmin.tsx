"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyPitchPreset,
  baseFlags,
  defaultSiteId,
  effectiveFlags,
  flagLabel,
  orderedFlagIds,
  readOverrides,
  siteIds,
  siteLabel,
  writeOverrides,
  type ScreenFlagModule,
} from "@/lib/demo/screenFlags";
import { Section, Tag } from "@/components/ui/primitives";

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

  const applyPitch = () => {
    applyPitchPreset(siteId);
    bump();
  };

  return (
    <>
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
          <button type="button" className="btn btn-sm btn-accent" onClick={applyPitch}>
            Pitch
          </button>
          <span className="muted" style={{ fontSize: 13 }}>
            Hides OEE, changeovers and Engineering. Keeps cycle time and tool life.
          </span>
        </div>
      </Section>
      {(["process", "quality"] as ScreenFlagModule[]).map((module) => {
        const flags = effectiveFlags(siteId, module);
        const ids = orderedFlagIds(module);
        return (
          <Section key={module} title={module === "process" ? "Process screens" : "Quality screens"} flush>
            <ul className="rows switch-rows" style={{ margin: 0 }}>
              {ids.map((id) => {
                const on = flags[id] !== false;
                const overridden = id in overrides;
                const label = flagLabel(module, id);
                return (
                  <li key={id} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto auto" }}>
                    <span>
                      <span className="row-title">{label}</span>
                      <span className="row-sub">{id}</span>
                    </span>
                    {overridden ? <Tag tone="warning">Override</Tag> : <Tag tone="neutral">Config</Tag>}
                    <label className="switch-row">
                      <input
                        type="checkbox"
                        checked={on}
                        aria-label={`${label} enabled`}
                        onChange={(e) => toggle(module, id, e.target.checked)}
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
