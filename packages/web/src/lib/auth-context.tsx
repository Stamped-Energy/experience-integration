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
import {
  clearDemoSession,
  demoUser,
  DEMO_PLANT_ID,
  enableDemoSession,
  isDemoCredentials,
  isDemoSessionActive,
  readDemoSession,
} from "@/lib/demo-session";

type AuthContextValue = {
  user: AuthUser | null;
  /** Active org from plant membership; null if none. */
  orgId: string | null;
  /** Active plant UUID from BFF; null if none. */
  plantId: string | null;
  /** L6 product RBAC role (memberships.role). */
  membershipRole: string | null;
  /** Hardcoded demo login — no BFF, Jaipur fixtures only. */
  isDemoSession: boolean;
  /** BFF session check failed (network / server error). */
  sessionError: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const PUBLIC_PATHS = new Set(["/login"]);

function applyDemoSession(setters: {
  setUser: (u: AuthUser | null) => void;
  setOrgId: (v: string | null) => void;
  setPlantId: (v: string | null) => void;
  setMembershipRole: (v: string | null) => void;
  setIsDemoSession: (v: boolean) => void;
  setSessionError: (v: string | null) => void;
}) {
  const session = readDemoSession();
  if (!session) return false;
  setters.setUser(demoUser());
  setters.setOrgId(session.orgId);
  setters.setPlantId(session.plantId);
  setters.setMembershipRole(session.role);
  setters.setIsDemoSession(true);
  setters.setSessionError(null);
  return true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [plantId, setPlantId] = useState<string | null>(null);
  const [membershipRole, setMembershipRole] = useState<string | null>(null);
  const [isDemoSession, setIsDemoSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (isDemoSessionActive()) {
      applyDemoSession({
        setUser,
        setOrgId,
        setPlantId,
        setMembershipRole,
        setIsDemoSession,
        setSessionError,
      });
      setLoading(false);
      return;
    }

    setIsDemoSession(false);
    const result = await fetchSession();
    if (result.kind === "authenticated") {
      setUser(result.data.user);
      setOrgId(result.data.orgId ?? null);
      setPlantId(result.data.plantId ?? null);
      setMembershipRole(result.data.membershipRole ?? null);
      setSessionError(null);
    } else if (result.kind === "unauthenticated") {
      setUser(null);
      setOrgId(null);
      setPlantId(null);
      setMembershipRole(null);
      setSessionError(null);
    } else {
      setUser(null);
      setOrgId(null);
      setPlantId(null);
      setMembershipRole(null);
      setSessionError(result.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (isDemoCredentials(email, password)) {
        enableDemoSession();
        applyDemoSession({
          setUser,
          setOrgId,
          setPlantId,
          setMembershipRole,
          setIsDemoSession,
          setSessionError,
        });
        setLoading(false);
        return { ok: true as const };
      }

      clearDemoSession();
      setIsDemoSession(false);
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
    const wasDemo = isDemoSessionActive();
    clearDemoSession();
    if (!wasDemo) {
      await apiSignOut();
    }
    setUser(null);
    setOrgId(null);
    setPlantId(null);
    setMembershipRole(null);
    setIsDemoSession(false);
    setSessionError(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      orgId,
      plantId,
      membershipRole,
      isDemoSession,
      sessionError,
      loading,
      refresh,
      signIn,
      signOut,
    }),
    [
      user,
      orgId,
      plantId,
      membershipRole,
      isDemoSession,
      sessionError,
      loading,
      refresh,
      signIn,
      signOut,
    ],
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

/** Playwright / offline shell — set at Next build time for browser-e2e CI. */
const E2E_BYPASS_AUTH =
  process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === "1" ||
  process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === "true";

/**
 * Redirects unauthenticated users to /login. Login page is public.
 * E2E may set NEXT_PUBLIC_E2E_BYPASS_AUTH=true (Playwright / CI only).
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading, sessionError } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = pathname != null && PUBLIC_PATHS.has(pathname);

  useEffect(() => {
    if (E2E_BYPASS_AUTH || loading) return;
    if (!user && !isPublic) {
      const next =
        pathname && pathname !== "/"
          ? `?next=${encodeURIComponent(pathname)}`
          : "";
      const err = sessionError
        ? `&error=${encodeURIComponent(sessionError)}`
        : "";
      router.replace(`/login${next}${err}`);
    }
    if (user && isPublic) {
      router.replace("/");
    }
  }, [loading, user, isPublic, pathname, router, sessionError]);

  if (E2E_BYPASS_AUTH) {
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

export { DEMO_PLANT_ID };
