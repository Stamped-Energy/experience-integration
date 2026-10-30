import type { RoleId } from "@/lib/demo/types";

export type ModuleId = "process" | "quality";

export interface ModuleScreen {
  id: string;
  label: string;
  href: string;
  count?: () => number;
}

export interface ModuleGroup {
  id: "scan" | "decide" | "improve" | "setup";
  label: string;
  screens: ModuleScreen[];
}

export interface ModuleDefinition {
  id: ModuleId;
  label: string;
  homeHref: string;
  groups: ModuleGroup[];
}
