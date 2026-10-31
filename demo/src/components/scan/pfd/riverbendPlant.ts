/**
 * Riverbend-style process plant diagram (PlantCraft deploy/demo/diagrams/riverbend-plant.json, Apache-2.0).
 * UI copy uses neutral demo naming; no third-party trademarks in labels.
 */
import rawDiagram from "../../../../third-party/plantcraft/diagrams/riverbend-plant.json";
import symbolsList from "../../../../third-party/plantcraft/symbols-bundle.json";
import type { DiagramDraft, Shown, Shows, Slot, State, SymbolDef, SymbolElement } from "./model";

export interface EquipmentDetail {
  id: string;
  title: string;
  assetHref: string;
  summary: string;
  tags: { label: string; value: string; unit?: string; state: State }[];
}

export function plantDiagram(): DiagramDraft {
  const d = rawDiagram as DiagramDraft;
  return {
    ...d,
    name: "Demo process plant",
    description: "Unit-by-unit process flow on one canvas · demonstration only",
  };
}

export function plantSymbolMap(): Map<string, SymbolDef> {
  return new Map((symbolsList as SymbolDef[]).map((item) => [item.id, item]));
}

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function shown(state: State, label: string, extra?: Partial<Shown>): Shown {
  return { state, label, value: null, unit: "", ...extra };
}

export function plantShows(): Shows {
  const diagram = plantDiagram();
  const map = new Map<string, Partial<Record<Slot, Shown>>>();
  for (const el of diagram.elements) {
    if (el.type === "symbol") {
      const h = hash(el.id);
      const st: State = h % 19 === 0 ? "alarm" : h % 11 === 0 ? "warning" : "ok";
      const row: Partial<Record<Slot, Shown>> = { state: shown(st, "State") };
      if (/pump|compressor|motor|fan|turbine/.test(el.symbol)) {
        row.running = shown(st, "Running", { on: h % 7 !== 0 });
      }
      if (/vessel|column|tank|basin|separator|reactor/.test(el.symbol)) {
        row.level = shown(st, "Level", { fraction: 0.25 + (h % 60) / 100 });
      }
      map.set(el.id, row);
    } else if (el.type === "value") {
      const h = hash(el.id);
      const num = 50 + (h % 950) / 10;
      map.set(el.id, {
        value: shown(h % 13 === 0 ? "warning" : "ok", el.label || "PV", {
          value: Number(num.toFixed(1)),
          unit: el.label.includes("°") ? "°C" : el.label.includes("m³") ? "m³/h" : "%",
        }),
      });
    } else if (el.type === "line") {
      map.set(el.id, { flow: shown("ok", "Flow", { on: true }) });
    }
  }
  return map;
}

export function equipmentDetail(el: SymbolElement): EquipmentDetail | undefined {
  if (!el.asset_id) return undefined;
  const title = el.label || el.asset_id;
  return {
    id: el.id,
    title,
    assetHref: `/plant/assets/${encodeURIComponent(el.asset_id)}`,
    summary: "Live tags and loops · demonstration data only",
    tags: [{ label: "Asset", value: el.asset_id, state: "ok" }],
  };
}
