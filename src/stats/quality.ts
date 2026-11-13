import { redisFromEnv, redisNamespace } from "@/src/lib/redis";
import { studioPath } from "@/src/lib/site";

// Daily measurements, like Lighthouse scores and test coverage. Unlike the counters, a new value
// replaces the day's old one.

/** Two years and a bit, so the dashboard can compare a year with the one before. */
export const KEEP_SECONDS = 800 * 24 * 60 * 60;

export const COVERAGE_FIELD = "quality:coverage";

/** A measurement, which a day may not have, unlike a counter that's 0. */
export function isMeasurement(field: string): boolean {
  return field.startsWith("quality:");
}

export const STARS_FIELD = "quality:stars";

/** The quote banner's studio needs no GitHub user, so it always has a banner to measure. */
export const LIGHTHOUSE_PAGES = { landing: "/", studio: studioPath("quote-banner") } as const;

export const LIGHTHOUSE_CATEGORIES = [
  "performance",
  "accessibility",
  "best-practices",
  "seo",
] as const;

export function lighthouseField(page: string, category: string): string {
  return `quality:lighthouse:${page}:${category}`;
}

export function utcDay(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

export function qualityKey(day: string): string {
  return `${redisNamespace()}:quality:${day}`;
}

/** Saves today's measurements. Returns false without a store. */
export async function saveQuality(values: Record<string, number>): Promise<boolean> {
  const redis = redisFromEnv();
  if (!redis || !Object.keys(values).length) return false;
  const key = qualityKey(utcDay(Date.now()));
  await redis.pipeline().hset(key, values).expire(key, KEEP_SECONDS).exec();
  return true;
}
