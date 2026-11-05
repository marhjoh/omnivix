import { currentYear, LATEST_YEAR } from "@/src/lib/contributionYear";

// How long GitHub data is cached. No Effect here: the landing FAQ quotes these durations.

export const MINUTE_MS = 60 * 1000;
export const HOUR_MS = 60 * MINUTE_MS;

/**
 * Data that changes within the day: profiles, repositories, and the latest and current year's
 * contributions. The API routes also send it as `s-maxage`, so Vercel's CDN keeps responses as
 * long as the server does.
 */
export const TTL_SHORT = 3 * MINUTE_MS;

/** Past years' contributions, which no longer change. */
export const TTL_LONG = 6 * HOUR_MS;

/** How long a year's contributions are cached: past years are stable, the current one isn't. */
export function contributionsTtlMs(year: string): number {
  const isHistorical = year !== LATEST_YEAR && Number(year) < currentYear();
  return isHistorical ? TTL_LONG : TTL_SHORT;
}
