import type { RepoLists, RepoNormalized } from "@/src/github/normalize";

/** The repos banner shows at most this many repositories. */
export const MAX_REPOS = 6;

/** Repository names from the comma-separated `selectedRepos` setting (or query parameter). */
export function parseRepoSelection(raw: string | null | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

/** How many repositories the banner shows: up to the limit when selected, else the chosen amount. */
export function reposShown(mode: unknown, maxRepos: unknown): number {
  if (mode === "selected") return MAX_REPOS;
  const amount = Number(maxRepos ?? MAX_REPOS);
  return Math.min(MAX_REPOS, Math.max(1, Number.isFinite(amount) ? Math.round(amount) : MAX_REPOS));
}

/** The repositories a repos banner shows: pinned, or the selected ones in the order picked. */
export function reposForBanner(
  lists: RepoLists,
  mode: unknown,
  selectedRepos: string,
): RepoNormalized[] {
  if (mode !== "selected") return lists.pinned;
  const byName = new Map(lists.owned.map((repo) => [repo.name, repo]));
  return parseRepoSelection(selectedRepos).flatMap((name) => byName.get(name) ?? []);
}
