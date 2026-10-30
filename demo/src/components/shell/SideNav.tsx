"use client";

/**
 * Single product sidebar: global items + accordion Process / Quality groups.
 * Expanded ~232px; collapsible to icons with hover flyout for nested pages.
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { NAV, areaFor } from "@/lib/nav";
import { PROCESS_HUBS, QUALITY_HUBS } from "@/lib/module/hubs";
import { screenActive } from "@/lib/module/definitions";
import { countForScreen } from "@/lib/module/counts";
import { lastScreenHref, moduleFromPath, saveLastScreen } from "@/lib/module/last-screen";
import type { ModuleId } from "@/lib/module/types";
import { Icon } from "./icons";
import { StampedMark } from "./StampedMark";

const ICON: Record<string, (p: object) => ReactNode> = Icon as never;

const MODULE_KEY = "stamped-last-module";
const RAIL_KEY = "stamped-rail";

type HubScreen = { id: string; label: string; href: string };

const PROCESS_SCREENS: HubScreen[] = PROCESS_HUBS.map((h) => ({
  id: h.id,
  label: h.sidebarLabel,
  href: h.sidebarHref,
}));
const QUALITY_SCREENS: HubScreen[] = QUALITY_HUBS.map((h) => ({
  id: h.id,
  label: h.sidebarLabel,
  href: h.sidebarHref,
}));

function pendingActions(module: ModuleId): number {
  return countForScreen(module, "actions") ?? 0;
}

function readStoredModule(): ModuleId | null {
  try {
    const v = localStorage.getItem(MODULE_KEY);
    if (v === "process" || v === "quality") return v;
  } catch {
    /* ignore */
  }
  return null;
}

function writeStoredModule(m: ModuleId) {
  try {
    localStorage.setItem(MODULE_KEY, m);
  } catch {
    /* ignore */
  }
}

function isExpandedRail(): boolean {
  if (typeof document === "undefined") return true;
  return document.documentElement.dataset.rail !== "collapsed";
}

function setRailExpanded(expanded: boolean, persist = true) {
  document.documentElement.dataset.rail = expanded ? "expanded" : "collapsed";
  if (!persist) return;
  try {
    localStorage.setItem(RAIL_KEY, expanded ? "expanded" : "collapsed");
  } catch {
    /* ignore */
  }
}

export function SideNav({ inboxCount }: { inboxCount: number }) {
  const path = usePathname();
  const router = useRouter();
  const area = areaFor(path);
  const pathModule = moduleFromPath(path);

  const [openModule, setOpenModule] = useState<ModuleId | null>(pathModule ?? "process");
  const [expanded, setExpanded] = useState(true);
  const [flyout, setFlyout] = useState<ModuleId | null>(null);
  const [flyoutPos, setFlyoutPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const flyoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const plantForced = useRef(false);
  const prefBeforePlant = useRef<boolean | null>(null);

  // Sync open module from path; remember last module
  useEffect(() => {
    if (pathModule) {
      setOpenModule(pathModule);
      writeStoredModule(pathModule);
      saveLastScreen(pathModule, path);
    } else {
      const stored = readStoredModule();
      if (stored) setOpenModule(stored);
    }
  }, [path, pathModule]);

  // Rail expand state + auto-collapse on Process plant
  useEffect(() => {
    const onPlant = path === "/process/line";
    if (onPlant) {
      if (!plantForced.current) {
        prefBeforePlant.current = isExpandedRail();
        plantForced.current = true;
        setRailExpanded(false, false);
        setExpanded(false);
      }
    } else if (plantForced.current) {
      plantForced.current = false;
      const restore = prefBeforePlant.current ?? true;
      setRailExpanded(restore);
      setExpanded(restore);
      prefBeforePlant.current = null;
    } else {
      setExpanded(isExpandedRail());
    }
  }, [path]);

  useEffect(() => {
    setExpanded(isExpandedRail());
  }, []);

  const toggleRail = () => {
    const next = !expanded;
    plantForced.current = false;
    setRailExpanded(next);
    setExpanded(next);
  };

  const openGroup = useCallback(
    (m: ModuleId, navigate: boolean) => {
      setOpenModule(m);
      writeStoredModule(m);
      if (navigate) {
        const fallback = m === "process" ? "/process/proposals" : "/quality/actions";
        router.push(lastScreenHref(m, fallback));
      }
    },
    [router],
  );

  const onGroupHeaderClick = (m: ModuleId) => {
    if (!expanded) {
      // collapsed: navigate into module / toggle flyout
      openGroup(m, true);
      setFlyout((f) => (f === m ? null : m));
      return;
    }
    if (openModule === m) {
      // accordion: clicking open header navigates to last screen; keep open
      openGroup(m, true);
      return;
    }
    openGroup(m, true);
  };

  const showFlyout = (m: ModuleId, el?: HTMLElement | null) => {
    if (expanded) return;
    if (flyoutTimer.current) clearTimeout(flyoutTimer.current);
    const anchor = el ?? null;
    if (anchor) {
      const r = anchor.getBoundingClientRect();
      setFlyoutPos({ top: r.top, left: r.right + 6 });
    }
    setFlyout(m);
  };
  const hideFlyout = () => {
    if (flyoutTimer.current) clearTimeout(flyoutTimer.current);
    flyoutTimer.current = setTimeout(() => setFlyout(null), 180);
  };

  const globalTop = NAV.filter((n) => n.group === 1 && n.key !== "process" && n.key !== "quality");
  const globalBottom = NAV.filter((n) => n.group === 2 && !n.soon);

  const labelFor = (key: string, label: string) => (key === "home" ? "Overview" : label);

  const globalLink = (n: (typeof NAV)[number]) => (
    <Link
      key={n.key}
      href={n.href}
      className="side-item"
      aria-current={area === n.key ? "page" : undefined}
      aria-label={labelFor(n.key, n.label)}
    >
      {ICON[n.key]?.({}) ?? null}
      <span className="side-label">{labelFor(n.key, n.label)}</span>
      {n.key === "inbox" && inboxCount > 0 ? <span className="side-badge">{inboxCount}</span> : null}
      <span className="side-tip">{labelFor(n.key, n.label)}</span>
    </Link>
  );

  const renderScreens = (module: ModuleId, screens: HubScreen[], inFlyout = false) => (
    <ul className={inFlyout ? "side-flyout-list" : "side-sub"} role="list">
      {screens.map((s) => {
        const active = screenActive(s.href, path);
        const n = countForScreen(module, s.id);
        return (
          <li key={s.id}>
            <Link
              href={s.href}
              className="side-sub-item"
              aria-current={active ? "page" : undefined}
              onClick={() => {
                writeStoredModule(module);
                setFlyout(null);
              }}
            >
              <span>{s.label}</span>
              {n ? <span className="side-badge side-badge-muted">{n}</span> : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const moduleGroup = (m: ModuleId, label: string, screens: HubScreen[]) => {
    const open = openModule === m;
    const count = pendingActions(m);
    const inModule = pathModule === m;
    return (
      <div
        key={m}
        className={`side-group${open && expanded ? " is-open" : ""}${inModule ? " is-active" : ""}`}
        onMouseEnter={(e) => showFlyout(m, e.currentTarget)}
        onMouseLeave={hideFlyout}
      >
        <button
          type="button"
          className="side-item side-group-btn"
          aria-expanded={expanded ? open : flyout === m}
          aria-controls={expanded ? `side-sub-${m}` : undefined}
          onClick={() => onGroupHeaderClick(m)}
        >
          {ICON[m]?.({}) ?? null}
          <span className="side-label">{label}</span>
          {count > 0 ? <span className="side-badge">{count}</span> : null}
          <span className={`side-chev${open && expanded ? " is-open" : ""}`} aria-hidden>
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="side-tip">{label}</span>
        </button>
        {expanded && open ? (
          <div id={`side-sub-${m}`} className="side-sub-wrap">
            {renderScreens(m, screens)}
          </div>
        ) : null}
        {!expanded && flyout === m ? (
          <div
            className="side-flyout"
            role="menu"
            aria-label={`${label} pages`}
            style={{ top: flyoutPos.top, left: flyoutPos.left }}
            onMouseEnter={() => showFlyout(m)}
            onMouseLeave={hideFlyout}
          >
            <div className="side-flyout-head">{label}</div>
            {renderScreens(m, screens, true)}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <nav className="side" id="app-rail" aria-label="Product">
      <Link href="/" className="side-mark" aria-label="Stamped home">
        <StampedMark size={28} />
        <span className="side-mark-word">Stamped</span>
      </Link>

      <div className="side-section">
        {globalTop.map(globalLink)}
      </div>

      <div className="side-sep" role="separator" />

      <div className="side-section side-modules">
        {moduleGroup("process", "Process", PROCESS_SCREENS)}
        {moduleGroup("quality", "Quality", QUALITY_SCREENS)}
      </div>

      <div className="side-sep" role="separator" />

      <div className="side-section">{globalBottom.map(globalLink)}</div>

      <div className="side-spacer" />

      <DisplayToggles />
      <button
        type="button"
        className="side-item side-collapse"
        aria-expanded={expanded}
        aria-controls="app-rail"
        aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        onClick={toggleRail}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="4" y="5" width="16" height="14" rx="1.5" />
          <path d="M9 5v14" />
          <path className={`side-collapse-chev${expanded ? " is-expanded" : ""}`} d="m13 10 2 2-2 2" />
        </svg>
        <span className="side-label">{expanded ? "Collapse" : "Expand"}</span>
      </button>
    </nav>
  );
}

function DisplayToggles() {
  const [theme, setTheme] = useState("light");
  const [density, setDensity] = useState("comfortable");
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme ?? "light");
    setDensity(document.documentElement.dataset.density ?? "comfortable");
  }, []);
  const flip = (k: "theme" | "density", v: string) => {
    document.documentElement.dataset[k] = v;
    localStorage.setItem(`stamped-${k}`, v);
    (k === "theme" ? setTheme : setDensity)(v);
  };
  return (
    <>
      <button
        type="button"
        className="side-item"
        aria-pressed={density === "compact"}
        aria-label="Compact density for panel PCs"
        onClick={() => flip("density", density === "compact" ? "comfortable" : "compact")}
      >
        <Icon.density />
        <span className="side-label">{density === "compact" ? "Comfortable" : "Compact"}</span>
        <span className="side-tip">{density === "compact" ? "Comfortable density" : "Compact density"}</span>
      </button>
      <button
        type="button"
        className="side-item"
        aria-pressed={theme === "dark"}
        aria-label="Dark theme for panel PCs"
        onClick={() => flip("theme", theme === "dark" ? "light" : "dark")}
      >
        <Icon.moon />
        <span className="side-label">{theme === "dark" ? "Light theme" : "Dark theme"}</span>
        <span className="side-tip">{theme === "dark" ? "Light theme" : "Dark theme"}</span>
      </button>
    </>
  );
}
