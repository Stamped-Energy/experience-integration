"use client";

import { useCallback, useEffect, useState } from "react";
import { Panel } from "@/components/ui/primitives";
import { usePlant } from "@/lib/plant-context";

/** Staff-only gate for multi-plant demos. Clients stay on a single plant. */
export const STAFF_PLANT_PASSWORD = "Stamped123";
const UNLOCK_KEY = "l6.staffToolsUnlocked";

export function StaffPlantTools() {
  const { plants, activePlantId, activePlant, setActivePlantId } = usePlant();
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setUnlocked(window.sessionStorage.getItem(UNLOCK_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const unlock = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (password.trim() === STAFF_PLANT_PASSWORD) {
        setUnlocked(true);
        setError(null);
        setPassword("");
        try {
          window.sessionStorage.setItem(UNLOCK_KEY, "1");
        } catch {
          /* ignore */
        }
      } else {
        setError("Incorrect password");
      }
    },
    [password],
  );

  const lock = useCallback(() => {
    setUnlocked(false);
    try {
      window.sessionStorage.removeItem(UNLOCK_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <Panel data-staff-plant-tools>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <p className="forge-eyebrow" style={{ margin: 0 }}>
            Staff only
          </p>
          <h2 style={{ margin: "4px 0 0", fontFamily: "var(--forge-font-display)", fontSize: 16 }}>
            Plant context (demo)
          </h2>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 13,
              color: "var(--forge-on-surface-variant)",
              maxWidth: 480,
              lineHeight: 1.45,
            }}
          >
            Client product is single-plant. Staff can unlock to switch demo plants (LNM, Vinayak,
            Jaipur). Multi-plant for customers comes later.
          </p>
        </div>
        {unlocked ? (
          <button
            type="button"
            onClick={lock}
            style={{
              alignSelf: "flex-start",
              border: "1px solid var(--forge-outline-variant)",
              background: "transparent",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              color: "var(--forge-on-surface-variant)",
            }}
          >
            Lock
          </button>
        ) : null}
      </div>

      {!unlocked ? (
        <form
          onSubmit={unlock}
          style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10, maxWidth: 320 }}
        >
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Staff password
            <input
              type="password"
              autoComplete="off"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              style={{
                display: "block",
                width: "100%",
                marginTop: 6,
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid var(--forge-outline-variant)",
                background: "var(--forge-surface-container-lowest)",
                fontSize: 14,
              }}
            />
          </label>
          {error ? (
            <p role="alert" style={{ margin: 0, fontSize: 12, color: "var(--forge-error)" }}>
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            style={{
              alignSelf: "flex-start",
              background: "var(--forge-primary)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Unlock staff tools
          </button>
        </form>
      ) : (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10, maxWidth: 400 }}>
          <p style={{ margin: 0, fontSize: 13 }}>
            Active: <strong>{activePlant.plantName}</strong>
            <span style={{ color: "var(--forge-on-surface-variant)" }}> · {activePlant.plantId}</span>
          </p>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Switch plant
            <select
              aria-label="Staff plant switcher"
              className="forge-shell__plant-select"
              value={activePlantId}
              onChange={(e) => setActivePlantId(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                marginTop: 6,
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid var(--forge-outline-variant)",
                background: "#fff",
                color: "#1a1a1a",
                fontSize: 14,
              }}
            >
              {plants.map((p) => (
                <option key={p.plantId} value={p.plantId}>
                  {p.plantName}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </Panel>
  );
}
