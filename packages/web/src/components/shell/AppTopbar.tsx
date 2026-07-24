"use client";

import { Menu, Sparkles } from "@/components/ui/icons";
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
  const plantShort = plantName.split(",")[0]?.trim() ?? plantName;

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
          <Menu size={18} strokeWidth={2.2} />
        </button>

        <div className="forge-shell__brand">
          <StampedLogo size={28} />
          <div className="forge-shell__brand-text">
            <span className="forge-shell__brand-name">Stamped</span>
            <span className="forge-shell__brand-sep" aria-hidden>
              ·
            </span>
            <span className="forge-shell__brand-plant" title={plantName}>
              {plantShort}
            </span>
          </div>
        </div>
      </div>

      <div className="forge-shell__topbar-actions">
        <span
          aria-live="polite"
          className={`forge-shell__conn${live ? " is-live" : " is-stale"}`}
          title={live ? "Live updates connected" : `${connectionLabel} — updates paused`}
        >
          <span className="forge-shell__conn-dot" aria-hidden />
          <span className="forge-shell__conn-label">{connectionLabel}</span>
        </span>

        <span ref={askAnalystRef} tabIndex={-1}>
          <button
            type="button"
            className="forge-shell__analyst-btn"
            onClick={onAskAnalyst}
            aria-haspopup="dialog"
          >
            <Sparkles size={15} strokeWidth={2.2} aria-hidden />
            <span className="forge-shell__analyst-label">Ask Analyst</span>
          </button>
        </span>
      </div>
    </header>
  );
}
