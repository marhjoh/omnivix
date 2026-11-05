import { currentYear, LATEST_YEAR } from "@/src/lib/contributionYear";

// How long GitHub data is cached. The landing page FAQ quotes these durations, so keep Effect out
// of this file.

export const MINUTE_MS = 60 * 1000;
export const HOUR_MS = 60 * MINUTE_MS;

/**
 * For data that changes during the day: profiles, repositories, and contributions for the latest
 * and current year. The API routes also send it as `s-maxage`, so Vercel's CDN keeps responses as
 * long as the server does.
 */
export const TTL_SHORT = 3 * MINUTE_MS;

/** Past years' contributions, which no longer change. */
export const TTL_LONG = 6 * HOUR_MS;

export function contributionsTtlMs(year: string): number {
  const isHistorical = year !== LATEST_YEAR && Number(year) < currentYear();
  return isHistorical ? TTL_LONG : TTL_SHORT;
}
