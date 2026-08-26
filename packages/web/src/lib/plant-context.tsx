"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/auth-context";
import { DEMO_PLANT, LNM_PLANT, PLANTS } from "@/lib/plant-catalog";

const STORAGE_KEY = "l6.activePlantId";

export type PlantOption = {
  orgId: string;
  orgName: string;
  plantId: string;
  plantName: string;
  timezone: string;
  tariff: string;
  cmdKva: number;
  contractDemandNote: string;
  shift: string;
  demoAsOf: string;
};

export type PlantContextValue = {
  /** LNM (CNC demo) first, then Vinayak, then Jaipur offline. */
  plants: PlantOption[];
  activePlantId: string;
  activePlant: PlantOption;
  /**
   * Increments on every successful plant change so shells/hooks can drop
   * stale in-memory data and remount / refetch from upstream.
   */
  plantEpoch: number;
  setActivePlantId: (plantId: string) => void;
};

const PlantContext = createContext<PlantContextValue | null>(null);

function resolvePlant(plantId: string): PlantOption {
  return PLANTS.find((p) => p.plantId === plantId) ?? LNM_PLANT;
}

/**
 * Active-plant provider — defaults to LNM Factory 1 for the CNC demo path
 * and persists selection across sessions via localStorage.
 */
export function PlantProvider({ children }: { children: ReactNode }) {
  const { isDemoSession } = useAuth();
  const [activePlantId, setActivePlantIdState] = useState<string>(
    LNM_PLANT.plantId,
  );
  const [plantEpoch, setPlantEpoch] = useState(0);

  useEffect(() => {
    if (isDemoSession) {
      setActivePlantIdState(DEMO_PLANT.plantId);
      return;
    }
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && PLANTS.some((p) => p.plantId === stored)) {
        setActivePlantIdState(stored);
      }
    } catch {
      /* localStorage unavailable - keep default */
    }
  }, [isDemoSession]);

  const setActivePlantId = useCallback(
    (plantId: string) => {
      if (isDemoSession) return;
      setActivePlantIdState((prev) => {
        if (prev === plantId) return prev;
        setPlantEpoch((n) => n + 1);
        return plantId;
      });
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(STORAGE_KEY, plantId);
        } catch {
          /* ignore persistence failures */
        }
      }
    },
    [isDemoSession],
  );

  const catalogPlants = isDemoSession ? [DEMO_PLANT] : PLANTS;
  const effectivePlantId = isDemoSession ? DEMO_PLANT.plantId : activePlantId;

  const value = useMemo<PlantContextValue>(
    () => ({
      plants: catalogPlants,
      activePlantId: effectivePlantId,
      activePlant: resolvePlant(effectivePlantId),
      plantEpoch,
      setActivePlantId,
    }),
    [catalogPlants, effectivePlantId, plantEpoch, setActivePlantId],
  );

  return <PlantContext.Provider value={value}>{children}</PlantContext.Provider>;
}

/** Reads the active plant; falls back to LNM default outside a provider. */
export function usePlant(): PlantContextValue {
  const ctx = useContext(PlantContext);
  if (ctx) return ctx;
  return {
    plants: PLANTS,
    activePlantId: LNM_PLANT.plantId,
    activePlant: LNM_PLANT,
    plantEpoch: 0,
    setActivePlantId: () => {
      /* no-op outside PlantProvider */
    },
  };
}
