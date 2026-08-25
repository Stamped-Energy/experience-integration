"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/primitives";
import { useDataSource } from "@/lib/data-source-context";
import { usePlant } from "@/lib/plant-context";
import {
  STAFF_IDLE_LOCK_MS,
  STAFF_PLANT_PASSWORD,
  STAFF_UNLOCK_AT_KEY,
  isStaffUnlocked,
  lockStaffTools,
  touchStaffUnlock,
  unlockStaffTools,
} from "@/lib/staff-unlock";

export { STAFF_PLANT_PASSWORD };

export function StaffPlantTools() {
  const router = useRouter();
  const { plants, activePlantId, activePlant, setActivePlantId } = usePlant();
  const { refresh: refreshUpstreams } = useDataSource();
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const syncUnlocked = useCallback(() => {
    const ok = isStaffUnlocked();
    setUnlocked(ok);
    if (!ok) setSecondsLeft(null);
    return ok;
  }, []);

  useEffect(() => {
    syncUnlocked();
  }, [syncUnlocked]);

  // 30s idle auto-lock while unlocked on this page
  useEffect(() => {
    if (!unlocked) return;
    touchStaffUnlock();
    const tick = window.setInterval(() => {
      if (!isStaffUnlocked()) {
        setUnlocked(false);
        setSecondsLeft(null);
        return;
      }
      try {
        const at = Number(window.sessionStorage.getItem(STAFF_UNLOCK_AT_KEY) ?? "0");
        const left = Math.max(0, Math.ceil((STAFF_IDLE_LOCK_MS - (Date.now() - at)) / 1000));
        setSecondsLeft(left);
        if (left <= 0) {
          lockStaffTools();
          setUnlocked(false);
          setSecondsLeft(null);
        }
      } catch {
        /* ignore */
      }
    }, 500);
    return () => window.clearInterval(tick);
  }, [unlocked]);

  const unlock = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (password.trim() === STAFF_PLANT_PASSWORD) {
        unlockStaffTools();
        setUnlocked(true);
        setError(null);
        setPassword("");
        setSecondsLeft(Math.ceil(STAFF_IDLE_LOCK_MS / 1000));
      } else {
        setError("Incorrect password");
      }
    },
    [password],
  );

  const lock = useCallback(() => {
    lockStaffTools();
    setUnlocked(false);
    setSecondsLeft(null);
  }, []);

  const onPlantChange = useCallback(
    (nextId: string) => {
      if (nextId === activePlantId) return;
      touchStaffUnlock();
      setSwitching(true);
      setActivePlantId(nextId);
      refreshUpstreams();
      router.refresh();
      window.setTimeout(() => setSwitching(false), 400);
    },
    [activePlantId, setActivePlantId, refreshUpstreams, router],
  );

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
            Client product is single-plant. Staff can unlock to switch demo plants. Leaving this
            page or waiting 30 seconds locks again.
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
          {secondsLeft != null ? (
            <p style={{ margin: 0, fontSize: 12, color: "var(--forge-warning)" }}>
              Auto-locks in {secondsLeft}s · also locks when you leave Administration
            </p>
          ) : null}
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Switch plant
            <select
              aria-label="Staff plant switcher"
              className="forge-shell__plant-select"
              value={activePlantId}
              disabled={switching}
              onChange={(e) => onPlantChange(e.target.value)}
              onFocus={() => touchStaffUnlock()}
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
          {switching ? (
            <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
              Clearing and refetching plant data…
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
              Changing plant remounts the app shell and refetches from L2/L5 for the selected plant.
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}
