"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  composeNavTree,
  flattenNavTree,
  readOpenGroups,
  writeOpenGroups,
  type NavGroupId,
  type NavItem,
  type NavTree,
} from "@/lib/navigation";
import { NAV_GROUP_ICONS, NAV_ICONS } from "@/lib/nav-icons";
import { ChevronDown, ChevronRight } from "@/components/ui/icons";
import type { NavKey, Role } from "@/lib/types";

function NavLink({
  item,
  active,
  collapsed,
  nested,
  criticalAlarmCount,
  onNavigate,
}: {
  item: NavItem;
  active: NavKey;
  collapsed: boolean;
  nested?: boolean;
  criticalAlarmCount: number;
  onNavigate?: () => void;
}) {
  const Icon = NAV_ICONS[item.key];
  const isActive = active === item.key;
  const isLive = item.key === "live";

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      title={item.label}
      className={[
        "forge-shell__nav-link",
        nested ? "forge-shell__nav-link--nested" : "",
        isLive ? "forge-shell__nav-link--live" : "",
        isLive && isActive ? "forge-shell__nav-link--live-active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onNavigate}
    >
      <span className="forge-shell__nav-icon-wrap">
        <Icon size={nested ? 16 : 18} strokeWidth={isActive ? 2.4 : 2} aria-hidden />
        {isLive ? (
          <span className="forge-shell__nav-live-dot forge-pulse-dot" aria-hidden />
        ) : null}
      </span>
      {!collapsed ? (
        <>
          <span className="forge-shell__nav-label">{item.label}</span>
          {isLive ? (
            <span className="forge-shell__nav-live-tag" aria-hidden>
              Real-time
            </span>
          ) : null}
        </>
      ) : null}
      {!collapsed && item.key === "alarms" && criticalAlarmCount > 0 ? (
        <span className="tabular forge-shell__nav-badge" aria-label={`${criticalAlarmCount} critical`}>
          {criticalAlarmCount}
        </span>
      ) : null}
    </Link>
  );
}

function NavGroup({
  group,
  active,
  collapsed,
  open,
  onToggle,
  criticalAlarmCount,
  onNavigate,
}: {
  group: NavTree["groups"][number];
  active: NavKey;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
  criticalAlarmCount: number;
  onNavigate?: () => void;
}) {
  const GroupIcon = NAV_GROUP_ICONS[group.id];
  const hasActiveChild = group.items.some((item) => item.key === active);

  if (collapsed) {
    return (
      <>
        {group.items.map((item) => (
          <NavLink
            key={item.key}
            item={item}
            active={active}
            collapsed={collapsed}
            criticalAlarmCount={criticalAlarmCount}
            onNavigate={onNavigate}
          />
        ))}
      </>
    );
  }

  return (
    <div className={`forge-shell__nav-group${open ? " forge-shell__nav-group--open" : ""}`}>
      <button
        type="button"
        className="forge-shell__nav-group-trigger"
        aria-expanded={open}
        aria-controls={`nav-group-${group.id}`}
        data-active={hasActiveChild ? "true" : undefined}
        onClick={onToggle}
      >
        <GroupIcon size={18} strokeWidth={2} aria-hidden />
        <span className="forge-shell__nav-label">{group.label}</span>
        <span className="forge-shell__nav-chevron" aria-hidden>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </button>
      {open ? (
        <div id={`nav-group-${group.id}`} className="forge-shell__nav-sub">
          {group.items.map((item) => (
            <NavLink
              key={item.key}
              item={item}
              active={active}
              collapsed={false}
              nested
              criticalAlarmCount={criticalAlarmCount}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SidebarNav({
  role,
  pins,
  active,
  collapsed,
  criticalAlarmCount,
  forceOpenGroups = [],
  onNavigate,
}: {
  role: Role;
  pins: NavKey[];
  active: NavKey;
  collapsed: boolean;
  criticalAlarmCount: number;
  forceOpenGroups?: NavGroupId[];
  onNavigate?: () => void;
}) {
  const [persistedOpen, setPersistedOpen] = useState<NavGroupId[]>([]);
  const [expanded, setExpanded] = useState<Record<NavGroupId, boolean>>({} as Record<NavGroupId, boolean>);

  useEffect(() => {
    const storage = typeof window !== "undefined" ? window.localStorage : null;
    setPersistedOpen(readOpenGroups(storage));
  }, []);

  const tree = useMemo(
    () =>
      composeNavTree(role, pins, {
        active,
        persistedOpen,
        forceOpen: forceOpenGroups,
      }),
    [role, pins, active, persistedOpen, forceOpenGroups],
  );

  useEffect(() => {
    setExpanded((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const group of tree.groups) {
        if (next[group.id] === undefined) {
          next[group.id] = group.defaultOpen;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [tree]);

  function toggleGroup(id: NavGroupId) {
    setExpanded((prev) => {
      const nextOpen = !(prev[id] ?? tree.groups.find((g) => g.id === id)?.defaultOpen ?? false);
      const openIds = tree.groups
        .map((group) => group.id)
        .filter((groupId) => (groupId === id ? nextOpen : (prev[groupId] ?? false)));
      writeOpenGroups(typeof window !== "undefined" ? window.localStorage : null, openIds);
      setPersistedOpen(openIds);
      return { ...prev, [id]: nextOpen };
    });
  }

  if (collapsed) {
    const flat = flattenNavTree(tree);
    return (
      <>
        {flat.map((item) => (
          <NavLink
            key={item.key}
            item={item}
            active={active}
            collapsed
            criticalAlarmCount={criticalAlarmCount}
            onNavigate={onNavigate}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {tree.standalone.map((item) => (
        <NavLink
          key={item.key}
          item={item}
          active={active}
          collapsed={false}
          criticalAlarmCount={criticalAlarmCount}
          onNavigate={onNavigate}
        />
      ))}

      {tree.groups.length > 0 ? (
        <p className="forge-shell__nav-section" aria-hidden>
          Workspace
        </p>
      ) : null}

      {tree.groups.map((group) => (
        <NavGroup
          key={group.id}
          group={group}
          active={active}
          collapsed={false}
          open={expanded[group.id] ?? group.defaultOpen}
          onToggle={() => toggleGroup(group.id)}
          criticalAlarmCount={criticalAlarmCount}
          onNavigate={onNavigate}
        />
      ))}
    </>
  );
}
