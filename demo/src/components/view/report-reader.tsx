"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RunChart } from "@/components/ui/charts";
import { Tag } from "@/components/ui/primitives";
import type { DemoReport, ReportSection } from "@/lib/demo/plantReport";
import { reportOutline } from "@/lib/demo/plantReport";

function StatStrip({ section }: { section: ReportSection }) {
  const stats = section.stats ?? [];
  return (
    <div className="rep-stat-strip">
      {stats.map((s) => (
        <div key={s.label} className={`rep-stat${s.accent ? " rep-stat-accent" : ""}`}>
          <span className="rep-stat-value num">{s.value}</span>
          <span className="rep-stat-label">
            <strong>{s.label}.</strong> {s.note}
          </span>
        </div>
      ))}
    </div>
  );
}

function EventsBlock({ section }: { section: ReportSection }) {
  const rows = section.events ?? [];
  return (
    <table className="rep-table">
      <caption>{section.title}</caption>
      <thead>
        <tr>
          <th>When</th>
          <th>Event</th>
          <th>About</th>
          <th>What happened</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.at + row.title}>
            <td className="num">{row.at}</td>
            <td>
              <Tag tone={row.severity === "critical" ? "critical" : row.severity === "warning" ? "warning" : "neutral"}>{row.title}</Tag>
            </td>
            <td>{row.about}</td>
            <td>{row.summary}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SectionBody({ section }: { section: ReportSection }) {
  if (section.kind === "text") {
    return (
      <div className="rep-text">
        <p>{section.body}</p>
      </div>
    );
  }
  if (section.kind === "stats") return <StatStrip section={section} />;
  if (section.kind === "trend" && section.trend) {
    return (
      <div className="rep-trend">
        <p>{section.trend.title}</p>
        <div className="rep-trend-plot">
          <RunChart values={section.trend.values} height={110} width={560} label={section.title} />
        </div>
        <p className="muted">
          Last value <strong className="num">{section.trend.values.at(-1)}</strong> {section.trend.unit} · demonstration trend
        </p>
      </div>
    );
  }
  if (section.kind === "events") return <EventsBlock section={section} />;
  return null;
}

function readSectionParam(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("section");
}

export function ReportReader({ report }: { report: DemoReport }) {
  const outline = useMemo(() => reportOutline(report.sections), [report.sections]);
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(() => {
    const fromUrl = readSectionParam();
    if (fromUrl && outline.some((o) => o.id === fromUrl)) return fromUrl;
    return outline[0]?.id ?? "";
  });
  const main = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const paramSection = readSectionParam();
    if (paramSection && outline.some((o) => o.id === paramSection)) {
      setActive(paramSection);
    }
  }, [outline]);

  const selectSection = useCallback(
    (id: string) => {
      setActive(id);
      const next = new URLSearchParams(window.location.search);
      next.set("section", id);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      const el = main.current?.querySelector(`#${id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [pathname, router],
  );

  useEffect(() => {
    const root = main.current;
    if (!root) return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) {
          setActive(visible.target.id);
          const next = new URLSearchParams(window.location.search);
          if (next.get("section") !== visible.target.id) {
            next.set("section", visible.target.id);
            router.replace(`${pathname}?${next.toString()}`, { scroll: false });
          }
        }
      },
      { root, rootMargin: "-20% 0px -55% 0px", threshold: [0.2, 0.6] },
    );
    outline.forEach(({ id }) => {
      const el = root.querySelector(`#${id}`);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [outline, pathname, router, report.id]);

  const tabs = useMemo(() => outline, [outline]);

  return (
    <div className="rep-layout rep-layout-tabs">
      <div className="rep-tabs" role="tablist" aria-label="Report sections">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`rep-tab-${item.id}`}
            aria-selected={active === item.id}
            aria-controls={item.id}
            className={active === item.id ? "on" : ""}
            onClick={() => selectSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <article className="rep-paper" ref={main}>
        <header className="rep-cover">
          <p className="muted">{report.periodLabel}</p>
          <h2>{report.name}</h2>
          <p className="secondary">{report.covers}</p>
          <p className="pfd-demo-banner">Demonstration report · not sent externally</p>
        </header>
        {report.sections.map((section) => (
          <section key={section.id} id={section.id} className="rep-section" role="tabpanel" aria-labelledby={`rep-tab-${section.id}`}>
            <h3>{section.title}</h3>
            <SectionBody section={section} />
          </section>
        ))}
      </article>
    </div>
  );
}
