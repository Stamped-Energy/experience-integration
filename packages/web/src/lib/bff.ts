/** Browser → BFF URL helper (cookie session). */
export function bffUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_BFF_URL;
  if (!base) return path;
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
