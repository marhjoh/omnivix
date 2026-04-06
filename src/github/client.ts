import { readCache, writeCache } from "@/src/github/cache";
import {
  ContributionDayNormalized,
  ContributionMonthNormalized,
  ContributionWeekNormalized,
  ContributionsNormalized,
  GithubUserNormalized,
  RepoNormalized,
} from "@/src/github/normalize";
import {
  computeLatestContributionRangeUtc,
} from "@/src/lib/utcContributionRange";
import { graphql } from "@octokit/graphql";

/** TTL: latest/current year data changes within the day. Historical years are stable. */
const TTL_SHORT = 1000 * 60 * 3; // 3 min
const TTL_LONG = 1000 * 60 * 60 * 6; // 6 hours

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
  const contributions = await getContributions(username, "latest");
  return writeCache(cacheKey, {
    login: user.user.login,
    name: user.user.name,
    avatarUrl: user.user.avatarUrl,
    followers: user.user.followers.totalCount,
    publicRepos: user.user.repositories.totalCount,
    contributionsLatest365: contributions.total,
    createdAt: user.user.createdAt,
  }, TTL_SHORT);
}

export async function getContributions(username: string, year?: string): Promise<ContributionsNormalized> {
  const modeLatest = !year || year === "latest";
  const latestRange = modeLatest ? computeLatestContributionRangeUtc(new Date()) : null;
  const cacheKey = modeLatest
    ? `gh:contrib:${username}:latest:${latestRange!.toYyyyMmDd}`
    : `gh:contrib:${username}:${year}`;

  const cached = readCache<ContributionsNormalized>(cacheKey);
  if (cached) return cached;

  const client = graphqlClient();

  let from: string;
  let to: string;
  let rangeStartYmd: string;
  let rangeEndYmd: string;
  let yearNum: number | undefined;

  if (modeLatest) {
    from = latestRange!.fromIso;
    to = latestRange!.toIso;
    rangeStartYmd = from.slice(0, 10);
    rangeEndYmd = to.slice(0, 10);
  } else {
    yearNum = parseInt(year!, 10);
    if (Number.isNaN(yearNum) || String(yearNum).length !== 4) {
      throw new Error(`Invalid contribution year: ${year}`);
    }
    from = `${yearNum}-01-01T00:00:00Z`;
    to = `${yearNum}-12-31T23:59:59Z`;
    rangeStartYmd = `${yearNum}-01-01`;
    rangeEndYmd = `${yearNum}-12-31`;
  }

  const response = await client<{
    user: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
          months: Array<{
            firstDay: string;
            name: string;
            totalWeeks: number;
            year: number;
          }>;
          weeks: Array<{
            firstDay: string;
            contributionDays: Array<{
              date: string;
              contributionCount: number;
              contributionLevel: "NONE" | "FIRST_QUARTILE" | "SECOND_QUARTILE" | "THIRD_QUARTILE" | "FOURTH_QUARTILE";
              weekday: number;
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
              months {
                firstDay
                name
                totalWeeks
                year
              }
              weeks {
                firstDay
                contributionDays {
                  date
                  contributionCount
                  contributionLevel
                  weekday
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

  const weeks: ContributionWeekNormalized[] = calendar.weeks.map((week) => ({
    firstDay: week.firstDay,
    days: week.contributionDays.map((day): ContributionDayNormalized => ({
      date: day.date,
      count: day.contributionCount,
      level: levelToNumber[day.contributionLevel] ?? 0,
      weekday: day.weekday as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    })),
  }));

  const months: ContributionMonthNormalized[] = calendar.months.map((m) => ({
    firstDay: m.firstDay,
    name: m.name,
    totalWeeks: m.totalWeeks,
    year: m.year,
  }));

  const currentYear = new Date().getUTCFullYear();
  const isHistorical = !modeLatest && yearNum != null && yearNum < currentYear;
  const ttl = isHistorical ? TTL_LONG : TTL_SHORT;

  return writeCache(cacheKey, {
    total: calendar.totalContributions,
    weeks,
    months,
    rangeStartYmd,
    rangeEndYmd,
    mode: modeLatest ? "latest" : "year",
    year: yearNum,
  }, ttl);
}

type RepoGqlFields = {
  id: string;
  name: string;
  description: string | null;
  url: string;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: { name: string; color: string | null } | null;
};

function normalizeRepoNode(repo: RepoGqlFields, isPinned: boolean): RepoNormalized {
  return {
    id: repo.id,
    name: repo.name,
    description: repo.description,
    language: repo.primaryLanguage?.name ?? null,
    languageColor: repo.primaryLanguage?.color ?? null,
    stargazers: repo.stargazerCount,
    forks: repo.forkCount,
    url: repo.url,
    isPinned,
  };
}

type UserReposBundle = { pinned: RepoNormalized[]; ownerPublic: RepoNormalized[] };

async function fetchUserReposBundle(username: string): Promise<UserReposBundle> {
  const cacheKey = `gh:repos:bundle:v2:${username}`;
  const cached = readCache<UserReposBundle>(cacheKey);
  if (cached) return cached;

  const client = graphqlClient();
  const response = await client<{
    user: {
      pinnedItems: {
        nodes: Array<
          | ({ __typename: string } & RepoGqlFields)
          | { __typename: string }
        >;
      };
      repositories: {
        nodes: RepoGqlFields[];
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

  const pinned: RepoNormalized[] = [];
  for (const node of response.user.pinnedItems.nodes) {
    if (node.__typename === "Repository" && "id" in node && "name" in node) {
      pinned.push(normalizeRepoNode(node as RepoGqlFields, true));
    }
  }

  const ownerPublic = response.user.repositories.nodes.map((repo) => normalizeRepoNode(repo, false));

  return writeCache(cacheKey, { pinned, ownerPublic }, TTL_SHORT);
}

/** Public repos for the signed-in owner (studio picker). Cached with {@link getRepos}. */
export async function getOwnerReposCatalog(username: string): Promise<RepoNormalized[]> {
  const bundle = await fetchUserReposBundle(username);
  return bundle.ownerPublic;
}

export async function getRepos(
  username: string,
  mode: "pinned" | "selected",
  selected: string[] = [],
): Promise<RepoNormalized[]> {
  const bundle = await fetchUserReposBundle(username);
  if (mode === "pinned") {
    return bundle.pinned;
  }
  const byName = new Map(bundle.ownerPublic.map((r) => [r.name, r]));
  const ordered: RepoNormalized[] = [];
  for (const name of selected) {
    const repo = byName.get(name);
    if (repo) {
      ordered.push({ ...repo, isPinned: false });
    }
  }
  return ordered;
}
