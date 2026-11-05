import type { GithubDataKind } from "@/src/templates/types";

/**
 * The studio's GitHub API urls for a banner; null for data it doesn't need, or before there's a
 * username. The studio page loads the same urls on the server, so they must match exactly.
 */
export function githubDataUrls({
  githubData,
  username,
  year,
}: {
  githubData: readonly GithubDataKind[];
  username: string;
  year: string;
}): Record<GithubDataKind, string | null> {
  const user = encodeURIComponent(username);
  return {
    // Every GitHub banner loads the user: the sidebar's year list needs the account's age.
    user: username && githubData.length ? `/api/github/user-summary?username=${user}` : null,
    contributions:
      username && githubData.includes("contributions")
        ? `/api/github/contributions?username=${user}&year=${encodeURIComponent(year)}`
        : null,
    repos: username && githubData.includes("repos") ? `/api/github/repos?username=${user}` : null,
  };
}
