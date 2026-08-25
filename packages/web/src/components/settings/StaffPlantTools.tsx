"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/primitives";
import {
  listPlants,
  setActivePlant as setActivePlantApi,
  type AuthorizedPlantDto,
} from "@/lib/admin-api";
import { useAuth } from "@/lib/auth-context";
import { useDataSource } from "@/lib/data-source-context";
import { plantForId } from "@/lib/plant-catalog";
import { usePlant } from "@/lib/plant-context";

/**
 * Plant switcher backed by GET/POST `/api/plants` — no toy password.
 * Syncs BFF active plant and local catalog selection via externalPlantId.
 */
export function StaffPlantTools() {
  const router = useRouter();
  const { setActivePlantId } = usePlant();
  const { refresh: refreshSession } = useAuth();
  const { refresh: refreshUpstreams } = useDataSource();
  const [plants, setPlants] = useState<AuthorizedPlantDto[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPlants();
      setPlants(data.plants);
      setActiveId(data.activePlant?.id ?? data.plants[0]?.id ?? "");
    } catch (err) {
      setPlants([]);
      setActiveId("");
      setError(err instanceof Error ? err.message : "Could not load plants");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onPlantChange = useCallback(
    async (nextId: string) => {
      if (!nextId || nextId === activeId) return;
      const plant = plants.find((p) => p.id === nextId);
      if (!plant) return;
      setSwitching(true);
      setError(null);
      try {
        await setActivePlantApi({ orgId: plant.orgId, plantId: plant.id });
        setActiveId(plant.id);
        const catalog = plantForId(plant.externalPlantId);
        if (catalog.plantId === plant.externalPlantId) {
          setActivePlantId(plant.externalPlantId);
        }
        await refreshSession();
        refreshUpstreams();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Plant switch failed");
      } finally {
        setSwitching(false);
      }
    },
    [
      activeId,
      plants,
      setActivePlantId,
      refreshSession,
      refreshUpstreams,
      router,
    ],
  );

  const active = plants.find((p) => p.id === activeId) ?? null;

  return (
    <Panel data-staff-plant-tools>
      <div>
        <p className="forge-eyebrow" style={{ margin: 0 }}>
          Plant context
        </p>
        <h2 style={{ margin: "4px 0 0", fontFamily: "var(--forge-font-display)", fontSize: 16 }}>
          Authorized plants
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
          Switch the active plant for your account. Most users stay on one site;
          available plants come from your membership.
        </p>
      </div>

      {loading ? (
        <p style={{ margin: "16px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
          Loading plants…
        </p>
      ) : error && plants.length === 0 ? (
        <p role="alert" style={{ margin: "16px 0 0", fontSize: 13, color: "var(--forge-error)" }}>
          {error}
        </p>
      ) : plants.length === 0 ? (
        <p style={{ margin: "16px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
          No authorized plants on this session.
        </p>
      ) : (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10, maxWidth: 400 }}>
          {active ? (
            <p style={{ margin: 0, fontSize: 13 }}>
              Active: <strong>{active.name}</strong>
              <span style={{ color: "var(--forge-on-surface-variant)" }}>
                {" "}
                · {active.externalPlantId}
              </span>
            </p>
          ) : null}
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Switch plant
            <select
              aria-label="Plant switcher"
              className="forge-shell__plant-select"
              value={activeId}
              disabled={switching}
              onChange={(e) => void onPlantChange(e.target.value)}
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
                <option key={p.id} value={p.id}>
                  {p.name} ({p.role.replaceAll("_", " ")})
                </option>
              ))}
            </select>
          </label>
          {error ? (
            <p role="alert" style={{ margin: 0, fontSize: 12, color: "var(--forge-error)" }}>
              {error}
            </p>
          ) : null}
          {switching ? (
            <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
              Saving active plant…
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
              Saves your selection and refreshes plant data.
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}
