"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { roles } from "@/lib/demo/data";
import type { RoleId } from "@/lib/demo/types";
import { DEFAULT_ROLE, ROLE_COOKIE, parseRoleId } from "@/lib/role";

const RoleContext = createContext<{
  role: RoleId;
  setRole: (role: RoleId) => void;
} | null>(null);

function readRoleCookie(): RoleId {
  if (typeof document === "undefined") return DEFAULT_ROLE;
  const m = document.cookie.match(new RegExp(`${ROLE_COOKIE}=([^;]+)`));
  return parseRoleId(m?.[1] ?? null);
}

/** Consume a valid `?as=<role>` once: set the role cookie and drop the param from the URL. */
function consumeAsParam(setRole: (role: RoleId) => void) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const raw = url.searchParams.get("as");
  if (!raw || !roles.some((r) => r.id === raw)) return;
  setRole(parseRoleId(raw));
  url.searchParams.delete("as");
  const qs = url.searchParams.toString();
  window.history.replaceState(null, "", `${url.pathname}${qs ? `?${qs}` : ""}${url.hash}`);
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<RoleId>(DEFAULT_ROLE);
  const setRole = useCallback((next: RoleId) => {
    document.cookie = `${ROLE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.dataset.role = next;
    const main = document.querySelector<HTMLElement>(".main");
    if (main) main.dataset.role = next;
    setRoleState(next);
  }, []);

  useEffect(() => {
    consumeAsParam(setRole);
    const r = readRoleCookie();
    setRoleState(r);
    document.documentElement.dataset.role = r;
    const main = document.querySelector<HTMLElement>(".main");
    if (main) main.dataset.role = r;
  }, [setRole]);

  const value = useMemo(() => ({ role, setRole }), [role, setRole]);
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleId {
  const ctx = useContext(RoleContext);
  return ctx?.role ?? DEFAULT_ROLE;
}

export function useSetRole(): (role: RoleId) => void {
  const ctx = useContext(RoleContext);
  return ctx?.setRole ?? (() => {});
}
