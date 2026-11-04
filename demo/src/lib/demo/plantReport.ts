/** Demonstration process reports (PlantCraft reportModel layout, Apache-2.0). */

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

export type DemoReportFormat = "PDF" | "Excel" | "CSV" | "Word";

export interface DemoReport {
  id: string;
  kind: string;
  name: string;
  periodLabel: string;
  covers: string;
  lineLabel: string;
  industry: string;
  status: "ready" | "draft";
  formats: DemoReportFormat[];
  updatedLabel: string;
  summary: string;
  sections: ReportSection[];
}

export const REPORT_EXPORT_FORMATS: DemoReportFormat[] = ["PDF", "Excel", "CSV", "Word"];

export const FORGING_SHIFT_REPORT: DemoReport = {
  id: "rep-forge-week",
  kind: "Weekly ops note",
  name: "Forging and HT · weekly operations note",
  periodLabel: "Last 7 days",
  covers: "Press lines B and shared HT furnace",
  lineLabel: "Press B · HT",
  industry: "Forging and heat treatment",
  status: "ready",
  formats: ["PDF", "Excel", "CSV", "Word"],
  updatedLabel: "Today 09:40",
  summary: "Hold-pressure watch on Press P3, soak short on furnace zone 2, and scrap from overheating for the week.",
  sections: [
    {
      id: "intro",
      kind: "text",
      title: "Summary",
      body:
        "Press line B ran with one hold-pressure watch and a cavity weight alarm on Press P3. Heat treatment stayed inside signed bands except zone 2 soak, where the agent opened a simulation campaign.",
    },
    {
      id: "scrap",
      kind: "stats",
      title: "Scrap from overheating",
      stats: [
        { label: "Today", value: "2.8%", note: "From plant logs", accent: false },
        { label: "On the model", value: "1.3%", note: "With bounded changes accepted on line", accent: true },
      ],
    },
    {
      id: "hold",
      kind: "trend",
      title: "Hold pressure against setpoint",
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
          summary: "Hold loop on watch",
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

export const FORGE_SHIFT_REPORT: DemoReport = {
  id: "rep-forge-shift",
  kind: "Shift handover",
  name: "Forge line · shift handover note",
  periodLabel: "Shift ending 14:00",
  covers: "Forging · Axle shaft 4140",
  lineLabel: "Forge line",
  industry: "Forging and heat treatment",
  status: "ready",
  formats: ["PDF", "Word", "CSV"],
  updatedLabel: "Today 14:05",
  summary: "Billet exit temperature held inside the signed band. One coil power proposal accepted; no stops.",
  sections: [
    {
      id: "intro",
      kind: "text",
      title: "Handover summary",
      body:
        "The forge line ran 552 axle shafts this shift. Billet exit temperature stayed inside the signed window. Coil power on heater H1 was nudged once under standing approval. No Stop events.",
    },
    {
      id: "outcome",
      kind: "stats",
      title: "Billet exit temperature this shift",
      stats: [
        { label: "Median", value: "1212", note: "°C · measured at heater exit", accent: false },
        { label: "Inside band", value: "6 of 6", note: "Signed window 1170 to 1250 °C", accent: true },
      ],
    },
    {
      id: "trend",
      kind: "trend",
      title: "Billet exit temperature by hour",
      trend: {
        title: "Heats stayed near the middle of the band",
        values: [1208, 1212, 1215, 1211, 1209, 1213],
        unit: "°C",
      },
    },
    {
      id: "events",
      kind: "events",
      title: "Decisions and watches",
      events: [
        {
          at: "10:18",
          title: "Coil power -8 kW",
          about: "Heater H1",
          summary: "Accepted under standing approval",
          severity: "info",
        },
        {
          at: "12:40",
          title: "Die temperature watch",
          about: "Screw press P1",
          summary: "Cleared after die spray trim",
          severity: "warning",
        },
      ],
    },
    {
      id: "close",
      kind: "text",
      title: "For the next shift",
      body: "Keep the same axle shaft 4140 pack. Confirm die spray trim held after the first hour. No open trials on the forge line.",
    },
  ],
};

export const MOULDING_SCRAP_REPORT: DemoReport = {
  id: "rep-mould-scrap",
  kind: "Weekly scrap note",
  name: "Line B · scrap and cavity weight",
  periodLabel: "Last 7 days",
  covers: "Discrete moulding · Housing B-40",
  lineLabel: "Line B",
  industry: "Discrete moulding",
  status: "ready",
  formats: ["PDF", "Excel", "CSV"],
  updatedLabel: "Yesterday 18:20",
  summary: "Scrap rate eased after the hold-pressure proposal. Cavity weight still watched on Press P3.",
  sections: [
    {
      id: "intro",
      kind: "text",
      title: "Week at a glance",
      body:
        "Line B Housing B-40 scrap sat above the plant target early in the week, then eased after a bounded hold-pressure change. Cavity weight on Press P3 remains on watch.",
    },
    {
      id: "scrap",
      kind: "stats",
      title: "Scrap rate",
      stats: [
        { label: "This week", value: "3.1%", note: "Plant target 2.5%", accent: false },
        { label: "After change", value: "2.4%", note: "Last three shifts", accent: true },
      ],
    },
    {
      id: "weight",
      kind: "trend",
      title: "Cavity weight drift",
      trend: {
        title: "Press P3 cavity weight before and after the watch",
        values: [412, 414, 418, 421, 419, 417, 415, 414, 413, 412, 411, 412],
        unit: "g",
      },
    },
    {
      id: "events",
      kind: "events",
      title: "Notable events",
      events: [
        {
          at: "Mon 11:05",
          title: "Scrap above target",
          about: "Line B",
          summary: "Opened the hold-pressure proposal",
          severity: "warning",
        },
        {
          at: "Wed 15:30",
          title: "Hold pressure accepted",
          about: "Press P3",
          summary: "Bounded change",
          severity: "info",
        },
      ],
    },
    {
      id: "close",
      kind: "text",
      title: "Next checks",
      body: "Keep cavity weight on the Actions queue until three clear shifts. Compare scrap to the model prediction on Analytics.",
    },
  ],
};

export const TRIAL_VERDICT_REPORT: DemoReport = {
  id: "rep-trial-verdict",
  kind: "Trial verdict",
  name: "Trial TR-104 · soak band verdict",
  periodLabel: "Trial window 12 to 18 Oct",
  covers: "Furnace zone 2 soak · signed trial",
  lineLabel: "HT furnace",
  industry: "Forging and heat treatment",
  status: "ready",
  formats: ["PDF", "Word", "Excel"],
  updatedLabel: "18 Oct 16:10",
  summary: "Verified improvement on soak short alarms. Effect stays inside the signed band.",
  sections: [
    {
      id: "intro",
      kind: "text",
      title: "Verdict",
      body:
        "Trial TR-104 tested a narrower soak band on furnace zone 2. The verdict is Improved at rung R3 (Verified). Effect and interval stay on the proof record.",
    },
    {
      id: "effect",
      kind: "stats",
      title: "Effect on soak short alarms",
      stats: [
        { label: "Effect", value: "−38%", note: "Alarm rate vs control arm", accent: true },
        { label: "Interval", value: "−52 to −18%", note: "95% band", accent: false },
      ],
    },
    {
      id: "trend",
      kind: "trend",
      title: "Alarms per charge",
      trend: {
        title: "Control arm then trial arm",
        values: [4, 5, 4, 6, 5, 3, 2, 2, 1, 2, 1, 1],
        unit: "alarms",
      },
    },
    {
      id: "events",
      kind: "events",
      title: "Trial log",
      events: [
        {
          at: "12 Oct",
          title: "Trial signed",
          about: "Plant head",
          summary: "Order signed",
          severity: "info",
        },
        {
          at: "15 Oct",
          title: "Switch to trial arm",
          about: "Zone 2",
          summary: "Schedule followed · no restore needed",
          severity: "info",
        },
        {
          at: "18 Oct",
          title: "Verdict written",
          about: "Proof record",
          summary: "Improved · R3 Verified",
          severity: "info",
        },
      ],
    },
    {
      id: "close",
      kind: "text",
      title: "Follow-up",
      body: "Promote the soak band into the signed window when the process engineer is ready. Keep the proof record linked on the trial page.",
    },
  ],
};

export const OEE_WEEK_REPORT: DemoReport = {
  id: "rep-oee-week",
  kind: "MIS summary",
  name: "Plant · OEE and downtime week",
  periodLabel: "Last 7 days",
  covers: "Forge line, Line B, shared utilities",
  lineLabel: "Plant",
  industry: "Plant MIS",
  status: "ready",
  formats: ["PDF", "Excel", "CSV"],
  updatedLabel: "Today 08:00",
  summary: "Availability held. Performance dip on Line B Tuesday. No quality loss attributed to Stamped changes.",
  sections: [
    {
      id: "intro",
      kind: "text",
      title: "Week summary",
      body:
        "Plant OEE for the week sat near plan. Availability was steady. Performance dipped on Line B Tuesday during a cavity-weight watch. Quality stayed inside grade.",
    },
    {
      id: "oee",
      kind: "stats",
      title: "OEE components",
      stats: [
        { label: "Availability", value: "91%", note: "Planned production time", accent: false },
        { label: "Performance", value: "87%", note: "Dip on Line B Tue", accent: false },
        { label: "Quality", value: "96%", note: "First-pass", accent: true },
      ],
    },
    {
      id: "trend",
      kind: "trend",
      title: "Daily OEE",
      trend: {
        title: "Plant OEE across the week",
        values: [78, 80, 74, 79, 81, 80, 82],
        unit: "%",
      },
    },
    {
      id: "events",
      kind: "events",
      title: "Downtime themes",
      events: [
        {
          at: "Tue",
          title: "Cavity weight watch",
          about: "Line B",
          summary: "Performance loss · not a hard stop",
          severity: "warning",
        },
        {
          at: "Thu",
          title: "Utility header flush",
          about: "Cooling water",
          summary: "Short planned loss",
          severity: "info",
        },
      ],
    },
    {
      id: "close",
      kind: "text",
      title: "For the MIS pack",
      body: "Export PDF for the plant head pack and Excel for the weekly MIS sheet. Evidence labels stay on every figure in the export.",
    },
  ],
};

export const HOLDING_CHECK_REPORT: DemoReport = {
  id: "rep-holding",
  kind: "Holding check",
  name: "Measurement · holding checks week",
  periodLabel: "Last 7 days",
  covers: "Forge billet temperature · Line B cavity weight",
  lineLabel: "Measurement",
  industry: "Process measurement",
  status: "draft",
  formats: ["PDF", "CSV", "Word"],
  updatedLabel: "Today 11:15",
  summary: "Billet temperature holding. Cavity weight faded once then recovered. Draft until the process engineer signs.",
  sections: [
    {
      id: "intro",
      kind: "text",
      title: "Holding status",
      body:
        "Weekly holding checks for the two live measurement plans. Forge billet temperature is holding. Line B cavity weight faded mid-week and recovered after the watch. This draft is not ready to export until signed.",
    },
    {
      id: "checks",
      kind: "stats",
      title: "Checks this week",
      stats: [
        { label: "Holding", value: "5", note: "Billet temperature and recovered weight", accent: true },
        { label: "Faded", value: "1", note: "Cavity weight Wed", accent: false },
        { label: "Inconclusive", value: "0", note: "No sparse windows", accent: false },
      ],
    },
    {
      id: "trend",
      kind: "trend",
      title: "Holding score trend",
      trend: {
        title: "Composite holding across plans",
        values: [0.92, 0.91, 0.88, 0.84, 0.86, 0.9, 0.91],
        unit: "score",
      },
    },
    {
      id: "events",
      kind: "events",
      title: "Exceptions",
      events: [
        {
          at: "Wed 16:00",
          title: "Holding faded",
          about: "Cavity weight",
          summary: "Recovered after hold-pressure watch",
          severity: "warning",
        },
      ],
    },
    {
      id: "close",
      kind: "text",
      title: "Before export",
      body: "Process engineer signs the draft, then plant head can export. Keep faded windows linked to the Actions queue.",
    },
  ],
};

export const PLANT_REPORTS: DemoReport[] = [
  FORGING_SHIFT_REPORT,
  FORGE_SHIFT_REPORT,
  MOULDING_SCRAP_REPORT,
  TRIAL_VERDICT_REPORT,
  OEE_WEEK_REPORT,
  HOLDING_CHECK_REPORT,
];

export function reportById(id: string): DemoReport | undefined {
  return PLANT_REPORTS.find((r) => r.id === id);
}

export function reportOutline(sections: ReportSection[]) {
  return sections.map((s) => ({ id: s.id, label: s.title }));
}
