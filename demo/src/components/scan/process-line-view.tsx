/** Process line view: discrete line swim lanes (Plant map flow pattern). */
import Link from "next/link";
import * as D from "@/lib/demo/data";
import { LineModeTag } from "@/components/ui/primitives";
import { Tile, mainAssets } from "@/components/plant/flow";

export function ProcessLineView() {
  return (
    <div className="line-schematic canvas">
      <p className="secondary" style={{ fontSize: 13, margin: 0 }}>
        Two-dimensional line schematic with live tags. Period: last 4 hours on demonstration data.
      </p>
      {D.lines.map((line) => (
        <section key={line.id} className="lane" aria-label={line.name}>
          <div className="lane-head">
            <b>{line.name}</b>
            <span className="muted">{line.product}</span>
            <LineModeTag mode={line.mode} />
            <Link className="link" href={`/process/lines/${line.id}`} style={{ marginLeft: "auto" }}>
              Line detail
            </Link>
          </div>
          <div className="lane-tiles">
            {mainAssets(line.id).map((a) => (
              <Tile key={a.id} a={a} href={`/plant/assets/${a.id}`} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
