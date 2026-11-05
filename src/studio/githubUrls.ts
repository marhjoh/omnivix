import type { GithubDataKind } from "@/src/templates/types";

/**
 * The GitHub API URLs the studio fetches for a banner. A URL is null when the banner doesn't need
 * that data or there's no username yet. The studio page preloads the same URLs on the server, so
 * both sides must build them exactly the same way.
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
    // Every GitHub banner loads the user because the sidebar's year list needs the account's age.
    user: username && githubData.length ? `/api/github/user-summary?username=${user}` : null,
    contributions:
      username && githubData.includes("contributions")
        ? `/api/github/contributions?username=${user}&year=${encodeURIComponent(year)}`
        : null,
    repos: username && githubData.includes("repos") ? `/api/github/repos?username=${user}` : null,
  };
}
