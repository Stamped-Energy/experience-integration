import type { AnalystMessage } from "@/lib/analyst-context";

export type AnalystChatSession = {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  messages: AnalystMessage[];
};

export const analystChatHistoryFixture: AnalystChatSession[] = [
  {
    id: "chat_1",
    title: "Kiln 1 MD coincidence",
    preview: "Kiln at 108% load - stagger co-start recommended",
    updatedAt: "2026-07-21T09:50:00+05:30",
    messages: [
      {
        id: "chat_1_u0",
        role: "user",
        content: "Why is Kiln 1 critical for MD right now?",
      },
      {
        id: "chat_1_a0",
        role: "assistant",
        content:
          "**Kiln 1 is critical** - load at **108%** while Raw Mill 2 co-starts into the **10–11 TOD peak**.\n\nRolling MD is **4,680 kVA** with only **6.4%** headroom to CMD 5,000 kVA.\n\n**Recommended:** Stagger Mill 2 start by 10 min - **₹84,000/mo** addressable at 86% confidence.",
        citations: [
          { id: "c1", title: "Kiln 1 alarm · MD coincidence risk", path: "H" },
          { id: "c2", title: "MD window · Jul 21", snippet: "920 kVA peak 07:06–07:10", path: "W" },
          { id: "c3", title: "Stagger co-start prescription", snippet: "Mill 2 start delay", path: "H" },
        ],
      },
    ],
  },
  {
    id: "chat_2",
    title: "Open alarms summary",
    preview: "5 open - 2 critical, 2 warning",
    updatedAt: "2026-07-21T10:12:00+05:30",
    messages: [
      {
        id: "chat_2_u0",
        role: "user",
        content: "Summarize open critical and warning alarms for this plant.",
      },
      {
        id: "chat_2_a0",
        role: "assistant",
        content:
          "**Jaipur Works - 5 open alarms** (2 critical, 2 warning, 1 info).\n\n• **Kiln 1** (critical) - Load 108%, MD coincidence\n• **Main incomer** (critical) - Rolling MD 4,680 kVA\n• **Cement Mill 1** (warning) - PF 0.84 drifting\n• **Raw Mill 2** (warning) - Night idle +18%\n\nAck Kiln 1 before shift handoff.",
        citations: [
          { id: "c1", title: "Jaipur Works alarm console", path: "H" },
          { id: "c2", title: "Live alarm feed", snippet: "Last event 42s ago", path: "W" },
        ],
      },
    ],
  },
  {
    id: "chat_3",
    title: "Compressor sequencing",
    preview: "Three VFD units part-load - ₹1.08L/mo",
    updatedAt: "2026-07-20T16:30:00+05:30",
    messages: [
      {
        id: "chat_3_u0",
        role: "user",
        content: "Explain the compressor sequencing prescription.",
      },
      {
        id: "chat_3_a0",
        role: "assistant",
        content:
          "**Compressor sequencing** - all three **75 kW VFD compressors** running part-load when two would suffice.\n\nSnapshot: Unit-1 **43 kW**, Unit-2 **54 kW**, Unit-3 **68 kW** - combined **165 kW** vs ~**97 kW** for a sequenced two-unit strategy.\n\n**Immediate:** Set-point reset, no CAPEX. **Long-term:** PLC sequencer + receiver (~₹6–8.5L).",
        citations: [
          { id: "c1", title: "Compressor kW snapshot", path: "W" },
          { id: "c2", title: "Compressor sequencing rule", path: "H" },
        ],
      },
    ],
  },
  {
    id: "chat_4",
    title: "Mill 1 PF slab",
    preview: "APFC stage 3 - evidence for APFC health check",
    updatedAt: "2026-07-21T08:30:00+05:30",
    messages: [
      {
        id: "chat_4_u0",
        role: "user",
        content: "What proof should I open for the APFC prescription?",
      },
      {
        id: "chat_4_a0",
        role: "assistant",
        content:
          "Open **Evidence** scoped to **Cement Mill 1 PF** and APFC stage status.\n\nMeter data shows PF drift from **0.92 → 0.84** over the billing window. Stage 3 contactor has been **OUT since Jun 18**.\n\nSavings stay **confirmed by operations** until they appear on the utility bill.",
        citations: [
          { id: "c1", title: "PF drift window · Cement Mill 1", path: "W" },
          { id: "c2", title: "APFC health check prescription", path: "H" },
        ],
      },
    ],
  },
  {
    id: "chat_5",
    title: "Peak demand vs CMD",
    preview: "6.4% headroom - pyro + grinding overlap",
    updatedAt: "2026-07-19T14:00:00+05:30",
    messages: [
      {
        id: "chat_5_u0",
        role: "user",
        content: "What drove peak demand last week versus CMD?",
      },
      {
        id: "chat_5_a0",
        role: "assistant",
        content:
          "**Rolling peak MD: 4,680 kVA** vs CMD **5,000 kVA** (**6.4%** headroom).\n\nPrimary driver: **Kiln 1 + Raw Mill 2** co-start into 10–11 TOD peak on Jul 21.\n\nVs baseline (7d): **+6.2%** grid kWh. Peak TOD share **34%** of MTD cost.\n\nStagger large-load starts to recover ~**₹84k/mo**.",
        citations: [
          { id: "c1", title: "HT incomer · rolling MD", path: "W" },
          { id: "c2", title: "TOD tariff band · Jul 2026", path: "H" },
        ],
      },
    ],
  },
  {
    id: "chat_6",
    title: "Night idle - Raw Mill 2",
    preview: "47 min elevated idle",
    updatedAt: "2026-07-21T07:40:00+05:30",
    messages: [
      {
        id: "chat_6_u0",
        role: "user",
        content: "Why is Raw Mill 2 idle draw elevated overnight?",
      },
      {
        id: "chat_6_a0",
        role: "assistant",
        content:
          "**Raw Mill 2** idle ran **+18%** above night baseline for **47 minutes** on Jul 21.\n\nIdle kW: **168** vs baseline **142**. Likely cause: night setback not armed on operator panel.\n\n**Night setback prescription** addresses this - **₹42,000/mo** at 81% confidence. Apply validated setback when no batch is queued.",
        citations: [
          { id: "c1", title: "Idle suite windows · Raw Mill 2", path: "W" },
          { id: "c2", title: "Raw Mill 2 idle alarm", path: "H" },
        ],
      },
    ],
  },
  {
    id: "chat_7",
    title: "Closure tracking Jul",
    preview: "4 needs review · 30% closure rate",
    updatedAt: "2026-07-18T11:00:00+05:30",
    messages: [
      {
        id: "chat_7_u0",
        role: "user",
        content: "How is prescription closure tracking this billing cycle?",
      },
      {
        id: "chat_7_a0",
        role: "assistant",
        content:
          "**Closure rate (30d): 30%** - 3 of 10 prescriptions closed.\n\n**Needs review:** 4 prescriptions · **₹2.83L/mo** addressable still unassigned.\n\n**Verifying:** 2 prescriptions awaiting savings verification. Bottleneck is Kiln MD and compressor sequencing - assign owners this week.",
        citations: [
          { id: "c1", title: "Prescription queue · Jul 2026", path: "H" },
          { id: "c2", title: "Savings ledger MTD", path: "W" },
        ],
      },
    ],
  },
  {
    id: "chat_8",
    title: "HVAC off-peak setback",
    preview: "Confirmed ₹11.2k this month",
    updatedAt: "2026-07-10T09:15:00+05:30",
    messages: [
      {
        id: "chat_8_u0",
        role: "user",
        content: "Was the admin HVAC setback verified?",
      },
      {
        id: "chat_8_a0",
        role: "assistant",
        content:
          "**HVAC off-peak setback** is **closed** with confirmed savings of **₹11,200**.\n\nHVAC was running full duty on **4 of last 6** off-peak windows. Setback schedule is now locked.\n\nOpportunity cost of **14-day delay** was modeled at **₹5,600**.",
        citations: [
          { id: "c1", title: "HVAC savings · admin block", path: "H" },
          { id: "c2", title: "HVAC admin idle baseline", path: "W" },
        ],
      },
    ],
  },
];

export function formatChatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date("2026-07-21T10:15:00+05:30");
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
