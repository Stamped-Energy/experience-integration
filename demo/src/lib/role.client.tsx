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

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<RoleId>(DEFAULT_ROLE);
  useEffect(() => {
    const r = readRoleCookie();
    setRoleState(r);
    document.documentElement.dataset.role = r;
    const main = document.querySelector<HTMLElement>(".main");
    if (main) main.dataset.role = r;
  }, []);

  const setRole = useCallback((next: RoleId) => {
    document.cookie = `${ROLE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.dataset.role = next;
    const main = document.querySelector<HTMLElement>(".main");
    if (main) main.dataset.role = next;
    setRoleState(next);
  }, []);

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
