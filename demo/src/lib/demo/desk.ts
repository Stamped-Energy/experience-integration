import { at } from "./data";
import type { DeskItem } from "@/components/desk/desk-day";

/** Illustrative shift day list (Desk pattern). */
export const deskToday: DeskItem[] = [
  { id: "d-1", at: at(0, -2), title: "Review hold pressure proposal", sub: "Press P3 · inside signed band", href: "/process/proposals/prop-101", kind: "action" },
  { id: "d-2", at: at(0, -1, -30), title: "Confirm genealogy link for lot 3307", sub: "Quality · link confidence low", href: "/quality/links", kind: "action" },
  { id: "d-3", at: at(0, -1), title: "Shift handover note", sub: "Mixer torque high on last batch", href: "/activity/summary", kind: "note" },
  { id: "d-4", at: at(0, -3), title: "Simulation run ready to compare", sub: "Hold pressure · up to 4 configs", href: "/process/simulations?campaign=camp-p-sim-1", kind: "message" },
  { id: "d-5", at: at(0, -4), title: "Furnace zone 2 soak review", sub: "Demo HT campaign complete", href: "/process/simulations?campaign=camp-p-sim-2", kind: "message" },
  { id: "d-6", at: at(0, -5), title: "Open process line map", sub: "Press P3 in alarm on cavity weight", href: "/process/line", kind: "note" },
  { id: "d-7", at: at(0, -2, -45), title: "Quality sampling simulation", sub: "Lot 3307 hardness band", href: "/quality/simulations?campaign=camp-q-sim-1", kind: "action" },
];
