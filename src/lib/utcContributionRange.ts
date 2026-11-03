/** "latest" (the last 365 days) or a four-digit year. */
export function isContributionYear(year: string): boolean {
  return year === "latest" || /^\d{4}$/.test(year);
}

/**
 * The UTC range GitHub is asked for: a calendar year, or for "latest" the 365 calendar days up to
 * and including `now`'s UTC date (the time of day doesn't matter).
 */
export function contributionRange(year: string, now = new Date()): { from: string; to: string } {
  if (year !== "latest") return { from: `${year}-01-01T00:00:00Z`, to: `${year}-12-31T23:59:59Z` };
  const [y, m, d] = [now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()];
  return {
    from: new Date(Date.UTC(y, m, d - 364)).toISOString(),
    to: new Date(Date.UTC(y, m, d, 23, 59, 59, 999)).toISOString(),
  };
}
