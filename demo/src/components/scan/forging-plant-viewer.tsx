"use client";

/**
 * Process plant viewer (ported from PlantCraft DiagramPage viewer, Apache-2.0).
 * Area tabs, period selector, replay slider, zoom, and full screen.
 */
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { DiagramCanvas } from "@/components/scan/pfd/DiagramCanvas";
import {
  FORGING_EQUIPMENT,
  forgingLineDiagram,
  forgingLineShows,
  type EquipmentDetail,
} from "@/components/scan/pfd/forgingFixture";
import { areaOf, type Element, type Shows, type SymbolElement } from "@/components/scan/pfd/model";
import { forgingSymbolMap } from "@/components/scan/pfd/symbols";
import { clampView, fullView, zoomAt, zoomLevel, type ViewBox } from "@/components/scan/pfd/zoom";
import { Section, Tag } from "@/components/ui/primitives";
import { StatusGlyph } from "@/components/plant/flow";

const WINDOWS = ["15m", "1h", "8h", "24h", "7d"] as const;
const SPEEDS = [1, 10, 60];

function windowLabel(w: string) {
  return ({ "15m": "15 minutes", "1h": "1 hour", "8h": "8 hours", "24h": "24 hours", "7d": "7 days" } as Record<string, string>)[w] ?? w;
}

function clock(ms: number) {
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function ZoomStage({
  width,
  height,
  reset,
  goTo,
  onView,
  children,
}: {
  width: number;
  height: number;
  reset: string;
  goTo?: { area: ViewBox | null; at: number };
  onView?: (view: ViewBox | null) => void;
  children: (view: ViewBox | null, svgRef: RefObject<SVGSVGElement | null>, show: (area: ViewBox) => void) => ReactNode;
}) {
  const [view, setView] = useState<ViewBox | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const drag = useRef<{ x: number; y: number; view: ViewBox; inverse: DOMMatrix; moved: boolean } | null>(null);
  const dragged = useRef(false);
  useEffect(() => {
    setView(null);
  }, [reset, width, height]);
  useEffect(() => {
    onView?.(view);
  }, [view, onView]);
  const canvasPoint = useCallback((clientX: number, clientY: number): [number, number] | null => {
    const matrix = svgRef.current?.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
    return [point.x, point.y];
  }, []);
  const zoom = useCallback(
    (factor: number, at?: [number, number] | null) => {
      setView((current) => {
        const now = current ?? fullView(width, height);
        const [px, py] = at ?? [now.x + now.w / 2, now.y + now.h / 2];
        const next = zoomAt(now, factor, px, py, width, height);
        return next.w >= width ? null : next;
      });
    },
    [width, height],
  );
  useEffect(() => {
    const box = stage.current;
    if (!box) return undefined;
    const wheel = (event: WheelEvent) => {
      if (event.deltaY > 0 && !view) return;
      const at = canvasPoint(event.clientX, event.clientY);
      if (!at) return;
      event.preventDefault();
      zoom(Math.exp(-event.deltaY * 0.0015), at);
    };
    box.addEventListener("wheel", wheel, { passive: false });
    return () => box.removeEventListener("wheel", wheel);
  }, [view, zoom, canvasPoint]);
  const level = view ? zoomLevel(view, width) : 1;
  const show = useCallback(
    (area: ViewBox) => {
      const w = Math.max(area.w, (area.h / height) * width);
      const next = clampView(
        {
          x: area.x + area.w / 2 - w / 2,
          y: area.y + area.h / 2 - ((w / width) * height) / 2,
          w,
          h: (w / width) * height,
        },
        width,
        height,
      );
      setView(next.w >= width ? null : next);
    },
    [width, height],
  );
  useEffect(() => {
    if (goTo) {
      if (goTo.area) show(goTo.area);
      else setView(null);
    }
  }, [goTo, show]);
  return (
    <div
      ref={stage}
      className={`dg-zoom-stage${view ? " dg-zoomed" : ""}`}
      onPointerDown={(event) => {
        const matrix = svgRef.current?.getScreenCTM();
        if (event.button !== 0 || !view || !matrix) return;
        drag.current = { x: event.clientX, y: event.clientY, view, inverse: matrix.inverse(), moved: false };
      }}
      onPointerMove={(event) => {
        const start = drag.current;
        if (!start) return;
        if (!start.moved) {
          if (Math.hypot(event.clientX - start.x, event.clientY - start.y) < 4) return;
          start.moved = true;
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        const from = new DOMPoint(start.x, start.y).matrixTransform(start.inverse);
        const to = new DOMPoint(event.clientX, event.clientY).matrixTransform(start.inverse);
        setView(clampView({ ...start.view, x: start.view.x - (to.x - from.x), y: start.view.y - (to.y - from.y) }, width, height));
      }}
      onPointerUp={() => {
        dragged.current = Boolean(drag.current?.moved);
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      onClickCapture={(event) => {
        if (dragged.current) {
          dragged.current = false;
          event.stopPropagation();
          event.preventDefault();
        }
      }}
      onDoubleClick={(event) => zoom(2, canvasPoint(event.clientX, event.clientY))}
    >
      {children(view, svgRef, show)}
      <div className="dg-zoom" onPointerDown={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()}>
        <button type="button" className="btn-ghost btn-sm" disabled={!view} onClick={() => zoom(0.5)} aria-label="Zoom out">
          −
        </button>
        <span className="dg-zoom-level num" aria-live="polite">
          {Math.round(level * 100)}%
        </span>
        <button type="button" className="btn-ghost btn-sm" disabled={level >= 8} onClick={() => zoom(2)} aria-label="Zoom in">
          +
        </button>
        <button type="button" className="btn-ghost btn-sm" disabled={!view} onClick={() => setView(null)} aria-label="Fit whole drawing">
          Fit
        </button>
      </div>
    </div>
  );
}

const stateGlyph = (s: string) => (s === "alarm" ? "act" : s === "watch" || s === "warning" ? "watch" : "normal");

export function PlantDiagramViewer() {
  const diagram = forgingLineDiagram;
  const symbols = forgingSymbolMap();
  const parts = useMemo(
    () =>
      (diagram.parts ?? []).flatMap((part) => {
        const box = areaOf(part.area);
        return box ? [{ ...part, box }] : [];
      }),
    [diagram.parts],
  );
  const [partId, setPartId] = useState("");
  const [goTo, setGoTo] = useState<{ area: ViewBox | null; at: number } | undefined>();
  const [seen, setSeen] = useState<ViewBox | null>(null);
  const inView =
    !seen || !parts.length
      ? ""
      : (parts.find(({ box }) => {
          const cx = seen.x + seen.w / 2;
          const cy = seen.y + seen.h / 2;
          return cx >= box.x && cx <= box.x + box.w && cy >= box.y && cy <= box.y + box.h && seen.w <= box.w * 1.2;
        })?.id ?? "");
  const openPart = (id: string) => {
    setPartId(id);
    const box = id ? (parts.find((p) => p.id === id)?.box ?? null) : null;
    setGoTo({ area: box, at: Date.now() });
  };
  const [periodWin, setPeriodWin] = useState<(typeof WINDOWS)[number]>("1h");
  const [cursor, setCursor] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(60);
  const start = Date.now() - 3_600_000;
  const stop = Date.now();
  const live = cursor === null;
  useEffect(() => {
    if (!playing || cursor === null) return undefined;
    const timer = globalThis.setInterval(() => {
      setCursor((c) => {
        const next = (c ?? start) + speed * 250;
        if (next >= stop) {
          setPlaying(false);
          return stop;
        }
        return next;
      });
    }, 250);
    return () => globalThis.clearInterval(timer);
  }, [playing, cursor, speed, start, stop]);
  const baseShows = useMemo(() => forgingLineShows(), []);
  const shows: Shows = useMemo(() => {
    if (live) return baseShows;
    const phase = ((cursor ?? stop) - start) / (stop - start);
    const m = new Map(baseShows);
    const press = m.get("v-press-b");
    if (press?.value) {
      m.set("v-press-b", {
        value: {
          ...press.value,
          value: Number(press.value.value) + Math.sin(phase * Math.PI * 4) * 6,
        },
      });
    }
    return m;
  }, [baseShows, live, cursor, start, stop]);
  const [selected, setSelected] = useState<EquipmentDetail | undefined>(FORGING_EQUIPMENT["eq-press-b"]);
  const stage = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
  useEffect(() => {
    const onFs = () => setFull(Boolean(stage.current && document.fullscreenElement === stage.current));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);
  const enterFull = () => {
    const box = stage.current;
    if (!box?.requestFullscreen) return;
    void box.requestFullscreen().catch(() => undefined);
  };
  const leaveFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  };
  const onOpen = useCallback((el: Element) => {
    if (el.type !== "symbol" || !el.asset_id) return;
    const detail = FORGING_EQUIPMENT[(el as SymbolElement).asset_id ?? el.id];
    if (detail) setSelected(detail);
  }, []);

  const timeBar = (
    <div className="dg-timebar" role="group" aria-label="Time">
      <div className="dg-timebar-row">
        <span className="dg-timebar-label">Period</span>
        <div className="dg-segmented" role="radiogroup" aria-label="Period">
          {WINDOWS.map((item) => (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={periodWin === item}
              className={periodWin === item ? "dg-on" : ""}
              onClick={() => {
                setPeriodWin(item);
                setCursor(null);
              }}
            >
              {windowLabel(item)}
            </button>
          ))}
        </div>
      </div>
      <div className="dg-timebar-row">
        <button
          type="button"
          className="btn-ghost btn-sm"
          aria-label={playing ? "Pause" : "Play the period"}
          onClick={() => {
            if (playing) {
              setPlaying(false);
              return;
            }
            if (cursor === null || cursor >= stop) setCursor(start);
            setPlaying(true);
          }}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <label className="dg-speed">
          <span className="sr-only">Speed</span>
          <select aria-label="Speed" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
            {SPEEDS.map((item) => (
              <option key={item} value={item}>
                {item}× speed
              </option>
            ))}
          </select>
        </label>
        <input
          type="range"
          aria-label="Instant shown"
          min={start}
          max={stop}
          step={1000}
          value={cursor ?? stop}
          onChange={(e) => {
            setPlaying(false);
            setCursor(Number(e.target.value));
          }}
        />
        <time className={live ? "dg-live" : ""}>{live ? "Now" : clock(cursor ?? stop)}</time>
        <button
          type="button"
          className={`btn-sm${live ? " btn-primary" : " btn-ghost"}`}
          onClick={() => {
            setPlaying(false);
            setCursor(null);
          }}
          aria-pressed={live}
        >
          Live
        </button>
      </div>
    </div>
  );

  return (
    <div className="plant-view stack">
      <div className="plant-view-toolbar">
        <div className="dg-tabs" role="tablist" aria-label="Plant areas">
          <button type="button" role="tab" className={inView === "" && !partId ? "on" : ""} aria-selected={inView === "" && !partId} onClick={() => openPart("")}>
            Overview
          </button>
          {parts.map((part) => (
            <button
              key={part.id}
              type="button"
              role="tab"
              className={inView === part.id || partId === part.id ? "on" : ""}
              aria-selected={inView === part.id || partId === part.id}
              onClick={() => openPart(part.id)}
            >
              {part.name}
            </button>
          ))}
        </div>
        <button type="button" className="btn-ghost btn-sm" onClick={full ? leaveFull : enterFull}>
          {full ? "Leave full screen" : "Full screen"}
        </button>
      </div>
      {!full && timeBar}
      <div ref={stage} className={`plant-stage${full ? " plant-stage-full" : ""}`}>
        {full && (
          <div className="dg-full-bar">
            <span className="dg-full-name">{diagram.name}</span>
            {timeBar}
            <button type="button" className="btn-ghost btn-sm" onClick={leaveFull}>
              Exit
            </button>
          </div>
        )}
        <div className="plant-stage-body">
          <ZoomStage width={diagram.width} height={diagram.height} reset={diagram.name} goTo={goTo} onView={setSeen}>
            {(view, svgRef) => (
              <DiagramCanvas
                diagram={diagram}
                symbols={symbols}
                shows={shows}
                selectedId={selected?.id}
                onOpen={onOpen}
                view={view}
                svgRef={svgRef}
              />
            )}
          </ZoomStage>
        </div>
      </div>
      <details className="pfd-detail-drawer section">
        <summary className="pfd-detail-drawer-head">
          <span className="pfd-detail-drawer-title">{selected ? selected.title : "Equipment detail"}</span>
          <span className="pfd-detail-drawer-hint">{selected ? "Loops and live tags · demonstration" : "Select equipment on the diagram"}</span>
        </summary>
        <div className="pfd-detail section-body flush">
          {selected ? (
            <div className="pfd-detail-grid">
              <div className="pfd-detail-main stack-sm">
                <p style={{ margin: 0 }}>
                  <StatusGlyph s={stateGlyph(selected.tags.some((t) => t.state === "alarm") ? "act" : selected.tags.some((t) => t.state === "warning") ? "watch" : "normal")} />{" "}
                  <strong>{selected.title}</strong>
                </p>
                <p className="secondary" style={{ fontSize: 13, margin: 0 }}>
                  {selected.summary}
                </p>
                <div className="tag-row">
                  {selected.tags.map((t) => (
                    <Tag key={t.label} tone={t.state === "alarm" ? "critical" : t.state === "warning" ? "warning" : "success"}>
                      {t.label} {t.value}
                      {t.unit ? ` ${t.unit}` : ""}
                    </Tag>
                  ))}
                </div>
                <Link className="link" href={selected.assetHref}>
                  Open plant asset
                </Link>
              </div>
            </div>
          ) : (
            <p className="muted" style={{ padding: "12px 16px" }}>
              Click press, furnace, machining, or inspection on the diagram.
            </p>
          )}
        </div>
      </details>
    </div>
  );
}
