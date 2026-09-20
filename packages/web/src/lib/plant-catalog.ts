/**
 * Plant catalog + shell defaults — not KPI/alarm fixtures.
 * Prefer `/api/plants` when the session is authenticated; this catalog is the
 * offline switcher list until every screen loads plants from the BFF.
 *
 * Default identity is the generic demo plant (or STAMPED_DEFAULT_PLANT_ID).
 * LNM Faridabad is a site pack — see `@/sites/lnm`.
 */
import type { ConnectionStatus, Role } from "@/lib/types";
import { LNM_PLANT } from "@/sites/lnm/catalog";

export { LNM_PLANT };

export const DEMO_PLANT = {
  orgId: "org_demo",
  orgName: "Jaipur Works",
  plantId: "plant_jaipur_01",
  plantName: "Jaipur Works",
  timezone: "Asia/Kolkata",
  tariff: "Rajasthan HT industrial TOD",
  cmdKva: 5000,
  contractDemandNote: "CMD 5,000 kVA · billing window Jul 2026",
  shift: "A · 06:00–14:00 IST",
  demoAsOf: "2026-07-21T10:15:00+05:30",
};

export const VINAYAK_PLANT = {
  orgId: "org_acme",
  orgName: "Acme",
  plantId: "plant_vinayak_1",
  plantName: "Vinayak Plant",
  timezone: "Asia/Kolkata",
  tariff: "Rajasthan HT industrial TOD",
  cmdKva: 5000,
  contractDemandNote: "CMD 5,000 kVA · billing window Jul 2026",
  shift: "A · 06:00–14:00 IST",
  demoAsOf: "2026-07-21T10:15:00+05:30",
};

/** Generic demo first. LNM is an explicit site, not the unnamed default. */
export const PLANTS = [DEMO_PLANT, VINAYAK_PLANT, LNM_PLANT];

export const DEMO_SHELL_ROLE: Role = "admin";

export function defaultPlantId(): string {
  const fromEnv =
    (typeof process !== "undefined" &&
      (process.env.NEXT_PUBLIC_STAMPED_DEFAULT_PLANT_ID?.trim() ||
        process.env.STAMPED_DEFAULT_PLANT_ID?.trim())) ||
    "";
  if (fromEnv && PLANTS.some((p) => p.plantId === fromEnv)) return fromEnv;
  return DEMO_PLANT.plantId;
}

export function plantForId(plantId: string) {
  return PLANTS.find((p) => p.plantId === plantId) ?? DEMO_PLANT;
}

export function defaultPlant() {
  return plantForId(defaultPlantId());
}

export const connectionFixture: ConnectionStatus = {
  sse: "live",
  lastEventAt: defaultPlant().demoAsOf,
};
