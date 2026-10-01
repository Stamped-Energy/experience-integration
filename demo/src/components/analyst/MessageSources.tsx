"use client";

import { useState } from "react";
import type { AnalystCitation } from "@/lib/analyst-context";
import { citationPathLabel } from "@/lib/format";
import { ChevronDown } from "@/components/ui/icons";

export function MessageSources({ citations }: { citations: AnalystCitation[] }) {
  const [open, setOpen] = useState(false);

  if (!citations.length) return null;

  return (
    <div className="analyst-msg__sources">
      <button
        type="button"
        className="analyst-sources-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <ChevronDown
          size={14}
          className={`analyst-sources-toggle__chev${open ? " analyst-sources-toggle__chev--open" : ""}`}
        />
        {citations.length} {citations.length === 1 ? "source" : "sources"}
      </button>
      {open ? (
        <ul className="analyst-sources-dropdown">
          {citations.map((c) => (
            <li key={c.id} className="analyst-sources-dropdown__item">
              <span
                className={`analyst-sources-dropdown__path analyst-sources-dropdown__path--${(c.path ?? "H").toLowerCase()}`}
              >
                {citationPathLabel(c.path)}
              </span>
              <div className="analyst-sources-dropdown__body">
                <p className="analyst-sources-dropdown__title">{c.title}</p>
                {c.snippet ? (
                  <p className="analyst-sources-dropdown__snippet">{c.snippet}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
