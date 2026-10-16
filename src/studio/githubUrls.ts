import type { GithubDataKind } from "@/src/types/template";

/** The contributions year a banner shows: its Year setting, or the current year. */
export function contributionYear(year: unknown): string {
  return year != null && String(year).length > 0 ? String(year) : String(new Date().getFullYear());
}

/**
 * The studio's GitHub API urls for a banner; null for data it doesn't need, or before there's a
 * username. The studio page loads the same urls on the server, so they must match exactly.
 */
export function githubDataUrls({
  needsUsername,
  githubData,
  username,
  year,
}: {
  needsUsername: boolean;
  githubData: readonly GithubDataKind[];
  username: string;
  year: string;
}): Record<GithubDataKind, string | null> {
  const user = encodeURIComponent(username);
  return {
    user: needsUsername && username ? `/api/github/user-summary?username=${user}` : null,
    contributions:
      username && githubData.includes("contributions")
        ? `/api/github/contributions?username=${user}&year=${encodeURIComponent(year)}`
        : null,
    repos: username && githubData.includes("repos") ? `/api/github/repos?username=${user}` : null,
  };
}
