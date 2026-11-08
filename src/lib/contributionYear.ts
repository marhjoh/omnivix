import type { BannerSettings } from "@/src/templates/types";

/** The Year setting's value for the last 365 days instead of a calendar year. */
export const LATEST_YEAR = "latest";

/** This year in UTC, because GitHub's contribution ranges are in UTC (see `contributionRange`). */
export function currentYear(): number {
  return new Date().getUTCFullYear();
}

/** `LATEST_YEAR` (the last 365 days) or a four-digit year. */
export function isContributionYear(year: string): boolean {
  return year === LATEST_YEAR || /^\d{4}$/.test(year);
}

/** The contributions year a banner shows: its Year setting, or the current year. */
export function contributionYear(year: unknown): string {
  return year != null && String(year).length > 0 ? String(year) : String(currentYear());
}

/** The banner's Year setting. A banner without one shows the last 365 days. */
export function yearOf(state: BannerSettings): string {
  return "year" in state ? state.year : LATEST_YEAR;
}
