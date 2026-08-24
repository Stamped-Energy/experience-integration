/** Shared BFF URL helper — empty NEXT_PUBLIC_BFF_URL uses same-origin proxy. */
export function bffUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_BFF_URL;
  return base ? `${base}${path}` : path;
}

export type DataSource = "fixture" | "l2" | "l5" | "preview";
