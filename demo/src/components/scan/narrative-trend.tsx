/** Narrative trend card (View dashboard pattern, PlantCraft Apache-2.0, restyled). */
import { Sparkline } from "@/components/ui/charts";

export function NarrativeTrendCard({
  title,
  narrative,
  series,
  unit,
  bands,
}: {
  title: string;
  narrative: string;
  series: number[];
  unit: string;
  bands?: { label: string; low: number; high: number }[];
}) {
  return (
    <article className="narr-trend">
      <h3>{title}</h3>
      <p>{narrative}</p>
      <Sparkline values={series} width={320} height={56} label={title} />
      <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
        Last value <strong className="num">{series.at(-1)}</strong> {unit}
        {bands?.length ? <> · bands: {bands.map((b) => `${b.label} ${b.low} to ${b.high}`).join("; ")}</> : null}
      </p>
    </article>
  );
}
