import { DURATION_BUCKETS, SERIES } from "@/src/stats/statFields";
import { visitorsField, type DailyStats } from "@/src/stats/stats";

/** New stars per day. They come from GitHub, not the store (see `withStars`). */
const STARS_FIELD = "stars";

/** The tiles above the chart. Clicking one shows it in the chart. */
export const METRICS = [
  { id: "visitors", label: "Visitors", field: visitorsField("site") },
  { id: "views", label: "Page views", field: SERIES.views },
  { id: "exports", label: "Exports", field: SERIES.exports },
  { id: "failures", label: "Failures", field: SERIES.failures },
  { id: "limits", label: "Limit hits", field: SERIES.limits },
  { id: "stars", label: "New stars", field: STARS_FIELD },
] as const;

export type Metric = (typeof METRICS)[number];

export function metricById(raw: string | string[] | undefined): Metric {
  return METRICS.find(({ id }) => id === raw) ?? METRICS[0];
}

/** Below this, a percentage swings too much to mean anything, so only the difference shows. */
const MIN_COUNT_FOR_PERCENT = 20;

/** Longer periods get one point per week, so the line stays readable. */
const DAYS_PER_POINT_ABOVE_90 = 7;

export type Change = { difference: number; percent: number | null };

export function changeOf(current: number, previous: number): Change {
  return {
    difference: current - previous,
    percent:
      previous >= MIN_COUNT_FOR_PERCENT
        ? Math.round(((current - previous) / previous) * 100)
        : null,
  };
}

export type ChartPoint = {
  /** The first day the point covers. */
  day: string;
  value: number;
  previous: number;
};

/**
 * One point per day, or per week for long periods, counted back from today. The last one is still
 * running.
 */
export function chartPoints(
  current: DailyStats[],
  previous: DailyStats[],
  field: string,
): { points: ChartPoint[]; daysPerPoint: number } {
  const daysPerPoint = current.length > 90 ? DAYS_PER_POINT_ABOVE_90 : 1;
  const sum = (days: DailyStats[]) =>
    days.reduce((total, { counts }) => total + (counts[field] ?? 0), 0);
  const points: ChartPoint[] = [];
  for (let end = current.length; end > 0; end -= daysPerPoint) {
    const start = Math.max(0, end - daysPerPoint);
    points.unshift({
      day: current[start].day,
      value: sum(current.slice(start, end)),
      previous: sum(previous.slice(start, end)),
    });
  }
  return { points, daysPerPoint };
}

/**
 * The export time that `share` of exports finished within, from the time buckets. It's an upper
 * bound: the bucket's end.
 */
export function durationPercentile(totals: Record<string, number>, share: number): number | null {
  const counts = DURATION_BUCKETS.map((bound) => totals[`${SERIES.duration}:${bound}`] ?? 0);
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (!total) return null;
  let seen = 0;
  return DURATION_BUCKETS.find((_, index) => (seen += counts[index]) >= share * total)!;
}

export function withStars(stats: DailyStats[], starsPerDay: Record<string, number>): DailyStats[] {
  return stats.map(({ day, counts }) => ({
    day,
    counts: { ...counts, [STARS_FIELD]: starsPerDay[day] ?? 0 },
  }));
}

export type Measurement = { day: string; value: number };

/** The first and last value of a measurement in the period, or null when it wasn't measured. */
export function measurementRange(
  days: DailyStats[],
  field: string,
): { first: Measurement; last: Measurement } | null {
  const measured = days
    .filter(({ counts }) => field in counts)
    .map(({ day, counts }) => ({ day, value: counts[field] }));
  return measured.length ? { first: measured[0], last: measured.at(-1)! } : null;
}
