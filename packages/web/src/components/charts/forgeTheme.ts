/** Forge Industrial v2 palette for ECharts - brand tokens only. */

export const FORGE_ECHARTS_THEME = {
  color: ["#00666b", "#f75440", "#000a07", "#c97a00", "#1b6b3a"],
  backgroundColor: "transparent",
  textStyle: {
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    color: "#191c1a",
  },
  title: {
    textStyle: {
      fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif",
      color: "#000a07",
      fontWeight: 700,
    },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: "#8f706b" } },
    axisLabel: { color: "#5a403c" },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: false },
    axisLabel: { color: "#5a403c" },
    splitLine: { lineStyle: { color: "#e3beb8", type: "dashed" as const } },
  },
  line: {
    smooth: false,
    symbol: "none",
    lineStyle: { width: 2 },
  },
  tooltip: {
    backgroundColor: "#2d312e",
    borderWidth: 0,
    textStyle: { color: "#eff2ed" },
  },
} as const;

export const FORGE_ECHARTS_THEME_NAME = "forge-industrial-v2";
