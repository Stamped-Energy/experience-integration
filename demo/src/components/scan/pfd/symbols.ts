import type { SymbolDef } from "./model";

const vessel = (extra = "") =>
  `<rect class="pc-state pc-run ${extra}" x="6" y="8" width="108" height="68" rx="8" /><rect class="pc-level" x="14" y="42" width="92" height="26" rx="3" />`;

export const FORGING_SYMBOLS: SymbolDef[] = [
  {
    id: "forge.induction",
    title: "Induction heater",
    category: "Heat",
    w: 120,
    h: 84,
    svg: `${vessel()}<ellipse cx="60" cy="22" rx="28" ry="8" fill="none" stroke="currentColor" stroke-width="2" /><path d="M32 22h56" stroke="currentColor" stroke-width="2" />`,
    ports: [
      { id: "w", x: 4, y: 42, dir: "w" },
      { id: "e", x: 116, y: 42, dir: "e" },
    ],
  },
  {
    id: "forge.press",
    title: "Forging press",
    category: "Forming",
    w: 120,
    h: 96,
    svg: `<rect class="pc-state pc-run" x="10" y="12" width="100" height="72" rx="6" /><rect x="34" y="4" width="52" height="16" rx="3" class="pc-state" /><line x1="60" y1="20" x2="60" y2="84" stroke="currentColor" stroke-width="4" /><rect x="22" y="52" width="76" height="28" rx="4" fill="none" stroke="currentColor" stroke-width="2" />`,
    ports: [
      { id: "w", x: 4, y: 48, dir: "w" },
      { id: "e", x: 116, y: 48, dir: "e" },
    ],
  },
  {
    id: "forge.furnace",
    title: "Batch furnace",
    category: "Heat treat",
    w: 120,
    h: 100,
    svg: `<rect class="pc-state" x="8" y="10" width="104" height="80" rx="6" /><rect class="pc-level" x="14" y="48" width="92" height="34" rx="3" /><path d="M24 24h72M24 34h72M24 44h72" stroke="currentColor" fill="none" stroke-width="1.5" opacity="0.6" />`,
    ports: [
      { id: "w", x: 4, y: 50, dir: "w" },
      { id: "e", x: 116, y: 50, dir: "e" },
    ],
  },
  {
    id: "forge.quench",
    title: "Quench tank",
    category: "Heat treat",
    w: 110,
    h: 88,
    svg: `<rect class="pc-state pc-run" x="8" y="14" width="94" height="62" rx="4" /><rect class="pc-level" x="12" y="48" width="86" height="24" rx="2" /><path d="M20 22h70" stroke="currentColor" stroke-width="2" /><circle cx="55" cy="30" r="6" fill="none" stroke="currentColor" stroke-width="2" />`,
    ports: [
      { id: "w", x: 4, y: 44, dir: "w" },
      { id: "e", x: 106, y: 44, dir: "e" },
    ],
  },
  {
    id: "forge.ht",
    title: "Temper line",
    category: "Heat treat",
    w: 120,
    h: 84,
    svg: vessel("pc-run"),
    ports: [
      { id: "w", x: 4, y: 42, dir: "w" },
      { id: "e", x: 116, y: 42, dir: "e" },
    ],
  },
  {
    id: "forge.machine",
    title: "CNC cell",
    category: "Machining",
    w: 120,
    h: 84,
    svg: `<rect class="pc-state pc-run" x="8" y="8" width="104" height="68" rx="6" /><rect x="22" y="24" width="76" height="36" rx="3" fill="none" stroke="currentColor" stroke-width="2.5" /><circle cx="38" cy="42" r="8" fill="none" stroke="currentColor" stroke-width="2" />`,
    ports: [
      { id: "w", x: 4, y: 42, dir: "w" },
      { id: "e", x: 116, y: 42, dir: "e" },
    ],
  },
  {
    id: "forge.inspect",
    title: "Inspection",
    category: "Quality",
    w: 110,
    h: 84,
    svg: `<rect class="pc-state" x="8" y="10" width="94" height="64" rx="8" /><path d="M32 42l12 12 26-28" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />`,
    ports: [{ id: "w", x: 4, y: 42, dir: "w" }],
  },
  {
    id: "forge.pump",
    title: "Utility pump",
    category: "Utilities",
    w: 56,
    h: 56,
    svg: `<circle class="pc-state pc-run" cx="28" cy="28" r="22" /><circle cx="28" cy="28" r="8" fill="none" stroke="currentColor" stroke-width="2" /><path d="M28 10v8M28 38v8M10 28h8M38 28h8" stroke="currentColor" stroke-width="2" />`,
    ports: [
      { id: "n", x: 28, y: 4, dir: "n" },
      { id: "s", x: 28, y: 52, dir: "s" },
    ],
  },
  {
    id: "shape.panel",
    title: "Panel",
    category: "Layout",
    w: 120,
    h: 40,
    stretch: true,
    svg: `<rect class="pc-state" x="0" y="0" width="120" height="40" rx="8" fill="none" stroke-dasharray="4 3" />`,
    ports: [],
  },
];

export const forgingSymbolMap = () => new Map(FORGING_SYMBOLS.map((s) => [s.id, s]));
