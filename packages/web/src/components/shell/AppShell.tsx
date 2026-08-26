"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { mobileDock, readCollapsed, readPins, writeCollapsed } from "@/lib/navigation";
import { NAV_ICONS } from "@/lib/nav-icons";
import {
  Factory,
  PanelLeftClose,
  PanelLeftOpen,
} from "@/components/ui/icons";
import type { ConnectionStatus, NavKey, Role } from "@/lib/types";
import { Sheet } from "@/components/ui/primitives";
import { ContextualAnalyst } from "@/components/analyst/ContextualAnalyst";
import { WebVitalsReporter } from "@/components/telemetry/WebVitalsReporter";
import { SidebarNav } from "@/components/shell/SidebarNav";
import { AppTopbar } from "@/components/shell/AppTopbar";
import { DEMO_PLANT, LNM_PLANT, PLANTS } from "@/lib/plant-catalog";
import { DEMO_BANNER_COPY, DEMO_SESSION_BANNER_COPY } from "@/lib/client-copy";
import { isDemoSessionActive } from "@/lib/demo-session";
import { usePlant } from "@/lib/plant-context";
import { useDataSource } from "@/lib/data-source-context";

function sseMeta(connection: ConnectionStatus): {
  label: string;
  live: boolean;
  banner: string | null;
} {
  if (connection.sse === "live") {
    return { label: "Live", live: true, banner: null };
  }
  if (connection.sse === "reconnecting") {
    return {
      label: "Reconnecting",
      live: false,
      banner:
        "Live updates paused - reconnecting. Actions still work; lists may be stale.",
    };
  }
  return {
    label: "Offline",
    live: false,
    banner:
      "Live updates offline. Actions still work; lists may be stale until the stream returns.",
  };
}

export function AppShell({
  active,
  plantName,
  plantId = LNM_PLANT.plantId,
  plants,
  onPlantChange,
  role,
  connection,
  screenTitle,
  contextSummary,
  focusEntity,
  criticalAlarmCount,
  children,
}: {
  active: NavKey;
  plantName: string;
  /** Active plant external id - drives telemetry + analyst envelope scope. */
  plantId?: string;
  /** When provided (and > 1 entry), AppTopbar renders a plant switcher. */
  plants?: Array<{ id: string; name: string }>;
  onPlantChange?: (plantId: string) => void;
  role: Role;
  connection: ConnectionStatus;
  screenTitle: string;
  contextSummary: string[];
  focusEntity?: {
    type: "alarm" | "prescription" | "asset" | "ledger_entry";
    id: string;
  };
  criticalAlarmCount: number;
  children: React.ReactNode;
}) {
  const plantCtx = usePlant();
  const isDemoSession = isDemoSessionActive();
  const {
    demoMode,
    bannerDismissed,
    dismissBanner,
    probe,
  } = useDataSource();
  const [analystOpen, setAnalystOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [pins, setPins] = useState<NavKey[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const askAnalystRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const storage = typeof window !== "undefined" ? window.localStorage : null;
    setPins(readPins(storage));
    setCollapsed(readCollapsed(storage));
  }, []);

  // Facility label follows active plant (client is single-plant; staff switch is under Admin).
  const shellPlantId = plants && plants.length > 0 ? plantId : plantCtx.activePlantId;
  const shellPlantName =
    plants && plants.length > 0 ? plantName : plantCtx.activePlant.plantName;
  const contentKey = `${shellPlantId}:${plantCtx.plantEpoch}`;

  const dock = useMemo(() => mobileDock(role, pins), [role, pins]);
  const sse = useMemo(() => sseMeta(connection), [connection]);
  const forceOpenGroups = criticalAlarmCount > 0 ? (["operations"] as const) : [];

  function onToggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    writeCollapsed(typeof window !== "undefined" ? window.localStorage : null, next);
  }

  const desktopNav = (
    <SidebarNav
      role={role}
      pins={pins}
      active={active}
      collapsed={collapsed}
      criticalAlarmCount={criticalAlarmCount}
      forceOpenGroups={[...forceOpenGroups]}
    />
  );

  const mobileNav = (
    <SidebarNav
      role={role}
      pins={pins}
      active={active}
      collapsed={false}
      criticalAlarmCount={criticalAlarmCount}
      forceOpenGroups={[...forceOpenGroups]}
      onNavigate={() => setMobileNavOpen(false)}
    />
  );

  return (
    <div
      className={`forge-shell${collapsed ? " forge-shell--collapsed" : ""}`}
      data-breakpoint-desktop="900px"
    >
      <WebVitalsReporter plantId={shellPlantId} role={role} />
      <a className="forge-shell__skip" href="#forge-main">
        Skip to main content
      </a>

      <AppTopbar
        plantName={shellPlantName}
        connection={connection}
        mobileNavOpen={mobileNavOpen}
        onOpenNav={() => setMobileNavOpen(true)}
        onAskAnalyst={() => setAnalystOpen(true)}
        askAnalystRef={askAnalystRef}
      />

      <div className="forge-shell__body">
        <nav
          aria-label="Primary"
          className="forge-shell__sidebar"
          data-shell="desktop-nav"
        >
          {!collapsed ? (
            <div className="forge-shell__facility">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Factory size={18} color="var(--forge-primary)" aria-hidden />
                <span className="forge-shell__facility-name">
                  {shellPlantName.split(",")[0] ?? shellPlantName}
                </span>
              </div>
              <p className="forge-shell__facility-meta">{shellPlantName}</p>
              <span className="forge-chip forge-chip--primary" style={{ marginTop: 8 }}>
                115 MW Peak Load
              </span>
            </div>
          ) : null}

          <div className="forge-shell__nav-scroll forge-scroll-thin">{desktopNav}</div>

          <button
            type="button"
            className="forge-shell__collapse"
            aria-label={collapsed ? "Expand navigation" : "Minimize navigation"}
            aria-pressed={collapsed}
            onClick={onToggleCollapse}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            {!collapsed ? <span>Minimize</span> : null}
          </button>

          {!collapsed ? (
            <p className="forge-shell__role">Role: {role.replaceAll("_", " ")}</p>
          ) : null}
        </nav>

        <main id="forge-main" className="forge-shell__main" tabIndex={-1}>
          {sse.banner ? (
            <div role="status" className="forge-shell__banner">
              {sse.banner}
            </div>
          ) : null}
          {isDemoSession ? (
            <div
              role="status"
              className="forge-shell__banner forge-shell__banner--demo"
              data-demo-session-banner
            >
              <span>{DEMO_SESSION_BANNER_COPY}</span>
            </div>
          ) : demoMode && !bannerDismissed ? (
            <div
              role="status"
              className="forge-shell__banner forge-shell__banner--demo"
              data-demo-data-banner
            >
              <span>{DEMO_BANNER_COPY}</span>
              <button
                type="button"
                className="forge-shell__banner-dismiss"
                onClick={dismissBanner}
              >
                Dismiss
              </button>
            </div>
          ) : null}
          <div className="forge-shell__content" key={contentKey}>
            {children}
          </div>
        </main>
      </div>

      <nav aria-label="Mobile primary" className="forge-shell__dock" data-shell="mobile-dock">
        {dock.map((item) => {
          const Icon = NAV_ICONS[item.key];
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active === item.key ? "page" : undefined}
            >
              <Icon size={16} aria-hidden />
              <span>{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>

      <Sheet open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} title="Navigate">
        <nav aria-label="Mobile full" className="forge-shell__mobile-nav">
          {mobileNav}
          <p style={{ marginTop: 16, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
            Role: {role.replaceAll("_", " ")} · {shellPlantName}
          </p>
        </nav>
      </Sheet>

      <ContextualAnalyst
        open={analystOpen}
        onClose={() => setAnalystOpen(false)}
        returnFocusRef={askAnalystRef}
        envelope={{
          orgId:
            PLANTS.find((p) => p.plantId === shellPlantId)?.orgId ?? DEMO_PLANT.orgId,
          plantId: shellPlantId,
          userId: "user_demo",
          role,
          routeId: active,
          screenTitle,
          focusEntity,
          visibleSummary: contextSummary,
        }}
      />
    </div>
  );
}
