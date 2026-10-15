/**
 * Frozen UTC semantics for the product "latest" contribution window:
 * inclusive 365 calendar days from (anchor UTC date − 364) through anchor UTC date.
 */

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * @param anchor Interpreted in UTC (year/month/date components only; time ignored for the "today" calendar day).
 */
export function computeLatestContributionRangeUtc(anchor: Date): {
  fromIso: string;
  toIso: string;
  toYyyyMmDd: string;
} {
  const y = anchor.getUTCFullYear();
  const mo = anchor.getUTCMonth();
  const d = anchor.getUTCDate();
  const fromDate = new Date(Date.UTC(y, mo, d - 364, 0, 0, 0, 0));
  const toDate = new Date(Date.UTC(y, mo, d, 23, 59, 59, 999));
  const toYyyyMmDd = `${y}-${pad2(mo + 1)}-${pad2(d)}`;
  return {
    fromIso: fromDate.toISOString(),
    toIso: toDate.toISOString(),
    toYyyyMmDd,
  };
}
