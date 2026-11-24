// Pure helpers for the score-trend chart. Kept free of React and the
// network so they can be unit tested on their own.

export interface TrendInput {
  score: number;
  createdAt: string;
}

export interface TrendPoint {
  index: number; // 0 = oldest
  score: number;
  createdAt: string;
}

export interface TrendSummary {
  points: TrendPoint[];
  average: number;
  best: number;
  worst: number;
  // Last score minus first score; null when there are fewer than 2 points.
  change: number | null;
}

/**
 * Turns the history list (newest first, as the API returns it) into
 * chronological points plus summary numbers. Invalid scores are dropped
 * and valid ones are clamped to 0-100.
 */
export function buildTrend(history: TrendInput[]): TrendSummary {
  const points: TrendPoint[] = history
    .filter((h) => Number.isFinite(h.score))
    .slice()
    .sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    .map((h, i) => ({
      index: i,
      score: Math.min(100, Math.max(0, h.score)),
      createdAt: h.createdAt,
    }));

  if (points.length === 0) {
    return { points, average: 0, best: 0, worst: 0, change: null };
  }

  const scores = points.map((p) => p.score);
  const sum = scores.reduce((a, b) => a + b, 0);

  return {
    points,
    average: Math.round(sum / scores.length),
    best: Math.max(...scores),
    worst: Math.min(...scores),
    change: points.length >= 2 ? scores[scores.length - 1] - scores[0] : null,
  };
}

/** Maps points to SVG coordinates inside a width x height box with padding. */
export function toSvgPoints(
  points: TrendPoint[],
  width: number,
  height: number,
  pad = 24
): { x: number; y: number }[] {
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  return points.map((p, i) => ({
    x: points.length === 1 ? width / 2 : pad + (i / (points.length - 1)) * innerW,
    y: pad + (1 - p.score / 100) * innerH,
  }));
}