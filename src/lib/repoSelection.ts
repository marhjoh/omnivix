import type { RepoLists, RepoNormalized } from "@/src/github/types";
import { oneOfOr } from "@/src/lib/isOneOf";
import { clamp } from "@/src/lib/math";

/** The repos banner shows at most this many repositories. */
export const MAX_REPOS = 6;

/** The repos banner's Mode: the pinned repositories, or the ones picked in the studio. */
export const REPO_MODES = ["pinned", "selected"] as const;

export type RepoMode = (typeof REPO_MODES)[number];

/** Pinned unless the setting is a valid mode. */
export function repoModeOf(raw: unknown): RepoMode {
  return oneOfOr(REPO_MODES, raw, "pinned");
}

/** A banner's `selectedRepos` setting as text (it's unset on banners without it). */
export function selectedReposOf(state: Record<string, unknown>): string {
  return String(state.selectedRepos ?? "");
}

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
  return clamp(Number.isFinite(amount) ? Math.round(amount) : MAX_REPOS, 1, MAX_REPOS);
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
