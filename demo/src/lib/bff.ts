/** Shared BFF URL helper — empty NEXT_PUBLIC_BFF_URL uses same-origin proxy. */
export function bffUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_BFF_URL;
  return base ? `${base}${path}` : path;
}

export type DataSource =
  | "fixture"
  | "l2"
  | "l5"
  | "preview"
  | "unavailable";

export type UpstreamStatus = "live" | "down" | "off";

export type UpstreamProbe = {
  l2: UpstreamStatus;
  l5: UpstreamStatus;
  l4: UpstreamStatus;
  plantId: string;
  orgId: string;
  checkedAt: string;
  demoMode: boolean;
  detail?: {
    l2?: string;
    l5?: string;
    l4?: string;
  };
};
