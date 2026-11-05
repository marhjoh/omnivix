export interface GithubUserNormalized {
  login: string;
  name: string | null;
  avatarUrl: string;
  /** When the account was created (ISO). The studio offers contribution years from then on. */
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
  /** 0 = Sunday … 6 = Saturday. */
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
};

export interface ContributionWeekNormalized {
  /** YYYY-MM-DD. The first week of a range can start mid-week. */
  firstDay: string;
  days: ContributionDayNormalized[];
}

export interface ContributionMonthNormalized {
  /** YYYY-MM-DD. */
  firstDay: string;
  /** E.g. "January". */
  name: string;
}

/** GitHub's contribution calendar. Each week is a grid column, and `months` gives the labels. */
export interface ContributionsNormalized {
  total: number;
  weeks: ContributionWeekNormalized[];
  months: ContributionMonthNormalized[];
  /** Last day of the requested range (YYYY-MM-DD). Months after it get no label. */
  rangeEndYmd: string;
}
