/** PV / SP / OP trend card (PlantCraft dashboard time-series pattern, Apache-2.0). */

export interface PvSpOpSeries {
  t: number[];
  pv: number[];
  sp: number[];
  op: number[];
}

function pathFor(values: number[], times: number[], width: number, height: number, pad = 8) {
  if (values.length < 2) return "";
  const t0 = times[0];
  const t1 = times.at(-1) ?? t0;
  const ys = values.filter((v) => Number.isFinite(v));
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  return values
    .map((y, i) => {
      const x = pad + ((times[i] - t0) / (t1 - t0 || 1)) * (width - pad * 2);
      const yy = height - pad - ((y - y0) / (y1 - y0 || 1)) * (height - pad * 2);
      return `${i ? "L" : "M"} ${x} ${yy}`;
    })
    .join(" ");
}

export function PvSpOpTrendCard({
  title,
  caption,
  series,
  units = { pv: "", sp: "", op: "%" },
}: {
  title: string;
  caption: string;
  series: PvSpOpSeries;
  units?: { pv: string; sp: string; op: string };
}) {
  const w = 360;
  const h = 120;
  const pvPath = pathFor(series.pv, series.t, w, h);
  const spPath = pathFor(series.sp, series.t, w, h);
  const opPath = pathFor(series.op, series.t, w, h);
  const last = series.t.length - 1;
  return (
    <article className="pv-chart">
      <header>
        <h3>{title}</h3>
        <p>{caption}</p>
      </header>
      <svg viewBox={`0 0 ${w} ${h}`} className="pv-chart-plot" role="img" aria-label={title}>
        <path d={pvPath} className="pv-line pv" />
        <path d={spPath} className="pv-line sp" />
        <path d={opPath} className="pv-line op" />
      </svg>
      <footer className="pv-chart-legend">
        <span>
          <i className="pv" /> PV <strong className="num">{series.pv[last]?.toFixed(1)}</strong> {units.pv}
        </span>
        <span>
          <i className="sp" /> SP <strong className="num">{series.sp[last]?.toFixed(1)}</strong> {units.sp}
        </span>
        <span>
          <i className="op" /> OP <strong className="num">{series.op[last]?.toFixed(1)}</strong> {units.op}
        </span>
      </footer>
    </article>
  );
}
