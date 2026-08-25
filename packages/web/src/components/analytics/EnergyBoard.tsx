"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ECharts, EChartsCoreOption } from "echarts/core";
import { Panel, StatusChip } from "@/components/ui/primitives";
import { EmptyUpstreamState } from "@/components/ui/SourceIndicator";
import { formatIndianNum, formatInr } from "@/lib/format";
import {
  FORGE_ECHARTS_THEME,
  FORGE_ECHARTS_THEME_NAME,
} from "@/components/charts/forgeTheme";

export type EnergyBoardKpi = {
  label: string;
  value: string;
  unit: string;
  delta: number | null;
  good: boolean | null;
};

export type EnergyBoardData = {
  kpis: EnergyBoardKpi[];
  monthlyComparison: Array<{ m: string; actual: number; baseline: number; cost: number }> | null;
  cumulativeSavings: Array<{ m: string; saved: number; cum: number }> | null;
  costBreakdown: Array<{ name: string; value: number; color: string }> | null;
  sourceMix: Array<{ name: string; value: number; color: string }> | null;
  powerFactorTrend: Array<{ day: number; date?: string; pf: number }> | null;
  secTrend: Array<{ m: string; sec: number }> | null;
  weekdayProfile: Array<{ d: string; kwh: number }> | null;
  feederWise: Array<{
    feeder: string;
    kwh: number;
    share: number;
    pf: number | null;
  }> | null;
  loadHeatmap: Array<Array<{ day: string; hour: number; v: number }>> | null;
  derivedNotes?: string[];
};

function MiniChart({
  option,
  height,
  label,
}: {
  option: EChartsCoreOption;
  height: number;
  label: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    let ro: ResizeObserver | null = null;

    async function mount() {
      if (!hostRef.current) return;
      const echarts = await import("echarts/core");
      const { BarChart, LineChart, PieChart } = await import("echarts/charts");
      const {
        GridComponent,
        TooltipComponent,
        LegendComponent,
        MarkLineComponent,
      } = await import("echarts/components");
      const { CanvasRenderer } = await import("echarts/renderers");
      echarts.use([
        BarChart,
        LineChart,
        PieChart,
        GridComponent,
        TooltipComponent,
        LegendComponent,
        MarkLineComponent,
        CanvasRenderer,
      ]);
      try {
        echarts.registerTheme(FORGE_ECHARTS_THEME_NAME, FORGE_ECHARTS_THEME);
      } catch {
        /* already registered */
      }
      if (disposed || !hostRef.current) return;
      const chart = echarts.init(hostRef.current, FORGE_ECHARTS_THEME_NAME);
      chart.setOption(option);
      chartRef.current = chart;
      setReady(true);
      ro = new ResizeObserver(() => chart.resize());
      ro.observe(hostRef.current);
    }

    void mount();
    return () => {
      disposed = true;
      ro?.disconnect();
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, [option]);

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label={label}
      style={{ width: "100%", height, opacity: ready ? 1 : 0.4 }}
    />
  );
}

function MiniKpi({ label, value, unit, delta, good }: EnergyBoardKpi) {
  const color =
    good === true
      ? "var(--forge-tertiary)"
      : good === false
        ? "var(--forge-error)"
        : "var(--forge-on-surface-variant)";
  return (
    <Panel style={{ padding: 16, flex: "1 1 150px", minWidth: 150 }}>
      <p className="forge-eyebrow" style={{ fontSize: 10 }}>
        {label}
      </p>
      <p className="forge-num-display" style={{ fontSize: "1.6rem", marginTop: 8 }}>
        {value}
        {unit ? (
          <span style={{ fontSize: "0.85rem", fontWeight: 700, marginLeft: 3 }}>{unit}</span>
        ) : null}
      </p>
      {delta != null ? (
        <p style={{ color, fontSize: 12, fontWeight: 600, marginTop: 6 }}>
          {delta > 0 ? "+" : "−"}
          {Math.abs(delta)}% vs last period
        </p>
      ) : (
        <p style={{ color: "var(--forge-on-surface-variant)", fontSize: 11, marginTop: 6 }}>
          Live from plant data
        </p>
      )}
    </Panel>
  );
}

function DonutCard({
  eyebrow,
  title,
  data,
  valueLabel,
}: {
  eyebrow: string;
  title: string;
  data: Array<{ name: string; value: number; color: string }>;
  valueLabel: (v: number, pct: number) => string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const option = useMemo<EChartsCoreOption>(
    () => ({
      series: [
        {
          type: "pie",
          radius: ["52%", "78%"],
          data: data.map((d) => ({
            name: d.name,
            value: d.value,
            itemStyle: { color: d.color },
          })),
          label: { show: false },
        },
      ],
      tooltip: { trigger: "item" },
    }),
    [data],
  );

  return (
    <Panel>
      <p className="forge-eyebrow">{eyebrow}</p>
      <h3 className="forge-card-title">{title}</h3>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
        <div style={{ width: 150 }}>
          <MiniChart option={option} height={160} label={title} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
          {data.map((d) => {
            const pct = (d.value / total) * 100;
            return (
              <div
                key={d.name}
                style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}
              >
                <span
                  style={{ width: 9, height: 9, borderRadius: 2, background: d.color, flexShrink: 0 }}
                />
                <span style={{ flex: 1 }}>{d.name}</span>
                <span style={{ fontWeight: 600, color: "var(--forge-on-surface-variant)" }}>
                  {valueLabel(d.value, pct)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

function Heatmap({ rows }: { rows: Array<Array<{ day: string; hour: number; v: number }>> }) {
  const color = (v: number) => {
    if (v >= 85) return "var(--forge-error)";
    if (v >= 70) return "var(--forge-warning)";
    if (v >= 50) return "var(--forge-primary)";
    if (v >= 35) return "rgba(0,102,107,0.55)";
    return "rgba(0,102,107,0.22)";
  };
  return (
    <Panel>
      <p className="forge-eyebrow">Load Intensity</p>
      <h3 className="forge-card-title">Weekly Load Heatmap (24h × 7d)</h3>
      <div style={{ overflowX: "auto", marginTop: 14 }} className="forge-scroll-thin">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "34px repeat(24, 1fr)",
            gap: 3,
            minWidth: 640,
          }}
        >
          <span />
          {Array.from({ length: 24 }, (_, h) => (
            <span
              key={h}
              style={{
                fontSize: 8.5,
                color: "var(--forge-on-surface-variant)",
                textAlign: "center",
              }}
            >
              {h % 3 === 0 ? h : ""}
            </span>
          ))}
          {rows.map((row) => (
            <HeatRow key={row[0]?.day ?? "row"} row={row} color={color} />
          ))}
        </div>
      </div>
    </Panel>
  );
}

function HeatRow({
  row,
  color,
}: {
  row: Array<{ day: string; hour: number; v: number }>;
  color: (v: number) => string;
}) {
  return (
    <>
      <span
        style={{
          fontSize: 10,
          color: "var(--forge-on-surface-variant)",
          display: "flex",
          alignItems: "center",
        }}
      >
        {row[0]?.day}
      </span>
      {row.map((cell) => (
        <span
          key={cell.hour}
          title={`${cell.day} ${cell.hour}:00 - ${cell.v}% load`}
          style={{ height: 18, borderRadius: 3, background: color(cell.v) }}
        />
      ))}
    </>
  );
}

/** Dashboard-parity Energy Analytics board — props only, no fixtures. */
export function EnergyBoard({ data }: { data: EnergyBoardData }) {
  const monthlyOption = useMemo<EChartsCoreOption | null>(() => {
    if (!data.monthlyComparison?.length) return null;
    const rows = data.monthlyComparison;
    return {
      tooltip: { trigger: "axis" },
      legend: { data: ["Baseline", "Actual", "Cost"] },
      grid: { left: 48, right: 48, top: 40, bottom: 28 },
      xAxis: { type: "category", data: rows.map((d) => d.m) },
      yAxis: [
        { type: "value", name: "k kWh" },
        { type: "value", name: "₹L", splitLine: { show: false } },
      ],
      series: [
        {
          name: "Baseline",
          type: "bar",
          data: rows.map((d) => d.baseline),
          itemStyle: { color: "rgba(143,112,107,0.35)" },
        },
        {
          name: "Actual",
          type: "bar",
          data: rows.map((d) => d.actual),
          itemStyle: { color: "#f75440" },
        },
        {
          name: "Cost",
          type: "line",
          yAxisIndex: 1,
          data: rows.map((d) => d.cost),
          itemStyle: { color: "#00666b" },
        },
      ],
    };
  }, [data.monthlyComparison]);

  const cumulativeOption = useMemo<EChartsCoreOption | null>(() => {
    if (!data.cumulativeSavings?.length) return null;
    const rows = data.cumulativeSavings;
    return {
      tooltip: { trigger: "axis" },
      grid: { left: 56, right: 16, top: 24, bottom: 28 },
      xAxis: { type: "category", data: rows.map((d) => d.m) },
      yAxis: { type: "value", axisLabel: { formatter: (v: number) => `₹${(v / 1e5).toFixed(1)}L` } },
      series: [
        {
          type: "line",
          areaStyle: { opacity: 0.12 },
          data: rows.map((d) => d.cum),
          itemStyle: { color: "#00666b" },
        },
      ],
    };
  }, [data.cumulativeSavings]);

  const pfOption = useMemo<EChartsCoreOption | null>(() => {
    if (!data.powerFactorTrend?.length) return null;
    const rows = data.powerFactorTrend;
    return {
      tooltip: { trigger: "axis" },
      grid: { left: 48, right: 16, top: 24, bottom: 28 },
      xAxis: { type: "category", data: rows.map((d) => d.day) },
      yAxis: { type: "value", min: 0.7, max: 1 },
      series: [
        {
          type: "line",
          data: rows.map((d) => d.pf),
          itemStyle: { color: "#f75440" },
          markLine: {
            data: [{ yAxis: 0.9, name: "Target" }],
            lineStyle: { type: "dashed" },
          },
        },
      ],
    };
  }, [data.powerFactorTrend]);

  const secOption = useMemo<EChartsCoreOption | null>(() => {
    if (!data.secTrend?.length) return null;
    const rows = data.secTrend;
    return {
      tooltip: { trigger: "axis" },
      grid: { left: 48, right: 16, top: 24, bottom: 28 },
      xAxis: { type: "category", data: rows.map((d) => d.m) },
      yAxis: { type: "value" },
      series: [
        {
          type: "line",
          data: rows.map((d) => d.sec),
          itemStyle: { color: "#00666b" },
        },
      ],
    };
  }, [data.secTrend]);

  const weekdayOption = useMemo<EChartsCoreOption | null>(() => {
    if (!data.weekdayProfile?.length) return null;
    const rows = data.weekdayProfile;
    return {
      tooltip: { trigger: "axis" },
      grid: { left: 48, right: 16, top: 24, bottom: 28 },
      xAxis: { type: "category", data: rows.map((d) => d.d) },
      yAxis: { type: "value" },
      series: [
        {
          type: "bar",
          data: rows.map((d) => d.kwh),
          itemStyle: { color: "#f75440", borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, [data.weekdayProfile]);

  const lastCum = data.cumulativeSavings?.at(-1)?.cum;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }} data-energy>
      {data.kpis.length ? (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {data.kpis.map((k) => (
            <MiniKpi key={k.label} {...k} />
          ))}
        </div>
      ) : null}

      {data.derivedNotes?.length ? (
        <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
          {data.derivedNotes.join(" · ")}
        </p>
      ) : null}

      {monthlyOption ? (
        <Panel>
          <p className="forge-eyebrow">Bill / trend</p>
          <h3 className="forge-card-title">Consumption vs Baseline & Cost</h3>
          <div style={{ marginTop: 12 }}>
            <MiniChart option={monthlyOption} height={280} label="Monthly consumption" />
          </div>
        </Panel>
      ) : (
        <EmptyUpstreamState
          title="Monthly consumption chart"
          detail="No utility bills with energy totals for this plant yet."
        />
      )}

      <div className="forge-grid-60-40">
        {cumulativeOption && lastCum != null ? (
          <Panel>
            <p className="forge-eyebrow">Derived M&amp;V</p>
            <h3 className="forge-card-title">Cumulative Savings (from baseline uplift)</h3>
            <div style={{ marginTop: 12 }}>
              <MiniChart option={cumulativeOption} height={240} label="Cumulative savings" />
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
              Cumulative derived savings:{" "}
              <strong style={{ color: "var(--forge-tertiary)" }}>{formatInr(lastCum)}</strong>
            </p>
          </Panel>
        ) : (
          <EmptyUpstreamState
            title="Cumulative savings"
            detail="Needs bill months to derive cumulative savings."
          />
        )}
        {data.costBreakdown?.length ? (
          <DonutCard
            eyebrow="Where the ₹ go"
            title="Latest bill cost breakdown"
            data={data.costBreakdown}
            valueLabel={(v, pct) => `${pct.toFixed(0)}% · ${formatInr(v)}`}
          />
        ) : (
          <EmptyUpstreamState
            title="Cost breakdown"
            detail="Bill line items unavailable for the latest bill."
          />
        )}
      </div>

      <div className="forge-grid-60-40">
        {pfOption ? (
          <Panel>
            <p className="forge-eyebrow">Power Quality</p>
            <h3 className="forge-card-title">Power Factor Trend (30d)</h3>
            <div style={{ marginTop: 12 }}>
              <MiniChart option={pfOption} height={220} label="Power factor" />
            </div>
          </Panel>
        ) : (
          <EmptyUpstreamState
            title="Power factor trend"
            detail="No power factor series for the plant incomer."
          />
        )}
        {secOption ? (
          <Panel>
            <p className="forge-eyebrow">Efficiency</p>
            <h3 className="forge-card-title">Specific Energy Consumption</h3>
            <div style={{ marginTop: 12 }}>
              <MiniChart option={secOption} height={220} label="SEC trend" />
            </div>
          </Panel>
        ) : (
          <EmptyUpstreamState title="SEC trend" detail="No SEC data for this plant yet." />
        )}
      </div>

      <div className="forge-grid-60-40">
        {weekdayOption ? (
          <Panel>
            <p className="forge-eyebrow">Pattern</p>
            <h3 className="forge-card-title">Average Consumption by Weekday</h3>
            <div style={{ marginTop: 12 }}>
              <MiniChart option={weekdayOption} height={220} label="Weekday profile" />
            </div>
          </Panel>
        ) : (
          <EmptyUpstreamState
            title="Weekday profile"
            detail="No daily energy series for the plant incomer."
          />
        )}
        {data.sourceMix?.length ? (
          <DonutCard
            eyebrow="Supply"
            title="Energy Source Mix"
            data={data.sourceMix}
            valueLabel={(v) => `${v}%`}
          />
        ) : (
          <EmptyUpstreamState
            title="Energy source mix"
            detail="No generation or source-mix data — chart stays empty."
          />
        )}
      </div>

      {data.loadHeatmap?.length ? (
        <Heatmap rows={data.loadHeatmap} />
      ) : (
        <EmptyUpstreamState
          title="Load heatmap"
          detail="No 15-min active_power_kw series for the last 7 days."
        />
      )}

      {data.feederWise?.length ? (
        <Panel style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: 20 }}>
            <p className="forge-eyebrow">Distribution</p>
            <h3 className="forge-card-title">Feeder-wise Consumption (30d)</h3>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--forge-surface-container-low)" }}>
                {["Feeder", "Period kWh", "Share", "Power Factor", "PF Status"].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      textAlign: i > 0 ? "right" : "left",
                      padding: "10px 16px",
                      fontSize: 10.5,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: "var(--forge-on-surface-variant)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.feederWise.map((f) => {
                const ok = f.pf != null && f.pf >= 0.9;
                return (
                  <tr key={f.feeder} style={{ borderTop: "1px solid var(--forge-outline-variant)" }}>
                    <td style={{ padding: "11px 16px", fontWeight: 600 }}>{f.feeder}</td>
                    <td style={{ padding: "11px 16px", textAlign: "right" }} className="tabular">
                      {formatIndianNum(f.kwh)}
                    </td>
                    <td style={{ padding: "11px 16px", textAlign: "right" }} className="tabular">
                      {f.share}%
                    </td>
                    <td
                      style={{
                        padding: "11px 16px",
                        textAlign: "right",
                        fontWeight: 700,
                        color:
                          f.pf == null
                            ? "var(--forge-on-surface-variant)"
                            : ok
                              ? "var(--forge-tertiary)"
                              : "var(--forge-error)",
                      }}
                      className="tabular"
                    >
                      {f.pf != null ? f.pf.toFixed(2) : "—"}
                    </td>
                    <td style={{ padding: "11px 16px", textAlign: "right" }}>
                      {f.pf == null ? (
                        <StatusChip tone="neutral">No PF</StatusChip>
                      ) : (
                        <StatusChip tone={ok ? "good" : "critical"}>
                          {ok ? "Compliant" : "Penalty"}
                        </StatusChip>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      ) : (
        <EmptyUpstreamState
          title="Feeder-wise consumption"
          detail="No feeder energy series for this plant."
        />
      )}
    </div>
  );
}
