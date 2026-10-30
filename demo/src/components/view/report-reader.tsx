"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkline } from "@/components/ui/charts";
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
        <Sparkline values={section.trend.values} width={480} height={64} label={section.title} />
        <p className="muted">
          Last value <strong className="num">{section.trend.values.at(-1)}</strong> {section.trend.unit} · demonstration trend
        </p>
      </div>
    );
  }
  if (section.kind === "events") return <EventsBlock section={section} />;
  return null;
}

export function ReportReader({ report }: { report: DemoReport }) {
  const outline = reportOutline(report.sections);
  const [active, setActive] = useState(outline[0]?.id ?? "");
  const main = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = main.current;
    if (!root) return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { root, rootMargin: "-20% 0px -55% 0px", threshold: [0.2, 0.6] },
    );
    outline.forEach(({ id }) => {
      const el = root.querySelector(`#${id}`);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [outline, report.id]);

  return (
    <div className="rep-layout">
      <nav className="rep-outline" aria-label="Report sections">
        <p className="rep-outline-title">Sections</p>
        <ol>
          {outline.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className={active === item.id ? "on" : ""} onClick={() => setActive(item.id)}>
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <article className="rep-paper" ref={main}>
        <header className="rep-cover">
          <p className="muted">{report.periodLabel}</p>
          <h2>{report.name}</h2>
          <p className="secondary">{report.covers}</p>
          <p className="pfd-demo-banner">Demonstration report · not sent externally</p>
        </header>
        {report.sections.map((section) => (
          <section key={section.id} id={section.id} className="rep-section">
            <h3>{section.title}</h3>
            <SectionBody section={section} />
          </section>
        ))}
      </article>
    </div>
  );
}
