import { at } from "./data";
import type { DeskItem } from "@/components/desk/desk-day";

/** Illustrative shift day list (Desk pattern). */
export const deskToday: DeskItem[] = [
  { id: "d-1", at: at(0, -2), title: "Review hold pressure proposal", sub: "Press P3 · inside signed band", href: "/process/proposals/prop-101", kind: "action" },
  { id: "d-2", at: at(0, -1, -30), title: "Confirm genealogy link for lot 3307", sub: "Quality · link confidence low", href: "/quality/links", kind: "action" },
  { id: "d-3", at: at(0, -1), title: "Shift handover note", sub: "Mixer torque high on last batch", href: "/activity/summary", kind: "note" },
  { id: "d-4", at: at(0, -3), title: "Simulation run ready to compare", sub: "4 configs on hold pressure", href: "/process/simulations", kind: "message" },
];
