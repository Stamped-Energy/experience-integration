/** Minimal stroke icons — ponytail: avoid lucide dep while registry hangs. */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number };

export type { IconProps };

function Icon({ size = 18, strokeWidth = 2, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

export function LayoutDashboard(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </Icon>
  );
}
export function BarChart3(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M3 3v18h18" />
      <path d="M7 16v-5" />
      <path d="M12 16V8" />
      <path d="M17 16v-9" />
    </Icon>
  );
}
export function Activity(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </Icon>
  );
}
export function AlertTriangle(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Icon>
  );
}
export function ClipboardList(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </Icon>
  );
}
export function Map(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M14.1 4.1 9 6.2 3.9 4.1A1 1 0 0 0 2.5 5v13.4a1 1 0 0 0 1.4.9L9 17.2l5.1 2.1a1 1 0 0 0 .8 0L20.5 17a1 1 0 0 0 .5-.9V2.7a1 1 0 0 0-1.4-.9L15 3.9a1 1 0 0 1-.9.2Z" />
      <path d="M9 6.2v11" />
      <path d="M15 3.9v13.4" />
    </Icon>
  );
}
export function FileText(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </Icon>
  );
}
export function Leaf(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.5 2 8a8 8 0 0 1-8.5 8.5c-1.5 0-3-.5-4.5-1.5" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </Icon>
  );
}
export function MessageSquare(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
    </Icon>
  );
}
export function Wrench(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.1-3.1a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.1 3.1Z" />
    </Icon>
  );
}
export function Settings(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </Icon>
  );
}
export function Factory(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M2 20h20" />
      <path d="M5 20V8l5 4V8l5 4V4h4v16" />
    </Icon>
  );
}
export function PanelLeftClose(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M16 15l-3-3 3-3" />
    </Icon>
  );
}
export function PanelLeftOpen(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M13 9l3 3-3 3" />
    </Icon>
  );
}
export function Menu(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </Icon>
  );
}
export function Users(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  );
}
export function Zap(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z" />
    </Icon>
  );
}
export function ChevronDown(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}
export function ChevronRight(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m9 18 6-6-6-6" />
    </Icon>
  );
}

export function ChevronLeft(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m15 18-6-6 6-6" />
    </Icon>
  );
}

export function CheckCircle(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  );
}

export function Circle(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="10" />
    </Icon>
  );
}

export function Info(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </Icon>
  );
}

export function TrendingUp(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m22 7-8.5 8.5-5-5L2 17" />
      <path d="M16 7h6v6" />
    </Icon>
  );
}

export function TrendingDown(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m22 17-8.5-8.5-5 5L2 7" />
      <path d="M16 17h6v-6" />
    </Icon>
  );
}

export function Shield(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </Icon>
  );
}

export function Clock(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </Icon>
  );
}

export function Heart(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </Icon>
  );
}

export function Sparkles(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z" />
      <path d="M5 3v4" />
      <path d="M3 5h4" />
      <path d="M19 17v4" />
      <path d="M17 19h4" />
    </Icon>
  );
}

export function X(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Icon>
  );
}

export function Thermometer(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
    </Icon>
  );
}

export function IndianRupee(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M6 3h12" />
      <path d="M6 8h12" />
      <path d="M6 13h8a4 4 0 0 1 0 8H6" />
    </Icon>
  );
}

export function Filter(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z" />
    </Icon>
  );
}

export function CircleDot(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </Icon>
  );
}

export function Radio(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4.9 4.9a10 10 0 0 1 14.2 0" />
      <path d="M7.8 7.8a6 6 0 0 1 8.4 0" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </Icon>
  );
}
