/** Dense series sampling - LTTB + min/max envelopes for 30-day minute charts. */

export type Point = { t: number; v: number };

/** Largest-Triangle-Three-Buckets downsampling (Stefan Jänicke / Sveinn). */
export function sampleLttb(points: readonly Point[], threshold: number): Point[] {
  const n = points.length;
  if (threshold >= n || threshold < 3) return [...points];

  const sampled: Point[] = [];
  const bucketSize = (n - 2) / (threshold - 2);
  let prev = 0;
  sampled.push(points[0]!);

  for (let i = 0; i < threshold - 2; i++) {
    const nextBucketStart = Math.floor((i + 1) * bucketSize) + 1;
    const nextBucketEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, n);
    let avgX = 0;
    let avgY = 0;
    const avgRange = Math.max(nextBucketEnd - nextBucketStart, 1);
    for (let j = nextBucketStart; j < nextBucketEnd; j++) {
      avgX += points[j]!.t;
      avgY += points[j]!.v;
    }
    avgX /= avgRange;
    avgY /= avgRange;

    const bucketStart = Math.floor(i * bucketSize) + 1;
    const bucketEnd = Math.min(Math.floor((i + 1) * bucketSize) + 1, n);
    const pointA = points[prev]!;
    let maxArea = -1;
    let maxIndex = bucketStart;
    for (let j = bucketStart; j < bucketEnd; j++) {
      const area = Math.abs(
        (pointA.t - avgX) * (points[j]!.v - pointA.v) -
          (pointA.t - points[j]!.t) * (avgY - pointA.v),
      );
      if (area > maxArea) {
        maxArea = area;
        maxIndex = j;
      }
    }
    sampled.push(points[maxIndex]!);
    prev = maxIndex;
  }

  sampled.push(points[n - 1]!);
  return sampled;
}

/** Per-bucket min/max envelope - preserves extrema for demand spikes. */
export function sampleMinMax(points: readonly Point[], buckets: number): Point[] {
  const n = points.length;
  if (buckets >= n || buckets < 1) return [...points];
  const out: Point[] = [];
  const size = n / buckets;
  for (let i = 0; i < buckets; i++) {
    const start = Math.floor(i * size);
    const end = Math.min(Math.floor((i + 1) * size), n);
    if (start >= end) continue;
    let min = points[start]!;
    let max = points[start]!;
    for (let j = start; j < end; j++) {
      const p = points[j]!;
      if (p.v < min.v) min = p;
      if (p.v > max.v) max = p;
    }
    if (min.t <= max.t) {
      out.push(min);
      if (max.t !== min.t) out.push(max);
    } else {
      out.push(max);
      if (min.t !== max.t) out.push(min);
    }
  }
  return out;
}

/** 30 days × 24 h × 60 min = 43,200 points. */
export function buildMinuteSeries(
  count = 43_200,
  seed = 42,
): Point[] {
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  const start = Date.UTC(2026, 5, 1, 0, 0, 0);
  const out: Point[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const hour = (i / 60) % 24;
    const base = 40 + 25 * Math.sin((hour / 24) * Math.PI * 2);
    const spike = i % 997 === 0 ? 35 : 0;
    out[i] = { t: start + i * 60_000, v: base + rand() * 8 + spike };
  }
  return out;
}
