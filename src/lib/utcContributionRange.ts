/**
 * Frozen UTC semantics for the product "latest" contribution window:
 * inclusive 365 calendar days from (anchor UTC date − 364) through anchor UTC date.
 */

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** `YYYY-MM-DD` from a UTC-midnight-aligned timestamp (ms). */
export function ymdFromUtcMs(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

export function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

/** Inclusive list of UTC calendar days as `YYYY-MM-DD` from first through last (lexicographic / chronological). */
export function listInclusiveUtcCalendarDays(fromYmd: string, toYmd: string): string[] {
  const [fy, fm, fd] = fromYmd.slice(0, 10).split("-").map(Number);
  const [ty, tm, td] = toYmd.slice(0, 10).split("-").map(Number);
  let cur = Date.UTC(fy, fm - 1, fd);
  const end = Date.UTC(ty, tm - 1, td);
  const out: string[] = [];
  while (cur <= end) {
    out.push(ymdFromUtcMs(cur));
    cur += 86400000;
  }
  return out;
}

export function listUtcCalendarYearDays(year: number): string[] {
  return listInclusiveUtcCalendarDays(`${year}-01-01`, `${year}-12-31`);
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

