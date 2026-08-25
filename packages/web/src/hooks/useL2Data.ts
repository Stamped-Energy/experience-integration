"use client";

import { useEffect, useState } from "react";
import { bffUrl, type DataSource } from "@/lib/bff";

export type L2Asset = {
  asset_id: string;
  name: string;
  level?: string;
  asset_class?: string;
};

export type L2MeasurementPoint = {
  ts: string;
  value: number;
  quality?: number;
};

export type UseL2AssetsResult = {
  assets: L2Asset[];
  source: DataSource;
  loading: boolean;
  loadError: string | null;
};

/**
 * Load L2 assets via BFF. When `getFixture` is omitted, failures yield
 * `source: "unavailable"` with an empty list (no silent demo data).
 */
export function useL2Assets(
  plantId: string,
  getFixture?: (plantId: string) => L2Asset[],
): UseL2AssetsResult {
  const [assets, setAssets] = useState<L2Asset[]>(() =>
    getFixture ? getFixture(plantId) : [],
  );
  const [source, setSource] = useState<DataSource>(
    getFixture ? "fixture" : "unavailable",
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fixtureRows = getFixture?.(plantId) ?? [];
    setAssets(fixtureRows);
    setSource(getFixture ? "fixture" : "unavailable");
    setLoading(true);
    setLoadError(null);

    async function loadLive() {
      try {
        const res = await fetch(
          bffUrl(`/api/l2/assets?plantId=${encodeURIComponent(plantId)}`),
          { credentials: "include", cache: "no-store" },
        );
        if (!res.ok) {
          if (!cancelled) {
            setLoadError(
              res.status === 401
                ? "Sign in to load live assets from L2."
                : res.status === 503
                  ? "L2 live path unavailable."
                  : "Could not load live assets.",
            );
            if (!getFixture) {
              setAssets([]);
              setSource("unavailable");
            }
          }
          return;
        }
        const body = (await res.json()) as {
          items?: L2Asset[];
          source?: string;
        };
        if (!cancelled && Array.isArray(body.items) && body.source === "l2") {
          setAssets(body.items);
          setSource("l2");
        } else if (!cancelled && !getFixture) {
          setAssets([]);
          setSource("unavailable");
        }
      } catch {
        if (!cancelled) {
          setLoadError("BFF unreachable.");
          if (!getFixture) {
            setAssets([]);
            setSource("unavailable");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadLive();
    return () => {
      cancelled = true;
    };
  }, [plantId, getFixture]);

  return { assets, source, loading, loadError };
}

export type UseL2MeasurementsResult = {
  points: L2MeasurementPoint[];
  source: DataSource;
  loading: boolean;
  loadError: string | null;
};

export function useL2Measurements(input: {
  plantId: string;
  assetId: string;
  metric: string;
  from: string;
  to: string;
  enabled?: boolean;
}): UseL2MeasurementsResult {
  const [points, setPoints] = useState<L2MeasurementPoint[]>([]);
  const [source, setSource] = useState<DataSource>("unavailable");
  const [loading, setLoading] = useState(Boolean(input.enabled));
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (input.enabled === false) {
      setLoading(false);
      setSource("unavailable");
      return;
    }
    let cancelled = false;
    setPoints([]);
    setSource("unavailable");
    setLoading(true);
    setLoadError(null);

    async function loadLive() {
      try {
        const qs = new URLSearchParams({
          plantId: input.plantId,
          assetId: input.assetId,
          metric: input.metric,
          from: input.from,
          to: input.to,
          granularity: "15min",
        });
        const res = await fetch(bffUrl(`/api/l2/measurements?${qs}`), {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) {
            setLoadError(
              res.status === 401
                ? "Sign in to load live measurements from L2."
                : "Could not load live measurements.",
            );
            setSource("unavailable");
          }
          return;
        }
        const body = (await res.json()) as {
          points?: L2MeasurementPoint[];
          source?: string;
        };
        if (!cancelled && Array.isArray(body.points) && body.source === "l2") {
          setPoints(body.points);
          setSource("l2");
        } else if (!cancelled) {
          setSource("unavailable");
        }
      } catch {
        if (!cancelled) {
          setLoadError("BFF unreachable.");
          setSource("unavailable");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadLive();
    return () => {
      cancelled = true;
    };
  }, [
    input.plantId,
    input.assetId,
    input.metric,
    input.from,
    input.to,
    input.enabled,
  ]);

  return { points, source, loading, loadError };
}
