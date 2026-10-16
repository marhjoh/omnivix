export interface GithubUserNormalized {
  login: string;
  name: string | null;
  avatarUrl: string;
  /** ISO date the account was created; the studio offers contribution years from then on. */
  createdAt: string;
}

export interface RepoNormalized {
  id: string;
  name: string;
  description: string | null;
  language: string | null;
  languageColor: string | null;
  stargazers: number;
  forks: number;
}

/** A user's pinned repositories and all their public ones (newest first). */
export interface RepoLists {
  pinned: RepoNormalized[];
  owned: RepoNormalized[];
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
}

/**
 * Canonical contribution data, driven by GitHub's contributionCalendar structure.
 *
 * `weeks` is the authoritative column source: columnCount = weeks.length.
 * `months` provides month label placement metadata.
 * `rangeEndYmd` limits which months get a label.
 */
export interface ContributionsNormalized {
  total: number;

  /** GitHub calendar weeks — authoritative column structure. */
  weeks: ContributionWeekNormalized[];

  /** GitHub month metadata for calendar-aligned month label placement. */
  months: ContributionMonthNormalized[];

  /** Inclusive end of the requested range (YYYY-MM-DD). */
  rangeEndYmd: string;
}
