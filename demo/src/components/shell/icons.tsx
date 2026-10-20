/** Line icons, 24 grid, 1.5 stroke, currentColor. One family for the whole product. */
import type { SVGProps } from "react";

const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
type P = SVGProps<SVGSVGElement>;

export const Icon = {
  home: (p: P) => <svg {...base} {...p}><path d="M4 11.2 12 4.5l8 6.7" /><path d="M7 10.2V19.5h10V10.2" /><path d="M10.5 19.5V15h3v4.5" /></svg>,
  inbox: (p: P) => <svg {...base} {...p}><path d="M7.5 6.5H19" /><rect x="4.5" y="8.5" width="15" height="11" rx="1.5" /><path d="M8 13h8M8 16h5" /></svg>,
  process: (p: P) => <svg {...base} {...p}><path d="M3.5 5h17" /><path d="M9.5 5v3.5h5V5" /><path d="M5 12h14" /><path d="M6.5 12v6.5M17.5 12v6.5" /><path d="M5 18.5h14" /></svg>,
  quality: (p: P) => <svg {...base} {...p}><path d="M6 3.5h8.2L19 8.2V20H6z" /><path d="M14.2 3.5V8.2H19" /><path d="m8.4 14.2 2.1 2.1 4.2-4.3" /></svg>,
  plant: (p: P) => <svg {...base} {...p}><path d="M3.5 20h17" /><path d="M5 20V11.5h4.2L12 7.5l2.8 4H19V20" /><path d="M10.2 20v-4.2h3.6V20" /></svg>,
  ask: (p: P) => <svg {...base} {...p}><path d="M5 5.5h14v9.5H10L6 18.5V15H5z" /><path d="M8.5 9.2h7M8.5 12h4.5" /></svg>,
  planning: (p: P) => <svg {...base} {...p}><path d="M4 7.5h2M8.5 7.5H16" /><path d="M4 12h2M8.5 12H19" /><path d="M4 16.5h2M8.5 16.5h6" /></svg>,
  settings: (p: P) => <svg {...base} {...p}><path d="M8 4.5v15M16 4.5v15" /><circle cx="8" cy="9" r="2.25" /><circle cx="16" cy="15" r="2.25" /></svg>,
  activity: (p: P) => <svg {...base} {...p}><path d="M4 18.5V5.5M4 18.5h16" /><path d="m7.5 14.5 3-4.5 3.2 2.2 4-6.2" /></svg>,
  search: (p: P) => <svg {...base} {...p}><circle cx="11" cy="11" r="6" /><path d="m20 20-4.5-4.5" /></svg>,
  close: (p: P) => <svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>,
  moon: (p: P) => <svg {...base} {...p}><path d="M16 4.8a7 7 0 1 0 3.6 12.4A7.6 7.6 0 0 1 16 4.8z" /></svg>,
  density: (p: P) => <svg {...base} {...p}><path d="M5 5.5h14M5 9h14M5 14.5h14M5 18h14" /></svg>,
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
