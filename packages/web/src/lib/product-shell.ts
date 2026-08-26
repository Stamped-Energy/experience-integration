"use client";

import { DEMO_PLANT } from "@/lib/plant-catalog";
import { useAuth } from "@/lib/auth-context";
import { useDataSource } from "@/lib/data-source-context";
import { usePlant } from "@/lib/plant-context";
import { connectionFromProbe, toShellRole } from "@/lib/shell-session";
import type { ConnectionStatus, Role } from "@/lib/types";

export function useProductShell() {
  const { isDemoSession, membershipRole } = useAuth();
  const { activePlant, plants, setActivePlantId } = usePlant();
  const { probe } = useDataSource();

  const role: Role = isDemoSession
    ? "plant_head"
    : toShellRole(membershipRole);

  const connection: ConnectionStatus = isDemoSession
    ? { sse: "live", lastEventAt: DEMO_PLANT.demoAsOf }
    : connectionFromProbe(probe);

  const shellPlants = isDemoSession
    ? [{ id: DEMO_PLANT.plantId, name: DEMO_PLANT.plantName }]
    : plants.map((p) => ({ id: p.plantId, name: p.plantName }));

  const onPlantChange = isDemoSession ? undefined : setActivePlantId;

  return {
    activePlant,
    plants: shellPlants,
    onPlantChange,
    role,
    connection,
    isDemoSession,
  };
}
