"use client";

import { useEffect, useState } from "react";
import {
  createLiveTelemetryBaseline,
  tickLiveTelemetry,
  type LiveTelemetrySnapshot,
} from "@/lib/live-telemetry";

const POLL_MS = 1000;

export function useLiveTelemetry(enabled = true): LiveTelemetrySnapshot {
  const [snapshot, setSnapshot] = useState<LiveTelemetrySnapshot>(() => createLiveTelemetryBaseline());

  useEffect(() => {
    if (!enabled) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }

    const id = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      setSnapshot((prev) => tickLiveTelemetry(prev));
    }, POLL_MS);

    return () => window.clearInterval(id);
  }, [enabled]);

  return snapshot;
}
