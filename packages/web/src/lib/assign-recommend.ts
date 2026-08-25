/** Score notify people for Rx/alarm assign recommendations (no fixtures). */

export type RecommendablePerson = {
  id: string;
  name: string;
  role: string;
  phoneMasked: string;
  areas: string[];
  assetIds: string[];
  skills: string[];
  whatsappEnabled: boolean;
};

/**
 * Recommend 2–3 WhatsApp-enabled people from area + asset overlap.
 * Falls back to supervisors/operators when scores are empty.
 */
export function recommendAssigneesFromPeople(
  people: RecommendablePerson[],
  opts: { area?: string; assetId?: string; limit?: number } = {},
): RecommendablePerson[] {
  const limit = opts.limit ?? 3;
  const enabled = people.filter((p) => p.whatsappEnabled);
  const scored = enabled
    .map((p) => {
      let score = 0;
      if (opts.assetId && p.assetIds.includes(opts.assetId)) score += 5;
      if (opts.area && p.areas.includes(opts.area)) score += 3;
      if (p.role === "supervisor") score += 1;
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name));

  const top = scored.slice(0, limit).map((x) => x.p);
  if (top.length >= 2) return top;
  return enabled
    .filter((p) => p.role === "supervisor" || p.role === "operator")
    .slice(0, limit);
}
