import type { RepoLists, RepoNormalized } from "@/src/github/types";

/** The repos banner shows at most this many repositories. */
export const MAX_REPOS = 6;

/** The repos banner's Mode: the pinned repositories, or the ones picked in the studio. */
export const REPO_MODES = ["pinned", "selected"] as const;

export type RepoMode = (typeof REPO_MODES)[number];

/** GitHub's rule for a repository name: letters, digits, `.`, `-` and `_`, at most 100 of them. */
const REPO_NAME = /^[\w.-]{1,100}$/;

/** True for at most MAX_REPOS repository names, comma-separated. */
export function isRepoSelection(value: string): boolean {
  const names = parseRepoSelection(value);
  return names.length <= MAX_REPOS && names.every((name) => REPO_NAME.test(name));
}

/** Repository names from the comma-separated `selectedRepos` setting (or query parameter). */
export function parseRepoSelection(raw: string | null | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

/** The schema allows any number from 1 to MAX_REPOS, so a fraction is rounded. */
export function reposShown(mode: RepoMode, maxRepos: number): number {
  return mode === "selected" ? MAX_REPOS : Math.round(maxRepos);
}

/** Selected repositories keep the order they were picked in. */
export function reposForBanner(
  lists: RepoLists,
  mode: RepoMode,
  selectedRepos: string,
): RepoNormalized[] {
  if (mode !== "selected") return lists.pinned;
  const byName = new Map(lists.owned.map((repo) => [repo.name, repo]));
  return parseRepoSelection(selectedRepos).flatMap((name) => byName.get(name) ?? []);
}
