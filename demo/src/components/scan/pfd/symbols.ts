import type { SymbolDef } from "./model";

const box = (extra = "") =>
  `<rect class="pc-state pc-run ${extra}" x="4" y="4" width="92" height="52" rx="6" /><rect class="pc-level" x="12" y="28" width="76" height="20" rx="2" />`;

export const FORGING_SYMBOLS: SymbolDef[] = [
  {
    id: "forge.induction",
    title: "Induction heater",
    category: "Heat",
    w: 100,
    h: 60,
    svg: `${box()}<path d="M20 18h60" stroke="currentColor" fill="none" stroke-width="2" /><circle cx="50" cy="18" r="4" fill="currentColor" />`,
    ports: [
      { id: "w", x: 4, y: 30, dir: "w" },
      { id: "e", x: 96, y: 30, dir: "e" },
    ],
  },
  {
    id: "forge.press",
    title: "Forging press",
    category: "Forming",
    w: 100,
    h: 70,
    svg: `<rect class="pc-state pc-run" x="8" y="8" width="84" height="54" rx="4" /><rect x="28" y="4" width="44" height="12" rx="2" class="pc-state" /><line x1="50" y1="16" x2="50" y2="62" stroke="currentColor" stroke-width="3" />`,
    ports: [
      { id: "w", x: 4, y: 35, dir: "w" },
      { id: "e", x: 96, y: 35, dir: "e" },
    ],
  },
  {
    id: "forge.furnace",
    title: "Batch furnace",
    category: "Heat treat",
    w: 90,
    h: 80,
    svg: `<rect class="pc-state" x="10" y="10" width="70" height="60" rx="4" /><rect class="pc-level" x="14" y="36" width="62" height="28" rx="2" /><path d="M20 18h50" stroke="currentColor" fill="none" />`,
    ports: [
      { id: "w", x: 4, y: 40, dir: "w" },
      { id: "e", x: 86, y: 40, dir: "e" },
    ],
  },
  {
    id: "forge.ht",
    title: "Heat treatment",
    category: "Heat treat",
    w: 100,
    h: 60,
    svg: box("pc-run"),
    ports: [
      { id: "w", x: 4, y: 30, dir: "w" },
      { id: "e", x: 96, y: 30, dir: "e" },
    ],
  },
  {
    id: "forge.machine",
    title: "CNC cell",
    category: "Machining",
    w: 100,
    h: 60,
    svg: `<rect class="pc-state pc-run" x="6" y="6" width="88" height="48" rx="4" /><rect x="18" y="18" width="64" height="24" rx="2" fill="none" stroke="currentColor" stroke-width="2" />`,
    ports: [
      { id: "w", x: 4, y: 30, dir: "w" },
      { id: "e", x: 96, y: 30, dir: "e" },
    ],
  },
  {
    id: "forge.inspect",
    title: "Inspection",
    category: "Quality",
    w: 90,
    h: 60,
    svg: `<rect class="pc-state" x="8" y="8" width="74" height="44" rx="6" /><path d="M30 30l10 10 20-22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />`,
    ports: [{ id: "w", x: 4, y: 30, dir: "w" }],
  },
  {
    id: "shape.panel",
    title: "Panel",
    category: "Layout",
    w: 120,
    h: 40,
    stretch: true,
    svg: `<rect class="pc-state" x="0" y="0" width="120" height="40" rx="8" fill="none" />`,
    ports: [],
  },
];

export const forgingSymbolMap = () => new Map(FORGING_SYMBOLS.map((s) => [s.id, s]));
