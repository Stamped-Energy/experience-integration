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
import { bffUrl, type UpstreamProbe } from "@/lib/bff";
import { connectionPillLabel } from "@/lib/client-copy";
import { getDemoUpstreamProbe } from "@/lib/demo-data";
import { useAuth } from "@/lib/auth-context";
import { usePlant } from "@/lib/plant-context";

type DataSourceContextValue = {
  probe: UpstreamProbe | null;
  loading: boolean;
  /** True when L2 or L5 (when expected live) is not reachable. */
  demoMode: boolean;
  bannerDismissed: boolean;
  dismissBanner: () => void;
  refresh: () => void;
};

const DataSourceContext = createContext<DataSourceContextValue | null>(null);

const POLL_MS = 15_000;

export function DataSourceProvider({ children }: { children: ReactNode }) {
  const { isDemoSession } = useAuth();
  const { activePlantId: plantId, plantEpoch } = usePlant();
  const [probe, setProbe] = useState<UpstreamProbe | null>(null);
  const [loading, setLoading] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const refresh = useCallback(() => {
    if (isDemoSession) {
      setProbe(getDemoUpstreamProbe());
      setLoading(false);
      return;
    }
    const url = bffUrl(
      `/api/meta/upstreams?plantId=${encodeURIComponent(plantId)}`,
    );
    void fetch(url, { credentials: "include", cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`upstream probe ${res.status}`);
        return (await res.json()) as UpstreamProbe;
      })
      .then((data) => {
        setProbe(data);
        setLoading(false);
        if (data.demoMode) setBannerDismissed(false);
      })
      .catch(() => {
        setProbe({
          l2: "down",
          l5: "down",
          l4: "off",
          plantId,
          orgId: "org_acme",
          checkedAt: new Date().toISOString(),
          demoMode: true,
          detail: { l2: "probe failed", l5: "probe failed" },
        });
        setLoading(false);
      });
  }, [isDemoSession, plantId]);

  useEffect(() => {
    setProbe(null);
    setLoading(true);
    setBannerDismissed(false);
    refresh();
    if (isDemoSession) return;
    const id = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh, plantEpoch, isDemoSession]);

  const value = useMemo<DataSourceContextValue>(
    () => ({
      probe,
      loading,
      demoMode: probe?.demoMode ?? true,
      bannerDismissed,
      dismissBanner: () => setBannerDismissed(true),
      refresh,
    }),
    [probe, loading, bannerDismissed, refresh],
  );

  return (
    <DataSourceContext.Provider value={value}>
      {children}
    </DataSourceContext.Provider>
  );
}

export function useDataSource(): DataSourceContextValue {
  const ctx = useContext(DataSourceContext);
  if (!ctx) {
    return {
      probe: null,
      loading: false,
      demoMode: false,
      bannerDismissed: true,
      dismissBanner: () => undefined,
      refresh: () => undefined,
    };
  }
  return ctx;
}

export function upstreamPillLabel(probe: UpstreamProbe | null): string {
  return connectionPillLabel(probe);
}
