import { at } from "./data";
import type { DeskItem } from "@/components/desk/desk-day";

/** Illustrative shift day list (Desk pattern). Hrefs point at real proposals, lots and campaigns in data.ts. */
export const deskToday: DeskItem[] = [
  { id: "d-1", at: at(0, -2), title: "Review coil power proposal", sub: "Heater H1 · inside signed band", href: "/process/proposals/prop-102", kind: "action" },
  { id: "d-2", at: at(0, -1, -30), title: "Confirm genealogy link for lot 3307", sub: "Quality · link confidence low", href: "/quality/links", kind: "action" },
  { id: "d-3", at: at(0, -1), title: "Shift handover note", sub: "Billets waited hot after the die check", href: "/activity/summary", kind: "note" },
  { id: "d-4", at: at(0, -3), title: "Simulation run ready to compare", sub: "Hold pressure · up to 4 configs", href: "/process/simulations?campaign=camp-p-sim-1", kind: "message" },
  { id: "d-5", at: at(0, -4), title: "Furnace F1 soak review", sub: "Heat treatment campaign complete", href: "/process/simulations?campaign=camp-p-sim-2", kind: "message" },
  { id: "d-6", at: at(0, -5), title: "Open process line map", sub: "Heater H1 pyrometer flat for 40 min", href: "/process/line", kind: "note" },
  { id: "d-7", at: at(0, -2, -45), title: "Quality sampling simulation", sub: "Lot 3307 decarb band", href: "/quality/simulations?campaign=camp-q-sim-1", kind: "action" },
];
