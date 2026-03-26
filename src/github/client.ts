import { readCache, writeCache } from "@/src/github/cache";
import {
  ContributionsNormalized,
  GithubUserNormalized,
  RepoNormalized,
} from "@/src/github/normalize";
import { graphql } from "@octokit/graphql";

function graphqlClient() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN is required for production GitHub data");
  }
  return graphql.defaults({
    headers: { authorization: `token ${token}` },
  });
}

export async function getUserSummary(username: string): Promise<GithubUserNormalized> {
  const cacheKey = `gh:user:${username}`;
  const cached = readCache<GithubUserNormalized>(cacheKey);
  if (cached) return cached;

  const client = graphqlClient();
  const user = await client<{
    user: {
      login: string;
      name: string | null;
      avatarUrl: string;
      createdAt: string;
      followers: { totalCount: number };
      repositories: { totalCount: number };
    };
  }>(
    `
      query UserSummary($username: String!) {
        user(login: $username) {
          login
          name
          avatarUrl
          createdAt
          followers {
            totalCount
          }
          repositories(ownerAffiliations: OWNER) {
            totalCount
          }
        }
      }
    `,
    { username },
  );
  const contributions = await getContributions(username);
  return writeCache(cacheKey, {
    login: user.user.login,
    name: user.user.name,
    avatarUrl: user.user.avatarUrl,
    followers: user.user.followers.totalCount,
    publicRepos: user.user.repositories.totalCount,
    contributionsLastYear: contributions.total,
    createdAt: user.user.createdAt,
  });
}

export async function getContributions(username: string, year?: string): Promise<ContributionsNormalized> {
  const cacheKey = `gh:contrib:${username}:${year ?? "latest"}`;
  const cached = readCache<ContributionsNormalized>(cacheKey);
  if (cached) return cached;

  const client = graphqlClient();

  const yearNum = year ? parseInt(year, 10) : undefined;
  const from = yearNum ? `${yearNum}-01-01T00:00:00Z` : undefined;
  const to = yearNum ? `${yearNum}-12-31T23:59:59Z` : undefined;

  const response = await client<{
    user: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
          weeks: Array<{
            firstDay: string;
            contributionDays: Array<{
              date: string;
              contributionCount: number;
              contributionLevel: "NONE" | "FIRST_QUARTILE" | "SECOND_QUARTILE" | "THIRD_QUARTILE" | "FOURTH_QUARTILE";
            }>;
          }>;
        };
      };
    };
  }>(
    `
      query UserContributions($username: String!, $from: DateTime, $to: DateTime) {
        user(login: $username) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              totalContributions
              weeks {
                firstDay
                contributionDays {
                  date
                  contributionCount
                  contributionLevel
                }
              }
            }
          }
        }
      }
    `,
    { username, from, to },
  );

  const levelToNumber: Record<string, 0 | 1 | 2 | 3 | 4> = {
    NONE: 0,
    FIRST_QUARTILE: 1,
    SECOND_QUARTILE: 2,
    THIRD_QUARTILE: 3,
    FOURTH_QUARTILE: 4,
  };

  const calendar = response.user.contributionsCollection.contributionCalendar;
  return writeCache(cacheKey, {
    total: calendar.totalContributions,
    weeks: calendar.weeks.map((week) => ({
      weekStart: week.firstDay,
      days: week.contributionDays.map((day) => ({
        date: day.date,
        count: day.contributionCount,
        level: levelToNumber[day.contributionLevel] ?? 0,
      })),
    })),
  });
}

export async function getRepos(
  username: string,
  mode: "pinned" | "selected",
  selected: string[] = [],
): Promise<RepoNormalized[]> {
  const cacheKey = `gh:repos:${username}:${mode}:${selected.join(",")}`;
  const cached = readCache<RepoNormalized[]>(cacheKey);
  if (cached) return cached;

  const client = graphqlClient();
  const response = await client<{
    user: {
      pinnedItems: {
        nodes: Array<{
          __typename: string;
          id: string;
          name: string;
          description: string | null;
          url: string;
          stargazerCount: number;
          forkCount: number;
          primaryLanguage: { name: string; color: string | null } | null;
        }>;
      };
      repositories: {
        nodes: Array<{
          id: string;
          name: string;
          description: string | null;
          url: string;
          stargazerCount: number;
          forkCount: number;
          primaryLanguage: { name: string; color: string | null } | null;
        }>;
      };
    };
  }>(
    `
      query UserRepos($username: String!) {
        user(login: $username) {
          pinnedItems(first: 6, types: REPOSITORY) {
            nodes {
              ... on Repository {
                __typename
                id
                name
                description
                url
                stargazerCount
                forkCount
                primaryLanguage {
                  name
                  color
                }
              }
            }
          }
          repositories(
            first: 100
            ownerAffiliations: OWNER
            orderBy: { field: UPDATED_AT, direction: DESC }
            privacy: PUBLIC
            isFork: false
          ) {
            nodes {
              id
              name
              description
              url
              stargazerCount
              forkCount
              primaryLanguage {
                name
                color
              }
            }
          }
        }
      }
    `,
    { username },
  );

  const sourceRepos =
    mode === "pinned"
      ? response.user.pinnedItems.nodes
      : response.user.repositories.nodes.filter((repo) => selected.includes(repo.name));

  const normalized = sourceRepos
    .slice()
    .sort((a, b) => b.stargazerCount - a.stargazerCount)
    .slice(0, 6)
    .map((repo) => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      language: repo.primaryLanguage?.name ?? null,
      languageColor: repo.primaryLanguage?.color ?? null,
      stargazers: repo.stargazerCount,
      forks: repo.forkCount,
      url: repo.url,
      isPinned: mode === "pinned",
    }));

  return writeCache(cacheKey, normalized);
}
