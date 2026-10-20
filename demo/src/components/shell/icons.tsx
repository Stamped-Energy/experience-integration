/** Line icons, 24 grid, 1.5 stroke, currentColor. One family for the whole product. */
import type { SVGProps } from "react";

const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
type P = SVGProps<SVGSVGElement>;

export const Icon = {
  home: (p: P) => <svg {...base} {...p}><path d="M3 10.5 12 4l9 6.5" /><path d="M5 9.5V20h14V9.5" /><path d="M10 20v-5h4v5" /></svg>,
  inbox: (p: P) => <svg {...base} {...p}><path d="M4 13h4l1.5 2.5h5L16 13h4" /><path d="M5.5 5h13L21 13v6H3v-6z" /></svg>,
  process: (p: P) => <svg {...base} {...p}><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.3 10.9 15.7 7.1M8.3 13.1l7.4 3.8" /></svg>,
  quality: (p: P) => <svg {...base} {...p}><path d="M12 3 4.5 6v5.5c0 4.5 3.2 8.2 7.5 9.5 4.3-1.3 7.5-5 7.5-9.5V6z" /><path d="m9 12 2 2 4-4" /></svg>,
  plant: (p: P) => <svg {...base} {...p}><path d="M3 20V10l5 3V10l5 3V6l8 4v10z" /><path d="M3 20h18" /></svg>,
  ask: (p: P) => <svg {...base} {...p}><path d="M4 5h16v11H9l-5 4z" /><path d="M9 10h6" /></svg>,
  planning: (p: P) => <svg {...base} {...p}><rect x="3.5" y="5" width="17" height="15" rx="1.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>,
  settings: (p: P) => <svg {...base} {...p}><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>,
  activity: (p: P) => <svg {...base} {...p}><path d="M3 12h4l2.5-6 5 12L17 12h4" /></svg>,
  search: (p: P) => <svg {...base} {...p}><circle cx="11" cy="11" r="6" /><path d="m20 20-4.5-4.5" /></svg>,
  close: (p: P) => <svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>,
  moon: (p: P) => <svg {...base} {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>,
  density: (p: P) => <svg {...base} {...p}><path d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  stop: (p: P) => <svg {...base} {...p}><rect x="6" y="6" width="12" height="12" rx="1" /></svg>,
  arrow: (p: P) => <svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  check: (p: P) => <svg {...base} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>,
  lock: (p: P) => <svg {...base} {...p}><rect x="5" y="11" width="14" height="9" rx="1.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>,
};

export function StampedMark() {
  return (
    <svg viewBox="0 0 24 24" aria-label="Stamped">
      <rect x="3" y="3" width="18" height="18" rx="4" fill="var(--accent-500)" />
      <path d="M8 15.5c1 .9 2.4 1.4 4 1.4 2 0 3.3-.9 3.3-2.3 0-3.2-6.9-1.9-6.9-5.4 0-1.3 1.3-2.3 3.3-2.3 1.4 0 2.6.4 3.5 1.1" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
