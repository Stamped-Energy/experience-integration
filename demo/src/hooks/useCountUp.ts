"use client";

import { useEffect, useRef, useState } from "react";

/** Smoothly animates a number to `target`; re-runs whenever target changes. */
export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      fromRef.current = target;
      return;
    }

    const from = fromRef.current;
    const delta = target - from;
    if (delta === 0) return;

    let frame = 0;
    const startRef = { at: 0 };

    const tick = (now: number) => {
      if (startRef.at === 0) startRef.at = now;
      const t = Math.min(1, (now - startRef.at) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setValue(from + delta * eased);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}
