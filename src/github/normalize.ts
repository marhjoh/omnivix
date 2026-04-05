export interface GithubUserNormalized {
  login: string;
  name: string | null;
  avatarUrl: string;
  followers: number;
  publicRepos: number;
  /** Total from the explicit rolling 365-day UTC window (year="latest"). */
  contributionsLatest365: number;
  createdAt?: string;
}

export interface RepoNormalized {
  id: string;
  name: string;
  description: string | null;
  language: string | null;
  languageColor: string | null;
  stargazers: number;
  forks: number;
  url: string;
  isPinned: boolean;
}

export type ContributionDayNormalized = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  /**
   * Day-of-week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
   * Source: GitHub GraphQL ContributionCalendarDay.weekday
   * ("The day number measured from Sunday").
   */
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
};

export interface ContributionWeekNormalized {
  /** Sunday of this week (YYYY-MM-DD), from GitHub ContributionCalendarWeek.firstDay. */
  firstDay: string;
  days: ContributionDayNormalized[];
}

export interface ContributionMonthNormalized {
  /** Calendar first day of the month (YYYY-MM-DD) from GitHub months metadata. */
  firstDay: string;
  /** Full English name from GitHub, e.g. "January". */
  name: string;
  totalWeeks: number;
  year: number;
}

/**
 * Canonical contribution data, driven by GitHub's contributionCalendar structure.
 *
 * `weeks` is the authoritative column source: columnCount = weeks.length.
 * `months` provides month label placement metadata.
 * Range metadata lets the layout distinguish in-range from out-of-range cells.
 */
export interface ContributionsNormalized {
  total: number;

  /** GitHub calendar weeks — authoritative column structure. */
  weeks: ContributionWeekNormalized[];

  /** GitHub month metadata for calendar-aligned month label placement. */
  months: ContributionMonthNormalized[];

  /** Inclusive start of the requested range (YYYY-MM-DD). */
  rangeStartYmd: string;
  /** Inclusive end of the requested range (YYYY-MM-DD). */
  rangeEndYmd: string;
  /** "latest" = rolling 365 days; "year" = full calendar year. */
  mode: "latest" | "year";
  /** Calendar year number when mode="year" (e.g. 2025). */
  year?: number;
}

function hash(input: string): number {
  return [...input].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 9973, 7);
}

function weekdayFromYmd(ymd: string): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  const [y, m, d] = ymd.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

function ymdFromUtcMs(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

const FULL_MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Generate calendar-aligned mock data for 2023 (Sun-based weeks like GitHub).
 * Used by studio preview when no real GitHub data is available.
 */
export function mockContributions(username: string): ContributionsNormalized {
  const base = hash(username);

  const rangeStartYmd = "2023-01-01";
  const rangeEndYmd = "2023-12-31";

  // Build week-aligned structure starting from the Sunday on/before Jan 1 2023.
  // 2023-01-01 is Sunday (weekday=0), so gridStart = Jan 1.
  const gridStartMs = Date.UTC(2022, 11, 25); // Sunday Dec 25 2022
  const rangeStartMs = Date.UTC(2023, 0, 1);
  const rangeEndMs = Date.UTC(2023, 11, 31);

  const weeks: ContributionWeekNormalized[] = [];
  let weekStartMs = gridStartMs;
  let cellIdx = 0;

  while (weekStartMs <= rangeEndMs) {
    const days: ContributionDayNormalized[] = [];
    for (let d = 0; d < 7; d++) {
      const dayMs = weekStartMs + d * 86400000;
      const date = ymdFromUtcMs(dayMs);
      if (dayMs >= rangeStartMs && dayMs <= rangeEndMs) {
        const value = (base + cellIdx * 23) % 22;
        const level: 0 | 1 | 2 | 3 | 4 =
          value === 0 ? 0 : value < 5 ? 1 : value < 10 ? 2 : value < 16 ? 3 : 4;
        days.push({ date, count: value, level, weekday: weekdayFromYmd(date) });
        cellIdx += 1;
      }
    }
    if (days.length > 0) {
      weeks.push({ firstDay: ymdFromUtcMs(weekStartMs), days });
    }
    weekStartMs += 7 * 86400000;
  }

  const months: ContributionMonthNormalized[] = Array.from({ length: 12 }, (_, mi) => ({
    firstDay: `2023-${String(mi + 1).padStart(2, "0")}-01`,
    name: FULL_MONTH_NAMES[mi],
    totalWeeks: 5,
    year: 2023,
  }));

  const total = weeks.reduce((acc, w) => acc + w.days.reduce((a, d) => a + d.count, 0), 0);

  return {
    total,
    weeks,
    months,
    rangeStartYmd,
    rangeEndYmd,
    mode: "year",
    year: 2023,
  };
}
