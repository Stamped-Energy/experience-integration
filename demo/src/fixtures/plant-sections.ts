/**
 * Plant section hierarchy for drill-down flow map - Jaipur Works.
 * Modelled on a Rajasthan dry-process integrated cement plant: limestone
 * crusher → VRM raw mill → 5-stage preheater kiln → roller-press/ball-mill
 * grinding → rotary packers, with WHR, rooftop/ground PV and DG standby.
 */

import {
  viewBoxMetrics,
  type PlantSectionLevel,
  type PlantSectionNode,
} from "../lib/plant-map-layout";

export type { PlantSectionLevel, PlantSectionNode, SectionHealth } from "../lib/plant-map-layout";
export {
  PLANT_CARD_H,
  PLANT_CARD_W,
  flowLabelPoint,
  flowPathBetween,
  nodeById,
  viewBoxMetrics,
} from "../lib/plant-map-layout";

const TONE = {
  hot: { accent: "#d6453a", surface: "#fff1ee" },
  watch: { accent: "#c98a0b", surface: "#fff8e9" },
  calm: { accent: "#2f8f7f", surface: "#edf8f5" },
  standby: { accent: "#7c8591", surface: "#f3f4f6" },
} as const;

/** Equipment card; health follows load (≥105 % critical, ≥90 % warning). */
function eq(
  id: string,
  name: string,
  area: string,
  kw: number,
  loadPct: number,
  x: number,
  y: number,
  extra: Partial<PlantSectionNode> = {},
): PlantSectionNode {
  const health = loadPct >= 105 ? "hot" : loadPct >= 90 ? "watch" : "calm";
  const tone = extra.status === "standby" ? TONE.standby : TONE[health];
  return { id, name, area, kw, loadPct, health, ...tone, x, y, status: "running", ...extra };
}

const POWER_CHILDREN: PlantSectionNode[] = [
  eq("eb_incomer", "33 kV Grid Incomer", "JVVNL feeder · VCB + CT/PT metering", 863, 94, 0, 0, {
    tag: "MRSS-IC1", kind: "substation", voltage: "33 kV", pf: 0.97, runHours: 8611, flowKw: 863,
  }),
  eq("tr_1", "Power Transformer T1", "5 MVA ONAN · 33/6.6 kV · OLTC", 512, 78, 340, 0, {
    tag: "TR-01", kind: "transformer", voltage: "6.6 kV", pf: 0.96, runHours: 8611,
  }),
  eq("mv_board", "6.6 kV MV Switchboard", "12-panel VCB board · HT motors", 505, 81, 680, 0, {
    tag: "MVSB-01", kind: "substation", voltage: "6.6 kV", pf: 0.95,
  }),
  eq("apfc", "APFC Capacitor Bank", "2 × 600 kVAr · 7 % detuned reactors", 4, 64, 0, 260, {
    tag: "APFC-01", kind: "capacitor", voltage: "415 V",
  }),
  eq("tr_2", "Power Transformer T2", "2.5 MVA ONAN · 6.6 kV/433 V", 351, 46, 340, 260, {
    tag: "TR-02", kind: "transformer", voltage: "433 V", pf: 0.94,
  }),
  eq("utility_incomer", "LT PCC-1", "415 V power control centre · 4000 A ACB", 322, 88, 680, 260, {
    tag: "PCC-01", kind: "substation", voltage: "415 V", pf: 0.93, flowKw: 324,
  }),
];

const CRUSHER_CHILDREN: PlantSectionNode[] = [
  eq("hopper_apron", "Apron Feeder", "Dump hopper · 110 kW VFD drive", 9.8, 68, 0, 0, {
    tag: "CR-AF1", kind: "conveyor", voltage: "415 V", pf: 0.9, runHours: 3420,
  }),
  eq("crusher_1", "Impact Crusher", "Single-rotor hammer · 600 t/h", 38.5, 84, 340, 0, {
    tag: "CR-01", kind: "crusher", voltage: "6.6 kV", pf: 0.91, runHours: 3398,
  }),
  eq("belt_bc1", "Overland Belt BC-1", "1,200 mm belt · 640 m run", 7.2, 72, 680, 0, {
    tag: "BC-01", kind: "conveyor", voltage: "415 V", pf: 0.88,
  }),
  eq("dust_crusher", "Crusher Bag Filter", "Pulse-jet · 45,000 m³/h", 2.4, 70, 0, 260, {
    tag: "BF-CR1", kind: "filter", voltage: "415 V", pf: 0.86,
  }),
  eq("reclaimer", "Bridge Reclaimer", "Bucket-wheel · 350 t/h", 3.9, 55, 340, 260, {
    tag: "RC-01", kind: "conveyor", voltage: "415 V", pf: 0.87,
  }),
  eq("stacker", "Chevron Stacker", "Boom stacker · 800 t/h", 4.6, 58, 680, 260, {
    tag: "ST-01", kind: "conveyor", voltage: "415 V", pf: 0.87,
  }),
];

const RAW_CHILDREN: PlantSectionNode[] = [
  eq("raw_mill_a", "Raw Mill A", "Vertical roller mill · 185 t/h", 38, 97, 0, 0, {
    tag: "RM-01", kind: "mill", voltage: "6.6 kV", pf: 0.9, runHours: 6120, flowKw: 40,
  }),
  eq("separator", "Dynamic Separator", "Cage rotor · VFD · 90 µm R", 6.8, 76, 340, 0, {
    tag: "RM-SEP", kind: "fan", voltage: "415 V", pf: 0.89,
  }),
  eq("rm_bagfilter", "Raw Mill Bag House", "Pulse-jet · 3,40,000 m³/h", 12.4, 81, 680, 0, {
    tag: "BF-RM1", kind: "filter", voltage: "415 V", pf: 0.88,
  }),
  eq("rm_fan", "Mill Fan", "ID fan · slip-ring motor · VFD", 31.5, 91, 1020, 0, {
    tag: "RM-FAN", kind: "fan", voltage: "6.6 kV", pf: 0.92,
  }),
  eq("mill_2", "Raw Mill 2", "Ball mill · standby line", 40.2, 72, 0, 260, {
    tag: "RM-02", kind: "mill", voltage: "6.6 kV", pf: 0.88, flowKw: 42,
  }),
  eq("bucket_elev", "Bucket Elevator", "Belt-type · 62 m lift", 5.4, 69, 340, 260, {
    tag: "BE-01", kind: "conveyor", voltage: "415 V", pf: 0.87,
  }),
  eq("cf_silo", "CF Blending Silo", "Controlled-flow · 20,000 t", 8.2, 62, 680, 260, {
    tag: "SL-CF1", kind: "silo", voltage: "415 V", pf: 0.86,
  }),
];

const PYRO_CHILDREN: PlantSectionNode[] = [
  eq("kiln_feed", "Kiln Feed System", "Rotor weigh feeder · airlift", 11.4, 79, 0, 0, {
    tag: "KF-01", kind: "conveyor", voltage: "415 V", pf: 0.88,
  }),
  eq("preheater", "Preheater Fan", "PH ID fan · 5-stage cyclone tower", 74, 96, 340, 0, {
    tag: "KL-PHF", kind: "fan", voltage: "6.6 kV", pf: 0.93, runHours: 7932, flowKw: 76,
  }),
  eq("calciner", "Inline Calciner", "Tertiary air duct · 60 % of fuel", 6.2, 74, 680, 0, {
    tag: "KL-CAL", kind: "tower", voltage: "415 V", pf: 0.87,
  }),
  eq("burner", "Multi-channel Burner", "Coal + pet coke · PA fan", 9.6, 88, 0, 260, {
    tag: "KL-BRN", kind: "fan", voltage: "415 V", pf: 0.89,
  }),
  eq("kiln_1", "Rotary Kiln 1", "Ø4.2 × 62 m · 3,300 tpd clinker", 286, 108, 340, 260, {
    tag: "KL-01", kind: "kiln", voltage: "6.6 kV", pf: 0.89, runHours: 7932, flowKw: 290,
  }),
  eq("cooler", "Grate Cooler", "Reciprocating grate · 8 fans", 52, 82, 680, 260, {
    tag: "CL-01", kind: "cooler", voltage: "6.6 kV", pf: 0.91, flowKw: 52,
  }),
  eq("cooler_esp", "Cooler ESP", "3-field electrostatic precipitator", 9, 77, 1020, 260, {
    tag: "ESP-CL", kind: "filter", voltage: "415 V", pf: 0.84,
  }),
  eq("pan_conveyor", "Deep Pan Conveyor", "Clinker to silo · 180 t/h", 4.4, 66, 340, 520, {
    tag: "PC-01", kind: "conveyor", voltage: "415 V", pf: 0.86,
  }),
  eq("clinker_breaker", "Clinker Crusher", "Hammer breaker · cooler discharge", 7.8, 70, 680, 520, {
    tag: "CL-CR", kind: "crusher", voltage: "415 V", pf: 0.87,
  }),
];

const COAL_CHILDREN: PlantSectionNode[] = [
  eq("coal_vrm", "Coal VRM", "Vertical roller mill · 14 t/h", 22.4, 86, 0, 0, {
    tag: "CM-01", kind: "mill", voltage: "6.6 kV", pf: 0.9,
  }),
  eq("coal_bagfilter", "Coal Bag Filter", "Explosion-vented · CO monitored", 4.1, 71, 340, 0, {
    tag: "BF-CM1", kind: "filter", voltage: "415 V", pf: 0.86,
  }),
  eq("coal_fan", "Coal Mill Fan", "ID fan · VFD", 11.2, 83, 680, 0, {
    tag: "CM-FAN", kind: "fan", voltage: "415 V", pf: 0.9,
  }),
  eq("co2_inert", "CO₂ Inerting", "Auto-dump on CO rise", 0, 0, 0, 260, {
    tag: "CM-CO2", kind: "pump", voltage: "415 V", status: "standby",
  }),
  eq("pf_bin", "Fine Coal Bins", "2 × 60 t · load cells", 1.8, 58, 340, 260, {
    tag: "CM-BIN", kind: "silo", voltage: "415 V", pf: 0.85,
  }),
  eq("coal_dosing", "Rotor Weigh Feeders", "Kiln + calciner firing", 3.2, 74, 680, 260, {
    tag: "CM-DOS", kind: "conveyor", voltage: "415 V", pf: 0.86,
  }),
];

const WHR_CHILDREN: PlantSectionNode[] = [
  eq("ph_boiler", "PH Boiler", "Preheater exhaust · 310 °C in", 3.6, 72, 0, 0, {
    tag: "WHR-PH", kind: "boiler", voltage: "415 V", pf: 0.87,
  }),
  eq("stg", "Steam Turbine Generator", "1.2 MW condensing · 6.6 kV", 186, 62, 340, 0, {
    tag: "WHR-STG", kind: "turbine", voltage: "6.6 kV", pf: 0.9, runHours: 7410,
  }),
  eq("acc", "Air-cooled Condenser", "6-cell ACC · VFD fans", 9.8, 74, 680, 0, {
    tag: "WHR-ACC", kind: "fan", voltage: "415 V", pf: 0.89,
  }),
  eq("aqc_boiler", "AQC Boiler", "Cooler mid-tap · 380 °C in", 2.9, 68, 0, 260, {
    tag: "WHR-AQC", kind: "boiler", voltage: "415 V", pf: 0.87,
  }),
  eq("bfp", "Boiler Feed Pumps", "2W + 1S multistage", 7.4, 81, 340, 260, {
    tag: "WHR-BFP", kind: "pump", voltage: "415 V", pf: 0.88,
  }),
  eq("whr_ct", "Auxiliary Cooling Tower", "Induced draft · 2 cells", 4.2, 63, 680, 260, {
    tag: "WHR-CT", kind: "fan", voltage: "415 V", pf: 0.87,
  }),
];

const GRIND_CHILDREN: PlantSectionNode[] = [
  eq("clinker_silo", "Clinker Silo", "50,000 t RCC · 4 extraction gates", 6.4, 55, 0, 0, {
    tag: "SL-CK1", kind: "silo", voltage: "415 V", pf: 0.86,
  }),
  eq("roller_press", "Roller Press", "Semi-finish · 2 × VFD drives", 22.6, 98, 340, 0, {
    tag: "RP-01", kind: "crusher", voltage: "6.6 kV", pf: 0.9,
  }),
  eq("cm_1", "Cement Mill 1", "Ball mill Ø4.2 × 13 m · PF watch", 58.2, 112, 680, 0, {
    tag: "CM1-01", kind: "mill", voltage: "6.6 kV", pf: 0.86, runHours: 6844, flowKw: 60,
  }),
  eq("cm_bagfilter", "Mill Bag House", "Pulse-jet · 1,80,000 m³/h", 6.9, 79, 1020, 0, {
    tag: "BF-CM1", kind: "filter", voltage: "415 V", pf: 0.87,
  }),
  eq("flyash", "Fly-ash Dosing", "PPC blend · 30 % fly ash", 2.1, 61, 340, 260, {
    tag: "FA-01", kind: "conveyor", voltage: "415 V", pf: 0.85,
  }),
  eq("cm_separator", "High-efficiency Separator", "3rd-gen · 3,400 Blaine", 5.8, 83, 680, 260, {
    tag: "CM-SEP", kind: "fan", voltage: "415 V", pf: 0.88,
  }),
  eq("cement_silos", "Cement Silos", "4 × 8,000 t · OPC / PPC", 3.2, 48, 1020, 260, {
    tag: "SL-CE", kind: "silo", voltage: "415 V", pf: 0.85,
  }),
];

const UTIL_CHILDREN: PlantSectionNode[] = [
  eq("comp_1", "Compressor 1", "Oil-free screw · 7 bar · VSD", 15.8, 76, 0, 0, {
    tag: "AC-01", kind: "compressor", voltage: "415 V", pf: 0.91,
  }),
  eq("air_dryer", "Air Receiver & Dryer", "Heatless desiccant · -40 °C PDP", 1.2, 60, 340, 0, {
    tag: "AD-01", kind: "silo", voltage: "415 V", pf: 0.84,
  }),
  eq("comp_2", "Compressor 2", "Instrument air · 7 bar", 14.67, 54, 680, 0, {
    tag: "AC-02", kind: "compressor", voltage: "415 V", pf: 0.9, flowKw: 15,
  }),
  eq("cooling_tower", "Cooling Tower", "Counter-flow · 2 cells", 7.4, 68, 0, 260, {
    tag: "CT-01", kind: "fan", voltage: "415 V", pf: 0.88,
  }),
  eq("cw_pumps", "CW Pumps", "2W + 1S · 150 m³/h", 9.6, 72, 340, 260, {
    tag: "CWP-01", kind: "pump", voltage: "415 V", pf: 0.89,
  }),
  eq("wtp", "Water Treatment", "RO + softener · 40 m³/h", 3.1, 52, 680, 260, {
    tag: "WTP-01", kind: "pump", voltage: "415 V", pf: 0.87,
  }),
  eq("hvac_admin", "Admin HVAC", "Buildings · VRF", 6.63, 38, 0, 520, {
    tag: "HV-01", kind: "building", voltage: "415 V", pf: 0.92, flowKw: 6.8,
  }),
  eq("colony", "Township Feeder", "Staff colony · street lighting", 12.4, 46, 340, 520, {
    tag: "TWN-01", kind: "building", voltage: "415 V", pf: 0.9,
  }),
];

const DISPATCH_CHILDREN: PlantSectionNode[] = [
  eq("pack_1", "Packing Line 1", "8-spout rotary packer · 120 t/h", 9.1, 41, 0, 0, {
    tag: "PK-01", kind: "packer", voltage: "415 V", pf: 0.88, flowKw: 9.2,
  }),
  eq("truck_loader", "Truck Loaders", "4 × automatic bag loaders", 4.2, 52, 340, 0, {
    tag: "TL-01", kind: "conveyor", voltage: "415 V", pf: 0.86,
  }),
  eq("weighbridge", "Weighbridges", "2 × 100 t · RFID gate", 0.6, 30, 680, 0, {
    tag: "WB-01", kind: "building", voltage: "230 V", pf: 0.95,
  }),
  eq("pack_2", "Packing Line 2", "8-spout rotary packer", 0, 0, 0, 260, {
    tag: "PK-02", kind: "packer", voltage: "415 V", status: "standby",
  }),
  eq("wagon_loader", "Wagon Loading", "Rake siding · 58 BCN wagons", 3.6, 39, 340, 260, {
    tag: "WL-01", kind: "conveyor", voltage: "415 V", pf: 0.86,
  }),
  eq("bulk_loader", "Bulk Loading", "Silo-to-tanker · telescopic spout", 2.8, 44, 680, 260, {
    tag: "BL-01", kind: "conveyor", voltage: "415 V", pf: 0.86,
  }),
];

const SOLAR_CHILDREN: PlantSectionNode[] = [
  eq("solar_array", "Ground-mount PV", "2.4 MWp · single-axis trackers", 196, 40, 0, 0, {
    tag: "PV-GM", kind: "solar", voltage: "1,500 V DC", flowKw: 196,
  }),
  eq("inverters", "String Inverters", "12 × 250 kW · MPPT", 278, 41, 340, 130, {
    tag: "PV-INV", kind: "capacitor", voltage: "800 V AC", pf: 0.99,
  }),
  eq("solar_tr", "Inverter-duty Transformer", "3.15 MVA · 0.8/33 kV", 276, 42, 680, 130, {
    tag: "PV-TR", kind: "transformer", voltage: "33 kV", pf: 0.99,
  }),
  eq("rooftop_pv", "Rooftop PV", "0.9 MWp · packing & stores roofs", 84, 38, 0, 260, {
    tag: "PV-RT", kind: "solar", voltage: "1,100 V DC", flowKw: 84,
  }),
];

const DG_CHILDREN: PlantSectionNode[] = [
  eq("dg_1", "DG Set 1", "1,010 kVA · 415 V · AMF", 0, 0, 0, 0, {
    tag: "DG-01", kind: "genset", voltage: "415 V", status: "standby", runHours: 412,
  }),
  eq("amf_panel", "AMF & Sync Panel", "Auto mains failure · 2-DG sync", 0.4, 10, 340, 130, {
    tag: "DG-AMF", kind: "substation", voltage: "415 V",
  }),
  eq("diesel_tank", "Diesel Day Tank", "990 L day tank · 18 kL bulk", 0, 0, 680, 130, {
    tag: "DG-TK", kind: "silo", status: "standby",
  }),
  eq("dg_2", "DG Set 2", "1,010 kVA · 415 V · AMF", 0, 0, 0, 260, {
    tag: "DG-02", kind: "genset", voltage: "415 V", status: "standby", runHours: 388,
  }),
];

function section(
  id: string,
  name: string,
  area: string,
  kw: number,
  loadPct: number,
  x: number,
  y: number,
  accent: string,
  surface: string,
  children: PlantSectionNode[],
  extra: Partial<PlantSectionNode> = {},
): PlantSectionNode {
  return { ...eq(id, name, area, kw, loadPct, x, y, extra), accent, surface, children };
}

/** Top-level plant layout - click any section to drill in. */
export const PLANT_ROOT_LEVEL: PlantSectionLevel = {
  id: "root",
  title: "Jaipur Works",
  subtitle: "Integrated cement plant · 3,300 tpd clinker · 11 sections",
  nodes: [
    section("section_crusher", "Limestone Crusher", "Impact crusher · stockpile", 66.4, 71, 0, 0,
      "#8a6d3b", "#f8f3ea", CRUSHER_CHILDREN, { tag: "SEC-CR", kind: "crusher", voltage: "6.6 kV", pf: 0.9 }),
    section("section_raw", "Raw Mill", "VRM · CF blending silo", 142.5, 97, 340, 0,
      "#c98a0b", "#fff8e9", RAW_CHILDREN, { tag: "SEC-RM", kind: "mill", voltage: "6.6 kV", pf: 0.9 }),
    section("section_pyro", "Kiln Line", "Preheater · kiln · cooler", 460.4, 108, 680, 0,
      "#d6453a", "#fff1ee", PYRO_CHILDREN, { tag: "SEC-KL", kind: "kiln", voltage: "6.6 kV", pf: 0.9 }),
    section("section_grind", "Cement Grinding", "Roller press · ball mill", 105.2, 112, 1020, 0,
      "#c2410c", "#fff4ec", GRIND_CHILDREN, { tag: "SEC-CM", kind: "mill", voltage: "6.6 kV", pf: 0.87 }),
    section("section_dispatch", "Packing & Dispatch", "Rotary packers · rail siding", 20.3, 41, 1360, 0,
      "#5b7fa3", "#eef4f9", DISPATCH_CHILDREN, { tag: "SEC-PK", kind: "packer", voltage: "415 V", pf: 0.87 }),
    section("section_coal", "Coal Mill", "Coal VRM · fine coal bins", 42.7, 83, 340, 320,
      "#4b5563", "#f2f3f5", COAL_CHILDREN, { tag: "SEC-CO", kind: "mill", voltage: "6.6 kV", pf: 0.89 }),
    section("section_whr", "WHR Power Plant", "PH + AQC boilers · 1.2 MW STG", 186, 62, 680, 320,
      "#b45309", "#fff6e8", WHR_CHILDREN, { tag: "SEC-WHR", kind: "turbine", voltage: "6.6 kV", pf: 0.9 }),
    section("section_util", "Utilities", "Compressed air · water · township", 70.8, 61, 1020, 320,
      "#2f8f7f", "#edf8f5", UTIL_CHILDREN, { tag: "SEC-UT", kind: "compressor", voltage: "415 V", pf: 0.9 }),
    section("section_dg", "DG House", "2 × 1,010 kVA standby", 0, 0, 340, 640,
      "#7c8591", "#f3f4f6", DG_CHILDREN, { tag: "SEC-DG", kind: "genset", voltage: "415 V", status: "standby" }),
    section("section_power", "Main Substation", "33 kV grid · 33/6.6 kV transformers", 863, 94, 680, 640,
      "#e0533f", "#fff3f0", POWER_CHILDREN, { tag: "SEC-MRSS", kind: "substation", voltage: "33 kV", pf: 0.97 }),
    section("section_solar", "Solar Park", "Ground-mount + rooftop PV", 280, 40, 1020, 640,
      "#0e8fa3", "#e8f7f9", SOLAR_CHILDREN, { tag: "SEC-PV", kind: "solar", voltage: "33 kV", pf: 0.99 }),
  ],
  edges: [
    { from: "section_crusher", to: "section_raw", kw: 210, kind: "process", unit: "t/h" },
    { from: "section_raw", to: "section_pyro", kw: 165, kind: "process", unit: "t/h" },
    { from: "section_pyro", to: "section_grind", kw: 98, kind: "process", unit: "t/h" },
    { from: "section_grind", to: "section_dispatch", kw: 124, kind: "process", unit: "t/h" },
    {
      from: "section_coal", to: "section_pyro", kw: 9.5, kind: "process", unit: "t/h",
      via: [{ x: 634, y: 396 }, { x: 634, y: 236 }, { x: 760, y: 236 }],
    },
    { from: "section_pyro", to: "section_whr", kw: 310, kind: "heat", unit: "°C" },
    { from: "section_whr", to: "section_power", kw: 186, kind: "power" },
    { from: "section_solar", to: "section_power", kw: 280, kind: "power" },
    { from: "section_dg", to: "section_power", kw: 0, kind: "power" },
    {
      from: "section_power", to: "section_pyro", kw: 466, kind: "power",
      via: [{ x: 860, y: 530 }, { x: 950, y: 530 }, { x: 950, y: 236 }, { x: 870, y: 236 }],
    },
    {
      from: "section_power", to: "section_raw", kw: 146, kind: "power",
      via: [{ x: 720, y: 556 }, { x: 294, y: 556 }, { x: 294, y: 236 }, { x: 420, y: 236 }],
    },
    {
      from: "section_power", to: "section_util", kw: 72, kind: "power",
      via: [{ x: 900, y: 590 }, { x: 996, y: 590 }, { x: 996, y: 396 }],
    },
    {
      from: "section_power", to: "section_grind", kw: 108, kind: "power",
      via: [{ x: 760, y: 850 }, { x: 1314, y: 850 }, { x: 1314, y: 236 }, { x: 1200, y: 236 }],
    },
  ],
  zones: [
    { x: -30, y: -52, w: 1668, h: 232, label: "Process line · limestone to bagged cement" },
    { x: 310, y: 276, w: 648, h: 224, label: "Fuel & heat recovery" },
    { x: 990, y: 276, w: 308, h: 224, label: "Utilities block" },
    { x: 310, y: 604, w: 988, h: 216, label: "Power island" },
  ],
  features: [
    { kind: "fence", x: -190, y: -110, w: 1900, h: 1040, label: "Plant boundary · 212 acres" },
    { kind: "road", x: -150, y: -80, w: 56, h: 980, label: "Mines haul road · 4.2 km" },
    { kind: "rail", x: -60, y: 890, w: 1740, h: 24, label: "NWR railway siding" },
    { kind: "road", x: 1650, y: -80, w: 44, h: 940, label: "Exit to NH-48" },
    { kind: "stack", x: 1560, y: 350, h: 120, label: "92 m stack" },
    { kind: "cooling_tower", x: 1400, y: 380, w: 90, h: 90, label: "Cooling tower" },
    { kind: "silo", x: 1400, y: 620, w: 70, h: 120, label: "Cement silos" },
    { kind: "silo", x: 1500, y: 620, w: 70, h: 120 },
    { kind: "stockpile", x: -60, y: 320, w: 300, h: 110, label: "Limestone stockpile · 12,000 t" },
    { kind: "stockpile", x: -60, y: 620, w: 300, h: 100, label: "Coal & pet coke yard" },
  ],
};

export const PLANT_LEVELS: Record<string, PlantSectionLevel> = {
  root: PLANT_ROOT_LEVEL,
  section_power: {
    id: "section_power",
    title: "Main Receiving Substation",
    subtitle: "33 kV JVVNL incomer · 33/6.6 kV transformers · MV board · APFC",
    nodes: POWER_CHILDREN,
    edges: [
      { from: "eb_incomer", to: "tr_1", kw: 512, kind: "power" },
      { from: "eb_incomer", to: "tr_2", kw: 351, kind: "power" },
      { from: "tr_1", to: "mv_board", kw: 505, kind: "power" },
      { from: "tr_2", to: "utility_incomer", kw: 324, kind: "power" },
      { from: "apfc", to: "eb_incomer", kw: 780, kind: "power", unit: "kVAr" },
    ],
    zones: [
      { x: -30, y: -52, w: 648, h: 494, label: "33 kV outdoor switchyard" },
      { x: 650, y: -52, w: 308, h: 494, label: "MV / LT switchgear room" },
    ],
    features: [{ kind: "fence", x: -70, y: -100, w: 1070, h: 590, label: "Earthing grid · 0.8 Ω" }],
  },
  section_crusher: {
    id: "section_crusher",
    title: "Limestone Crusher",
    subtitle: "Mines haul road · impact crusher · 12,000 t chevron stockpile",
    nodes: CRUSHER_CHILDREN,
    edges: [
      { from: "hopper_apron", to: "crusher_1", kw: 540, kind: "process", unit: "t/h" },
      { from: "crusher_1", to: "belt_bc1", kw: 540, kind: "process", unit: "t/h" },
      { from: "belt_bc1", to: "stacker", kw: 540, kind: "process", unit: "t/h" },
      { from: "stacker", to: "reclaimer", kw: 210, kind: "process", unit: "t/h" },
      { from: "crusher_1", to: "dust_crusher", kw: 45000, kind: "heat", unit: "m³/h" },
    ],
    zones: [{ x: -30, y: -52, w: 648, h: 232, label: "Crusher house" }],
    features: [
      { kind: "road", x: -170, y: -80, w: 56, h: 660, label: "Mines haul road" },
      { kind: "stockpile", x: 330, y: 450, w: 610, h: 100, label: "Limestone stockpile · 12,000 t" },
    ],
  },
  section_raw: {
    id: "section_raw",
    title: "Raw Mill",
    subtitle: "Vertical roller mill · dynamic separator · CF blending silo",
    nodes: RAW_CHILDREN,
    edges: [
      { from: "raw_mill_a", to: "separator", kw: 185, kind: "process", unit: "t/h" },
      { from: "separator", to: "rm_bagfilter", kw: 182, kind: "process", unit: "t/h" },
      { from: "rm_bagfilter", to: "rm_fan", kw: 92, kind: "heat", unit: "°C" },
      { from: "rm_bagfilter", to: "bucket_elev", kw: 182, kind: "process", unit: "t/h" },
      { from: "mill_2", to: "bucket_elev", kw: 40, kind: "process", unit: "t/h" },
      { from: "bucket_elev", to: "cf_silo", kw: 210, kind: "process", unit: "t/h" },
    ],
    zones: [
      { x: -30, y: -52, w: 1328, h: 232, label: "VRM building" },
      { x: 650, y: 228, w: 308, h: 214, label: "Blending & kiln feed" },
    ],
    features: [{ kind: "stack", x: 1150, y: 230, h: 150, label: "Raw mill stack" }],
  },
  section_pyro: {
    id: "section_pyro",
    title: "Kiln Line",
    subtitle: "5-stage preheater · inline calciner · Ø4.2 × 62 m rotary kiln · grate cooler",
    nodes: PYRO_CHILDREN,
    edges: [
      { from: "kiln_feed", to: "preheater", kw: 165, kind: "process", unit: "t/h" },
      { from: "preheater", to: "calciner", kw: 880, kind: "heat", unit: "°C" },
      { from: "calciner", to: "kiln_1", kw: 158, kind: "process", unit: "t/h" },
      { from: "burner", to: "kiln_1", kw: 9.5, kind: "process", unit: "t/h" },
      { from: "kiln_1", to: "cooler", kw: 98, kind: "process", unit: "t/h" },
      { from: "cooler", to: "calciner", kw: 910, kind: "heat", unit: "°C" },
      { from: "cooler", to: "cooler_esp", kw: 240, kind: "heat", unit: "°C" },
      { from: "cooler", to: "clinker_breaker", kw: 98, kind: "process", unit: "t/h" },
      { from: "clinker_breaker", to: "pan_conveyor", kw: 98, kind: "process", unit: "t/h" },
    ],
    zones: [
      { x: 310, y: -52, w: 648, h: 232, label: "Preheater tower · 5 stages" },
      { x: -30, y: 216, w: 1328, h: 226, label: "Kiln & cooler" },
    ],
    features: [{ kind: "stack", x: 1150, y: -60, h: 190, label: "Main stack · 92 m" }],
  },
  section_coal: {
    id: "section_coal",
    title: "Coal Mill",
    subtitle: "Coal VRM · explosion-vented bag filter · fine coal dosing",
    nodes: COAL_CHILDREN,
    edges: [
      { from: "coal_vrm", to: "coal_bagfilter", kw: 12, kind: "process", unit: "t/h" },
      { from: "coal_bagfilter", to: "coal_fan", kw: 78, kind: "heat", unit: "°C" },
      { from: "coal_bagfilter", to: "pf_bin", kw: 11.6, kind: "process", unit: "t/h" },
      { from: "pf_bin", to: "coal_dosing", kw: 9.5, kind: "process", unit: "t/h" },
    ],
    zones: [{ x: -30, y: -52, w: 988, h: 494, label: "Coal mill building · Ex zone 22" }],
    features: [{ kind: "stockpile", x: -30, y: 470, w: 640, h: 90, label: "Coal & pet coke yard" }],
  },
  section_whr: {
    id: "section_whr",
    title: "WHR Power Plant",
    subtitle: "PH + AQC boilers · 1.2 MW condensing turbine · air-cooled condenser",
    nodes: WHR_CHILDREN,
    edges: [
      { from: "ph_boiler", to: "stg", kw: 5.8, kind: "heat", unit: "t/h steam" },
      { from: "aqc_boiler", to: "stg", kw: 3.1, kind: "heat", unit: "t/h steam" },
      { from: "stg", to: "acc", kw: 8.9, kind: "heat", unit: "t/h" },
      { from: "acc", to: "bfp", kw: 8.9, kind: "process", unit: "t/h" },
      { from: "bfp", to: "aqc_boiler", kw: 3.2, kind: "process", unit: "t/h" },
    ],
    zones: [{ x: 310, y: -52, w: 648, h: 232, label: "Turbine hall" }],
    features: [{ kind: "cooling_tower", x: 1010, y: 280, w: 110, h: 110, label: "Aux CT" }],
  },
  section_grind: {
    id: "section_grind",
    title: "Cement Grinding",
    subtitle: "Roller press + ball mill (semi-finish) · PPC fly-ash dosing · PF watch on CM1",
    nodes: GRIND_CHILDREN,
    edges: [
      { from: "clinker_silo", to: "roller_press", kw: 96, kind: "process", unit: "t/h" },
      { from: "roller_press", to: "cm_1", kw: 96, kind: "process", unit: "t/h" },
      { from: "flyash", to: "cm_1", kw: 36, kind: "process", unit: "t/h" },
      { from: "cm_1", to: "cm_separator", kw: 128, kind: "process", unit: "t/h" },
      { from: "cm_separator", to: "cement_silos", kw: 124, kind: "process", unit: "t/h" },
      { from: "cm_1", to: "cm_bagfilter", kw: 105, kind: "heat", unit: "°C" },
    ],
    zones: [
      { x: 310, y: -52, w: 648, h: 232, label: "Mill house" },
      { x: 990, y: 216, w: 308, h: 226, label: "Silo park" },
    ],
    features: [{ kind: "silo", x: 40, y: 250, w: 80, h: 150, label: "Clinker silo" }],
  },
  section_util: {
    id: "section_util",
    title: "Utilities",
    subtitle: "Compressed air · cooling water · water treatment · township",
    nodes: UTIL_CHILDREN,
    edges: [
      { from: "comp_1", to: "air_dryer", kw: 38, kind: "process", unit: "Nm³/min" },
      { from: "comp_2", to: "air_dryer", kw: 22, kind: "process", unit: "Nm³/min" },
      { from: "wtp", to: "cw_pumps", kw: 40, kind: "process", unit: "m³/h" },
      { from: "cw_pumps", to: "cooling_tower", kw: 150, kind: "process", unit: "m³/h" },
    ],
    zones: [
      { x: -30, y: -52, w: 988, h: 232, label: "Compressor house" },
      { x: -30, y: 216, w: 988, h: 226, label: "Water systems" },
    ],
    features: [{ kind: "cooling_tower", x: 700, y: 540, w: 110, h: 110, label: "CT-01" }],
  },
  section_dispatch: {
    id: "section_dispatch",
    title: "Packing & Dispatch",
    subtitle: "8-spout rotary packers · truck & wagon loading · weighbridges",
    nodes: DISPATCH_CHILDREN,
    edges: [
      { from: "pack_1", to: "truck_loader", kw: 118, kind: "process", unit: "t/h" },
      { from: "truck_loader", to: "weighbridge", kw: 14, kind: "process", unit: "trucks/h" },
      { from: "pack_2", to: "wagon_loader", kw: 0, kind: "process", unit: "t/h" },
      { from: "bulk_loader", to: "weighbridge", kw: 6, kind: "process", unit: "tankers/h" },
    ],
    zones: [{ x: -30, y: -52, w: 648, h: 494, label: "Packing plant" }],
    features: [
      { kind: "rail", x: -60, y: 480, w: 1060, h: 24, label: "Railway siding · 58-wagon rake" },
      { kind: "road", x: 990, y: -80, w: 44, h: 540, label: "Exit to NH-48" },
    ],
  },
  section_solar: {
    id: "section_solar",
    title: "Solar Park",
    subtitle: "Ground-mount trackers + rooftop PV · string inverters · 33 kV evacuation",
    nodes: SOLAR_CHILDREN,
    edges: [
      { from: "solar_array", to: "inverters", kw: 196, kind: "power" },
      { from: "rooftop_pv", to: "inverters", kw: 84, kind: "power" },
      { from: "inverters", to: "solar_tr", kw: 278, kind: "power" },
    ],
    features: [
      { kind: "pv", x: -20, y: 450, w: 960, h: 100, label: "PV blocks A–D · 4,480 modules" },
    ],
  },
  section_dg: {
    id: "section_dg",
    title: "DG House",
    subtitle: "2 × 1,010 kVA standby gensets · auto mains failure · last run test Sat 06:00",
    nodes: DG_CHILDREN,
    edges: [
      { from: "dg_1", to: "amf_panel", kw: 0, kind: "power" },
      { from: "dg_2", to: "amf_panel", kw: 0, kind: "power" },
    ],
    zones: [{ x: -30, y: -52, w: 648, h: 494, label: "Acoustic DG enclosure" }],
  },
};

export function levelForNode(nodeId: string): PlantSectionLevel | undefined {
  return PLANT_LEVELS[nodeId];
}

export function findSectionNode(nodeId: string): PlantSectionNode | undefined {
  function walk(nodes: PlantSectionNode[]): PlantSectionNode | undefined {
    for (const n of nodes) {
      if (n.id === nodeId) return n;
      if (n.children) {
        const hit = walk(n.children);
        if (hit) return hit;
      }
    }
    return undefined;
  }
  return walk(PLANT_ROOT_LEVEL.nodes);
}

export function viewBoxForLevel(level: PlantSectionLevel, pad = 52): string {
  return viewBoxMetrics(level, pad).viewBox;
}
