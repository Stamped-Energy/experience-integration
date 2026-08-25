/**
 * Plant catalog + shell defaults — not KPI/alarm fixtures.
 * Prefer `/api/plants` when the session is authenticated; this catalog is the
 * offline switcher list until every screen loads plants from the BFF.
 */
import type { ConnectionStatus, Role } from "@/lib/types";

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

export const LNM_PLANT = {
  orgId: "org_acme",
  orgName: "Acme",
  plantId: "plant_lnm_faridabad_1",
  plantName: "LNM Factory 1",
  timezone: "Asia/Kolkata",
  tariff: "DHBVN HT industrial TOD",
  cmdKva: 2500,
  contractDemandNote: "CMD 2,500 kVA · Faridabad Sector 59",
  shift: "A · 06:00–14:00 IST",
  demoAsOf: "2026-08-25T10:15:00+05:30",
};

export const PLANTS = [LNM_PLANT, VINAYAK_PLANT, DEMO_PLANT];

export const DEMO_SHELL_ROLE: Role = "admin";

export const connectionFixture: ConnectionStatus = {
  sse: "live",
  lastEventAt: LNM_PLANT.demoAsOf,
};

export function plantForId(plantId: string) {
  return PLANTS.find((p) => p.plantId === plantId) ?? LNM_PLANT;
}
