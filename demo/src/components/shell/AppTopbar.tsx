"use client";

import { Menu, StampedMark } from "@/components/ui/icons";
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
  askAnalystRef?: RefObject<HTMLButtonElement | null>;
  /** @deprecated Plant switching is staff-only under Settings → Admin. */
  plants?: Array<{ id: string; name: string }>;
  activePlantId?: string;
  onPlantChange?: (plantId: string) => void;
}) {
  const live = connection.sse === "live";
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
          <StampedMark size={22} className="forge-shell__logo" />
          <span className="forge-shell__brand-name">Stamped</span>
        </div>

        <span
          className="forge-shell__plant-chip"
          title={`${plantName} · ${liveConnectionLabel(connection.sse)}`}
          aria-live="polite"
        >
          <span className={`forge-shell__conn-dot${live ? " is-live" : ""}`} aria-hidden />
          {plantShort}
        </span>
      </div>

      <button
        ref={askAnalystRef}
        type="button"
        className="forge-shell__analyst-btn"
        onClick={onAskAnalyst}
        aria-haspopup="dialog"
      >
        <StampedMark size={15} aria-hidden />
        <span className="forge-shell__analyst-label">Ask Stamped</span>
      </button>
    </header>
  );
}
