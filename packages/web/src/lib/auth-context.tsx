"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  fetchSession,
  signInWithEmail,
  signOut as apiSignOut,
  type AuthUser,
} from "@/lib/auth-client";

type AuthContextValue = {
  user: AuthUser | null;
  /** Active org from plant membership; null if none. */
  orgId: string | null;
  /** Active plant UUID from BFF; null if none. */
  plantId: string | null;
  /** L6 product RBAC role (memberships.role). */
  membershipRole: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const PUBLIC_PATHS = new Set(["/login"]);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [plantId, setPlantId] = useState<string | null>(null);
  const [membershipRole, setMembershipRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await fetchSession();
      setUser(me?.user ?? null);
      setOrgId(me?.orgId ?? null);
      setPlantId(me?.plantId ?? null);
      setMembershipRole(me?.membershipRole ?? null);
    } catch {
      setUser(null);
      setOrgId(null);
      setPlantId(null);
      setMembershipRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await signInWithEmail(email, password);
      if (result.ok) {
        setLoading(true);
        await refresh();
      }
      return result;
    },
    [refresh],
  );

  const signOut = useCallback(async () => {
    await apiSignOut();
    setUser(null);
    setOrgId(null);
    setPlantId(null);
    setMembershipRole(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      orgId,
      plantId,
      membershipRole,
      loading,
      refresh,
      signIn,
      signOut,
    }),
    [user, orgId, plantId, membershipRole, loading, refresh, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

/**
 * Redirects unauthenticated users to /login. Login page is public.
 * E2E may set NEXT_PUBLIC_E2E_BYPASS_AUTH=true (Playwright / CI only).
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = pathname != null && PUBLIC_PATHS.has(pathname);
  const bypassAuth = process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === "true";

  useEffect(() => {
    if (bypassAuth || loading) return;
    if (!user && !isPublic) {
      const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
    }
    if (user && isPublic) {
      router.replace("/");
    }
  }, [bypassAuth, loading, user, isPublic, pathname, router]);

  if (bypassAuth) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "var(--forge-background)",
          color: "var(--forge-on-surface-variant)",
          fontFamily: "var(--forge-font-body)",
          fontSize: 14,
        }}
      >
        Checking session…
      </div>
    );
  }

  if (!user && !isPublic) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "var(--forge-background)",
          color: "var(--forge-on-surface-variant)",
          fontFamily: "var(--forge-font-body)",
          fontSize: 14,
        }}
      >
        Redirecting to sign in…
      </div>
    );
  }

  if (user && isPublic) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "var(--forge-background)",
          color: "var(--forge-on-surface-variant)",
          fontFamily: "var(--forge-font-body)",
          fontSize: 14,
        }}
      >
        Opening workspace…
      </div>
    );
  }

  return <>{children}</>;
}
