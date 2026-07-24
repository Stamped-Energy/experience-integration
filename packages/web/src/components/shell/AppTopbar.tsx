"use client";

import { Sparkles } from "@/components/ui/icons";
import { StampedLogo } from "@/components/shell/StampedLogo";
import { liveConnectionLabel } from "@/lib/format";
import type { ConnectionStatus } from "@/lib/types";
import type { RefObject } from "react";

export function AppTopbar({
  plantName,
  connection,
  mobileNavOpen,
  onOpenNav,
  onAskAnalyst,
  askAnalystRef,
}: {
  plantName: string;
  connection: ConnectionStatus;
  mobileNavOpen: boolean;
  onOpenNav: () => void;
  onAskAnalyst: () => void;
  askAnalystRef?: RefObject<HTMLSpanElement | null>;
}) {
  const live = connection.sse === "live";
  const connectionLabel = liveConnectionLabel(connection.sse);

  return (
    <header className="forge-shell__topbar">
      <div className="forge-shell__topbar-start">
        <button
          type="button"
          className="forge-shell__menu-btn"
          aria-label="Open navigation"
          aria-expanded={mobileNavOpen}
          onClick={onOpenNav}
        >
          Menu
        </button>

        <div className="forge-shell__brand-lockup">
          <StampedLogo size={30} />
          <span className="forge-shell__brand-copy">
            <strong className="forge-shell__brand">Stamped</strong>
            <span className="forge-shell__brand-sub">{plantName}</span>
          </span>
        </div>
      </div>

      <div className="forge-shell__topbar-end">
        <span
          aria-live="polite"
          className={`forge-shell__live-pill ${live ? "forge-shell__live-pill--on" : "forge-shell__live-pill--off"}`}
          title={live ? "Live updates connected" : `${connectionLabel} — updates paused`}
        >
          <span className={`forge-pulse-dot${live ? "" : " forge-pulse-dot--muted"}`} aria-hidden />
          <span className="forge-shell__live-pill-text">{connectionLabel}</span>
        </span>

        <span ref={askAnalystRef} tabIndex={-1} className="forge-shell__cta-wrap">
          <button type="button" className="forge-shell__cta" onClick={onAskAnalyst}>
            <Sparkles size={15} strokeWidth={2.2} aria-hidden />
            Ask Analyst
          </button>
        </span>
      </div>
    </header>
  );
}
