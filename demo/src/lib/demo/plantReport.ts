/** Demonstration shift report (PlantCraft reportModel layout, Apache-2.0). */

export type ReportSectionKind = "text" | "stats" | "trend" | "events";

export interface ReportSection {
  id: string;
  kind: ReportSectionKind;
  title: string;
  body?: string;
  stats?: { label: string; value: string; note: string; accent?: boolean }[];
  trend?: { title: string; values: number[]; unit: string };
  events?: { at: string; title: string; about: string; summary: string; severity: "critical" | "warning" | "info" }[];
}

export interface DemoReport {
  id: string;
  name: string;
  periodLabel: string;
  covers: string;
  sections: ReportSection[];
}

export const FORGING_SHIFT_REPORT: DemoReport = {
  id: "rep-forge-week",
  name: "Forging and HT · weekly operations note",
  periodLabel: "Last 7 days",
  covers: "Demonstration data · Press lines B and shared HT furnace",
  sections: [
    {
      id: "intro",
      kind: "text",
      title: "Summary",
      body:
        "Press line B ran with one hold-pressure watch and a cavity weight alarm on Press P3. Heat treatment stayed inside signed bands except zone 2 soak, where the agent opened a simulation campaign. Everything below is demonstration data.",
    },
    {
      id: "scrap",
      kind: "stats",
      title: "Overheating scrap (demonstration)",
      stats: [
        { label: "Today", value: "2.8%", note: "From plant logs", accent: false },
        { label: "On the model", value: "1.3%", note: "With bounded changes accepted on line", accent: true },
      ],
    },
    {
      id: "hold",
      kind: "trend",
      title: "Hold pressure vs setpoint",
      trend: {
        title: "Hold pressure wandered before the bounded proposal",
        values: [598, 602, 605, 608, 612, 610, 608, 605, 602, 600, 598, 596, 598, 602, 605, 608, 610, 612, 611, 609],
        unit: "bar",
      },
    },
    {
      id: "events",
      kind: "events",
      title: "Notable events",
      events: [
        {
          at: "Tue 14:22",
          title: "Cavity weight high",
          about: "Press P3",
          summary: "Hold loop on watch · demonstration alarm",
          severity: "critical",
        },
        {
          at: "Wed 09:05",
          title: "Soak short",
          about: "Furnace zone 2",
          summary: "Simulation campaign opened · no write-back",
          severity: "warning",
        },
        {
          at: "Thu 18:40",
          title: "Cooling water ΔT",
          about: "Utility header",
          summary: "Watch cleared after header flush",
          severity: "info",
        },
      ],
    },
    {
      id: "close",
      kind: "text",
      title: "Next checks",
      body: "Review the hold-pressure proposal on the Actions queue before the next HT charge. Compare simulation run 2 on zone 2 soak when the shift lead is available.",
    },
  ],
};

export function reportOutline(sections: ReportSection[]) {
  return sections.map((s) => ({ id: s.id, label: s.title }));
}
