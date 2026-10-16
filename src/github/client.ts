import { cached } from "@/src/github/cache";
import {
  ContributionDayNormalized,
  ContributionsNormalized,
  GithubUserNormalized,
  RepoLists,
  RepoNormalized,
} from "@/src/github/normalize";
import { computeLatestContributionRangeUtc } from "@/src/lib/utcContributionRange";
import { graphql } from "@octokit/graphql";

/** TTL: latest/current year data changes within the day. Historical years are stable. */
// The landing FAQ (src/landing/landingContent.ts) states these durations; update it if they change.
const TTL_SHORT = 1000 * 60 * 3; // 3 min
const TTL_LONG = 1000 * 60 * 60 * 6; // 6 hours

/** Repositories are listed 100 per page; this caps the picker at 1,000 of the most recently updated. */
const REPO_PAGE_SIZE = 100;
const MAX_REPO_PAGES = 10;

function graphqlClient() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN is not set");
  }
  return graphql.defaults({
    headers: { authorization: `token ${token}` },
  });
}

/** GitHub logins are case-insensitive, so cache keys are too. */
function userKey(username: string) {
  return username.toLowerCase();
}

/** "latest" (the last 365 days) or a four-digit year. */
export function isContributionYear(year: string): boolean {
  return year === "latest" || /^\d{4}$/.test(year);
}

/** True when GitHub reports that the requested user doesn't exist. */
export function isUserNotFound(error: unknown): boolean {
  const errors = (error as { errors?: Array<{ type?: string; path?: unknown[] }> } | null)?.errors;
  return (
    Array.isArray(errors) && errors.some((e) => e.type === "NOT_FOUND" && e.path?.[0] === "user")
  );
}

export function getUserSummary(username: string): Promise<GithubUserNormalized> {
  return cached(`gh:user:${userKey(username)}`, TTL_SHORT, async () => {
    const { user } = await graphqlClient()<{ user: GithubUserNormalized }>(
      `
        query UserSummary($username: String!) {
          user(login: $username) {
            login
            name
            avatarUrl
            createdAt
          }
        }
      `,
      { username },
    );
    return user;
  });
}

const LEVELS: Record<string, ContributionDayNormalized["level"]> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

/** Contributions for a calendar year, or for the last 365 days when `year` is "latest". */
export function getContributions(username: string, year: string): Promise<ContributionsNormalized> {
  if (!isContributionYear(year)) {
    return Promise.reject(new Error(`Invalid contribution year: ${year}`));
  }
  const latest = year === "latest" ? computeLatestContributionRangeUtc(new Date()) : null;
  const from = latest ? latest.fromIso : `${year}-01-01T00:00:00Z`;
  const to = latest ? latest.toIso : `${year}-12-31T23:59:59Z`;
  const isHistorical = !latest && Number(year) < new Date().getUTCFullYear();
  const period = latest ? `latest:${latest.toYyyyMmDd}` : year;

  return cached(
    `gh:contrib:${userKey(username)}:${period}`,
    isHistorical ? TTL_LONG : TTL_SHORT,
    async () => {
      const response = await graphqlClient()<{
        user: {
          contributionsCollection: {
            contributionCalendar: {
              totalContributions: number;
              months: Array<{ firstDay: string; name: string }>;
              weeks: Array<{
                firstDay: string;
                contributionDays: Array<{
                  date: string;
                  contributionCount: number;
                  contributionLevel: string;
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

      const calendar = response.user.contributionsCollection.contributionCalendar;
      return {
        total: calendar.totalContributions,
        weeks: calendar.weeks.map((week) => ({
          firstDay: week.firstDay,
          days: week.contributionDays.map((day) => ({
            date: day.date,
            count: day.contributionCount,
            level: LEVELS[day.contributionLevel] ?? 0,
            weekday: day.weekday as ContributionDayNormalized["weekday"],
          })),
        })),
        months: calendar.months,
        rangeEndYmd: to.slice(0, 10),
      };
    },
  );
}

type RepoGqlFields = {
  id: string;
  name: string;
  description: string | null;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: { name: string; color: string | null } | null;
};

const REPO_FIELDS = `
  id
  name
  description
  stargazerCount
  forkCount
  primaryLanguage {
    name
    color
  }
`;

function normalizeRepoNode(repo: RepoGqlFields): RepoNormalized {
  return {
    id: repo.id,
    name: repo.name,
    description: repo.description,
    language: repo.primaryLanguage?.name ?? null,
    languageColor: repo.primaryLanguage?.color ?? null,
    stargazers: repo.stargazerCount,
    forks: repo.forkCount,
  };
}

type RepoPage = {
  nodes: RepoGqlFields[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
};

const OWNER_REPOS_ARGS = `
  first: ${REPO_PAGE_SIZE}
  after: $after
  ownerAffiliations: OWNER
  orderBy: { field: UPDATED_AT, direction: DESC }
  privacy: PUBLIC
  isFork: false
`;

/** Pinned repositories and the owner's public repositories (newest first), fetched together. */
export function getRepoLists(username: string): Promise<RepoLists> {
  return cached(`gh:repos:${userKey(username)}`, TTL_SHORT, async () => {
    const client = graphqlClient();
    const first = await client<{
      user: {
        pinnedItems: { nodes: Array<Partial<RepoGqlFields> & { __typename: string }> };
        repositories: RepoPage;
      };
    }>(
      `
        query UserRepos($username: String!, $after: String) {
          user(login: $username) {
            pinnedItems(first: 6, types: REPOSITORY) {
              nodes {
                __typename
                ... on Repository { ${REPO_FIELDS} }
              }
            }
            repositories(${OWNER_REPOS_ARGS}) {
              nodes { ${REPO_FIELDS} }
              pageInfo { hasNextPage endCursor }
            }
          }
        }
      `,
      { username, after: null },
    );

    const pinned = first.user.pinnedItems.nodes
      .filter((node) => node.__typename === "Repository")
      .map((node) => normalizeRepoNode(node as RepoGqlFields));

    const nodes = [...first.user.repositories.nodes];
    let page = first.user.repositories.pageInfo;
    for (let i = 1; i < MAX_REPO_PAGES && page.hasNextPage; i++) {
      const next = await client<{ user: { repositories: RepoPage } }>(
        `
          query MoreUserRepos($username: String!, $after: String) {
            user(login: $username) {
              repositories(${OWNER_REPOS_ARGS}) {
                nodes { ${REPO_FIELDS} }
                pageInfo { hasNextPage endCursor }
              }
            }
          }
        `,
        { username, after: page.endCursor },
      );
      nodes.push(...next.user.repositories.nodes);
      page = next.user.repositories.pageInfo;
    }

    return { pinned, owned: nodes.map(normalizeRepoNode) };
  });
}
