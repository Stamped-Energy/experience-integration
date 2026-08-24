"use client";

import { useEffect } from "react";

const VITALS = new Set(["LCP", "INP", "CLS"]);

/** Reports Core Web Vitals to BFF allowlisted telemetry - no PII. */
export function WebVitalsReporter({
  plantId,
  role,
}: {
  plantId?: string;
  role?: string;
}) {
  useEffect(() => {
    if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") {
      return;
    }

    const endpoint = process.env.NEXT_PUBLIC_BFF_URL
      ? `${process.env.NEXT_PUBLIC_BFF_URL}/api/telemetry`
      : "/api/telemetry";

    function send(name: string, value: number) {
      const event_name =
        name === "LCP"
          ? "web_vital_lcp"
          : name === "INP"
            ? "web_vital_inp"
            : "web_vital_cls";
      void fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          event_name,
          plant_id: plantId,
          role,
          properties: { value, unit: name === "CLS" ? "score" : "ms", route: location.pathname },
        }),
        keepalive: true,
      }).catch(() => {
        /* swallow - telemetry must never break UX */
      });
    }

    try {
      const po = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "largest-contentful-paint") {
            send("LCP", entry.startTime);
          }
        }
      });
      po.observe({ type: "largest-contentful-paint", buffered: true });
      return () => po.disconnect();
    } catch {
      return;
    }
  }, [plantId, role]);

  return null;
}

void VITALS;
