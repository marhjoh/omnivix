import "server-only";
import { Cache, Duration, Effect, Exit, Schema } from "effect";
import type {
  ContributionDayNormalized,
  ContributionsNormalized,
  GithubUserNormalized,
  RepoLists,
  RepoNormalized,
} from "@/src/github/normalize";
import { contributionRange } from "@/src/github/contributionRange";
import { isContributionYear } from "@/src/lib/contributionYear";
import { contributionsTtlMs, TTL_SHORT } from "@/src/github/cacheTimes";
import type { GithubError } from "@/src/github/errors";
import type { GithubDataKind } from "@/src/types/template";
import { githubQuery, QUOTA_FIELDS } from "@/src/github/graphql";

/** Entries each cache keeps at most; the oldest are dropped first. */
const CACHE_CAPACITY = 500;

/** Repositories are listed 100 per page; this caps the picker at 1,000 of the most recently updated. */
const REPO_PAGE_SIZE = 100;
const MAX_REPO_PAGES = 10;

/**
 * A cache for one kind of GitHub data. Concurrent requests for a key share one GitHub call;
 * failures aren't kept, so the next request asks again.
 */
function githubCache<A>(
  lookup: (key: string) => Effect.Effect<A, GithubError>,
  ttlMs: (key: string) => number,
) {
  return Effect.runSync(
    Cache.makeWith(lookup, {
      capacity: CACHE_CAPACITY,
      timeToLive: (exit, key) =>
        Exit.isSuccess(exit) ? Duration.millis(ttlMs(key)) : Duration.zero,
    }),
  );
}

/** GitHub logins are case-insensitive, so cache keys are too. */
function userKey(username: string) {
  return username.toLowerCase();
}

const UserSummary = Schema.Struct({
  user: Schema.Struct({
    login: Schema.String,
    name: Schema.NullOr(Schema.String),
    avatarUrl: Schema.String,
    createdAt: Schema.String,
  }),
});

const users = githubCache(
  (login) =>
    githubQuery(
      `
        query UserSummary($username: String!) {
          ${QUOTA_FIELDS}
          user(login: $username) {
            login
            name
            avatarUrl
            createdAt
          }
        }
      `,
      { username: login },
      UserSummary,
    ).pipe(Effect.map(({ user }): GithubUserNormalized => ({ ...user }))),
  () => TTL_SHORT,
);

export function getUserSummary(username: string): Effect.Effect<GithubUserNormalized, GithubError> {
  return Cache.get(users, userKey(username));
}

const LEVELS: Record<string, ContributionDayNormalized["level"]> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

const ContributionCalendar = Schema.Struct({
  user: Schema.Struct({
    contributionsCollection: Schema.Struct({
      contributionCalendar: Schema.Struct({
        totalContributions: Schema.Number,
        months: Schema.Array(Schema.Struct({ firstDay: Schema.String, name: Schema.String })),
        weeks: Schema.Array(
          Schema.Struct({
            firstDay: Schema.String,
            contributionDays: Schema.Array(
              Schema.Struct({
                date: Schema.String,
                contributionCount: Schema.Number,
                contributionLevel: Schema.String,
                weekday: Schema.Literals([0, 1, 2, 3, 4, 5, 6]),
              }),
            ),
          }),
        ),
      }),
    }),
  }),
});

/**
 * Keys are `login year from to`. The range is in the key, so `LATEST_YEAR` (which moves every day)
 * gets a new key each day, and a lookup always asks for exactly the range its key names.
 */
const contributions = githubCache(
  (key) => {
    const [login, , from, to] = key.split(" ");
    return githubQuery(
      `
        query UserContributions($username: String!, $from: DateTime, $to: DateTime) {
          ${QUOTA_FIELDS}
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
      { username: login, from, to },
      ContributionCalendar,
    ).pipe(
      Effect.map((response): ContributionsNormalized => {
        const calendar = response.user.contributionsCollection.contributionCalendar;
        return {
          total: calendar.totalContributions,
          weeks: calendar.weeks.map((week) => ({
            firstDay: week.firstDay,
            days: week.contributionDays.map((day) => ({
              date: day.date,
              count: day.contributionCount,
              level: LEVELS[day.contributionLevel] ?? 0,
              weekday: day.weekday,
            })),
          })),
          months: calendar.months.map((month) => ({ ...month })),
          rangeEndYmd: to.slice(0, 10),
        };
      }),
    );
  },
  (key) => contributionsTtlMs(key.split(" ")[1]),
);

/** Contributions for a calendar year, or for the last 365 days when `year` is `LATEST_YEAR`. */
export function getContributions(
  username: string,
  year: string,
): Effect.Effect<ContributionsNormalized, GithubError> {
  if (!isContributionYear(year)) return Effect.die(new Error(`Invalid contribution year: ${year}`));
  const { from, to } = contributionRange(year);
  return Cache.get(contributions, `${userKey(username)} ${year} ${from} ${to}`);
}

const RepoFields = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.NullOr(Schema.String),
  stargazerCount: Schema.Number,
  forkCount: Schema.Number,
  primaryLanguage: Schema.NullOr(
    Schema.Struct({ name: Schema.String, color: Schema.NullOr(Schema.String) }),
  ),
});

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

function normalizeRepo(repo: typeof RepoFields.Type): RepoNormalized {
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

const RepoPage = Schema.Struct({
  nodes: Schema.Array(RepoFields),
  pageInfo: Schema.Struct({ hasNextPage: Schema.Boolean, endCursor: Schema.NullOr(Schema.String) }),
});

/** One page of the owner's public repositories, newest first. */
const OWNER_REPOS_PAGE = `
  repositories(
    first: ${REPO_PAGE_SIZE}
    after: $after
    ownerAffiliations: OWNER
    orderBy: { field: UPDATED_AT, direction: DESC }
    privacy: PUBLIC
    isFork: false
  ) {
    nodes { ${REPO_FIELDS} }
    pageInfo { hasNextPage endCursor }
  }
`;

const FirstRepoPage = Schema.Struct({
  user: Schema.Struct({
    pinnedItems: Schema.Struct({
      // Only repositories are asked for; anything else is skipped.
      nodes: Schema.Array(
        Schema.Union([
          Schema.Struct({ __typename: Schema.Literal("Repository"), ...RepoFields.fields }),
          Schema.Struct({ __typename: Schema.String }),
        ]),
      ),
    }),
    repositories: RepoPage,
  }),
});

const NextRepoPage = Schema.Struct({ user: Schema.Struct({ repositories: RepoPage }) });

const repoLists = githubCache(
  (login) =>
    Effect.gen(function* () {
      const first = yield* githubQuery(
        `
          query UserRepos($username: String!, $after: String) {
            ${QUOTA_FIELDS}
            user(login: $username) {
              pinnedItems(first: 6, types: REPOSITORY) {
                nodes {
                  __typename
                  ... on Repository { ${REPO_FIELDS} }
                }
              }
              ${OWNER_REPOS_PAGE}
            }
          }
        `,
        { username: login, after: null },
        FirstRepoPage,
      );
      const pinned = first.user.pinnedItems.nodes.flatMap((node) =>
        "id" in node ? [normalizeRepo(node)] : [],
      );

      const nodes = [...first.user.repositories.nodes];
      let page = first.user.repositories.pageInfo;
      for (let i = 1; i < MAX_REPO_PAGES && page.hasNextPage; i++) {
        const next = yield* githubQuery(
          `
            query MoreUserRepos($username: String!, $after: String) {
              ${QUOTA_FIELDS}
              user(login: $username) {
                ${OWNER_REPOS_PAGE}
              }
            }
          `,
          { username: login, after: page.endCursor },
          NextRepoPage,
        );
        nodes.push(...next.user.repositories.nodes);
        page = next.user.repositories.pageInfo;
      }

      return { pinned, owned: nodes.map(normalizeRepo) } satisfies RepoLists;
    }),
  () => TTL_SHORT,
);

/** Pinned repositories and the owner's public repositories (newest first), fetched together. */
export function getRepoLists(username: string): Effect.Effect<RepoLists, GithubError> {
  return Cache.get(repoLists, userKey(username));
}

/** How each kind of GitHub data a banner draws is loaded (see `meta.githubData`). */
export const GITHUB_LOADERS = {
  user: (username: string) => getUserSummary(username),
  contributions: (username: string, year: string) => getContributions(username, year),
  repos: (username: string) => getRepoLists(username),
} satisfies Record<GithubDataKind, (username: string, year: string) => unknown>;
