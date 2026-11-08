import type { Page, Route } from "@playwright/test";
import type { ContributionsNormalized, GithubUserNormalized, RepoLists } from "@/src/github/types";

// Fake GitHub data for the studio, answered in the browser, because CI has no GitHub token.

export const USERNAME = "octocat";

const user: GithubUserNormalized = {
  login: USERNAME,
  name: "The Octocat",
  avatarUrl: "https://avatars.githubusercontent.com/u/583231",
  createdAt: "2011-01-25T18:44:36Z",
  publicRepos: 8,
  followers: 4000,
  following: 9,
  pullRequests: 30,
};

const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const DAY_MS = 86_400_000;

/** A calendar year of contributions, one every third day, in weeks from Sunday like GitHub's. */
function contributions(year: number): ContributionsNormalized {
  const start = Date.UTC(year, 0, 1);
  const end = Date.UTC(year, 11, 31);
  const weeks: ContributionsNormalized["weeks"] = [];
  for (let ms = start; ms <= end; ms += DAY_MS) {
    const weekday = new Date(ms).getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    if (weekday === 0 || weeks.length === 0) weeks.push({ firstDay: ymd(ms), days: [] });
    const count = (ms / DAY_MS) % 3 === 0 ? 4 : 0;
    weeks.at(-1)!.days.push({ date: ymd(ms), count, level: count ? 2 : 0, weekday });
  }
  const months = Array.from({ length: 12 }, (_, month) => ({
    firstDay: ymd(Date.UTC(year, month, 1)),
    name: new Date(Date.UTC(year, month, 1)).toLocaleString("en-US", {
      month: "long",
      timeZone: "UTC",
    }),
  }));
  const total = weeks.flatMap((week) => week.days).reduce((sum, day) => sum + day.count, 0);
  return { total, weeks, months, rangeEndYmd: ymd(end) };
}

const repo = (name: string, stargazers: number) => ({
  id: name,
  name,
  description: `The ${name} repository`,
  language: "TypeScript",
  languageColor: "#3178c6",
  stargazers,
  forks: 3,
});

const repos: RepoLists = {
  pinned: [repo("hello-world", 120), repo("spoon-knife", 80)],
  owned: [repo("hello-world", 120), repo("spoon-knife", 80), repo("linguist", 40)],
};

/** A 1×1 PNG for the profile photo. */
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

/** How the studio's GitHub API calls are answered: the data, or a failure. */
type GithubAnswer = "data" | "not-found" | "rate-limited" | "offline";

/**
 * Answers the studio's `/api/github/*` requests and the profile photo. `answer` is read on every
 * request, so a test can change it (for example before Try again).
 */
export async function fakeGithub(page: Page, answer: () => GithubAnswer) {
  await page.route("https://avatars.githubusercontent.com/**", (route) =>
    route.fulfill({ contentType: "image/png", body: PIXEL }),
  );
  await page.route("**/api/github/**", (route: Route) => {
    const url = new URL(route.request().url());
    switch (answer()) {
      case "offline":
        return route.abort("internetdisconnected");
      case "not-found":
        return route.fulfill({
          status: 404,
          json: { error: `No GitHub user named @${USERNAME}` },
        });
      case "rate-limited":
        return route.fulfill({
          status: 429,
          json: {
            error: "GitHub's limit is reached.",
            limit: "github",
            resetAt: new Date(Date.now() + 10 * 60_000).toISOString(),
          },
        });
      case "data": {
        if (url.pathname.endsWith("/user-summary")) return route.fulfill({ json: user });
        if (url.pathname.endsWith("/repos")) return route.fulfill({ json: repos });
        const year = Number(url.searchParams.get("year")) || new Date().getUTCFullYear();
        return route.fulfill({ json: contributions(year) });
      }
    }
  });
}
