import type { ContributionsNormalized, RepoNormalized } from "@/src/github/types";

/** Stars on the user's own public repositories. */
export function starsReceived(repos: readonly RepoNormalized[]): number {
  return repos.reduce((sum, repo) => sum + repo.stargazers, 0);
}

/**
 * The longest run of days with contributions, and the run that's still going. A quiet last day
 * doesn't end the current streak, because that day isn't over yet.
 */
export function contributionStreaks(contributions: ContributionsNormalized): {
  current: number;
  longest: number;
} {
  const counts = contributions.weeks
    .flatMap((week) => week.days)
    .filter((day) => day.date <= contributions.rangeEndYmd)
    .map((day) => day.count);

  let longest = 0;
  let run = 0;
  for (const count of counts) {
    run = count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }

  let end = counts.length - 1;
  if (counts[end] === 0) end--;
  let current = 0;
  while (end - current >= 0 && counts[end - current] > 0) current++;

  return { current, longest };
}

export interface LanguageShare {
  name: string;
  /** GitHub's color for the language. Null for "Other" and languages without one. */
  color: string | null;
  /** Between 0 and 1. */
  share: number;
}

/**
 * The most common primary languages, counted by repository. Past `max`, the rest are added up as
 * "Other". Repositories without a language don't count.
 */
export function topLanguages(repos: readonly RepoNormalized[], max = 5): LanguageShare[] {
  const counts = new Map<string, { color: string | null; count: number }>();
  for (const repo of repos) {
    if (!repo.language) continue;
    const entry = counts.get(repo.language) ?? { color: repo.languageColor, count: 0 };
    entry.count++;
    counts.set(repo.language, entry);
  }
  const total = [...counts.values()].reduce((sum, { count }) => sum + count, 0);
  const sorted = [...counts]
    .map(([name, { color, count }]) => ({ name, color, share: count / total }))
    .sort((a, b) => b.share - a.share || a.name.localeCompare(b.name));
  if (sorted.length <= max) return sorted;
  const rest = sorted.slice(max - 1).reduce((sum, { share }) => sum + share, 0);
  return [...sorted.slice(0, max - 1), { name: "Other", color: null, share: rest }];
}

const COMPACT = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** "1,234" up to 9,999, then "12.3K", so a tile's number stays short. */
export function formatCount(value: number): string {
  return value < 10_000 ? value.toLocaleString("en-US") : COMPACT.format(value);
}
