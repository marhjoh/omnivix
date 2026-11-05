import { LATEST_YEAR } from "@/src/lib/contributionYear";

/**
 * The UTC range to ask GitHub for. A year gives that calendar year. `LATEST_YEAR` gives the 365
 * days up to and including `now`'s UTC date, whatever the time of day.
 */
export function contributionRange(year: string, now = new Date()): { from: string; to: string } {
  if (year !== LATEST_YEAR) {
    return { from: `${year}-01-01T00:00:00Z`, to: `${year}-12-31T23:59:59Z` };
  }
  const [y, m, d] = [now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()];
  return {
    from: new Date(Date.UTC(y, m, d - 364)).toISOString(),
    to: new Date(Date.UTC(y, m, d, 23, 59, 59, 999)).toISOString(),
  };
}
