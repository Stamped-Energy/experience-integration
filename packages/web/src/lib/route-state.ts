/** Shared route surface contract - every primary route must handle these. */

export const ROUTE_STATES = [
  "default",
  "loading",
  "empty",
  "error",
  "stale",
  "forbidden",
  "partial",
] as const;

export type RouteStateKind = (typeof ROUTE_STATES)[number];

export type RouteStateModel = {
  kind: RouteStateKind;
  title?: string;
  detail?: string;
  /** Partial: which slices failed (honest missing-data). */
  missing?: string[];
  retryable?: boolean;
};

export function resolveRouteState(input: {
  loading?: boolean;
  forbidden?: boolean;
  error?: string | null;
  empty?: boolean;
  stale?: boolean;
  missing?: string[];
}): RouteStateModel {
  if (input.forbidden) {
    return {
      kind: "forbidden",
      title: "You don’t have access",
      detail: "Ask an admin if this plant or screen should be available to your role.",
      retryable: false,
    };
  }
  if (input.loading) {
    return { kind: "loading", title: "Loading", detail: "Fetching the latest plant data…" };
  }
  if (input.error) {
    return {
      kind: "error",
      title: "Something went wrong",
      detail: input.error,
      retryable: true,
    };
  }
  if (input.empty) {
    return {
      kind: "empty",
      title: "Nothing here yet",
      detail: "When data arrives for this plant, it will show up in this view.",
    };
  }
  if (input.missing && input.missing.length > 0) {
    return {
      kind: "partial",
      title: "Some data is unavailable",
      detail: "Showing available plant data for this view.",
      missing: input.missing,
      retryable: true,
    };
  }
  if (input.stale) {
    return {
      kind: "stale",
      title: "Showing last known data",
      detail: "Live updates are paused. Figures may be behind the plant.",
      retryable: true,
    };
  }
  return { kind: "default" };
}
