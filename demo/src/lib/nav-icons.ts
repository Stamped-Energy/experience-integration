import type { ComponentType, SVGProps } from "react";
import type { NavKey } from "@/lib/types";
import type { NavGroupId } from "@/lib/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Leaf,
  Map,
  MessageSquare,
  Radio,
  Settings,
  Users,
  Wrench,
} from "@/components/ui/icons";

type IconComp = ComponentType<SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }>;

/** Icon map for primary shell navigation. */
export const NAV_ICONS: Record<NavKey, IconComp> = {
  today: LayoutDashboard,
  live: Radio,
  energy: BarChart3,
  equipment: Activity,
  alarms: AlertTriangle,
  prescriptions: ClipboardList,
  plant_map: Map,
  reports: FileText,
  intensity: Leaf,
  analyst: MessageSquare,
  tools: Wrench,
  assignments: Users,
  evidence: ClipboardList,
  integrations: Settings,
  admin: Settings,
};

/** Icon map for collapsible sidebar groups. */
export const NAV_GROUP_ICONS: Record<NavGroupId, IconComp> = {
  operations: AlertTriangle,
  insights: BarChart3,
  reports: FileText,
  administration: Settings,
};

export { Factory } from "@/components/ui/icons";
