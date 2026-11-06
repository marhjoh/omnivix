import "server-only";
import { Cause, Effect, Exit, Schema } from "effect";
import type { GithubError } from "@/src/github/errors";
import { githubQuery, QUOTA_FIELDS } from "@/src/github/graphql";
import { SITE_LINKS } from "@/src/lib/site";

/** GitHub lists at most 100 per page. Fifty pages cover the first 5,000 stars. */
const PAGE_SIZE = 100;
const MAX_PAGES = 50;

const QUERY = `
  query RepoStars($owner: String!, $name: String!, $after: String) {
    ${QUOTA_FIELDS}
    repository(owner: $owner, name: $name) {
      stargazerCount
      stargazers(first: ${PAGE_SIZE}, after: $after, orderBy: { field: STARRED_AT, direction: ASC }) {
        totalCount
        edges { starredAt }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

const StarPage = Schema.Struct({
  repository: Schema.Struct({
    stargazerCount: Schema.Number,
    stargazers: Schema.Struct({
      edges: Schema.Array(Schema.Struct({ starredAt: Schema.String })),
      pageInfo: Schema.Struct({
        hasNextPage: Schema.Boolean,
        endCursor: Schema.NullOr(Schema.String),
      }),
    }),
  }),
});

export type RepoStars = {
  total: number;
  /**
   * New stars by UTC date. Null when the token can't list who starred: fine-grained tokens see the
   * total but an empty list. Stars that were removed again don't show.
   */
  perDay: Record<string, number> | null;
};

/** Omnivix's own stars, or null when GitHub can't be reached. */
export async function loadRepoStars(): Promise<RepoStars | null> {
  const exit = await Effect.runPromiseExit(repoStars());
  if (Exit.isSuccess(exit)) return exit.value;
  console.error("Stars couldn't be loaded", Cause.pretty(exit.cause));
  return null;
}

/** GitHub keeps the date of each star, so the history needs no storage. */
function repoStars(): Effect.Effect<RepoStars, GithubError> {
  const [, owner, name] = new URL(SITE_LINKS.repo).pathname.split("/");
  return Effect.gen(function* () {
    const perDay: Record<string, number> = {};
    let total = 0;
    let listed = 0;
    let after: string | null = null;
    for (let page = 0; page < MAX_PAGES; page++) {
      const result: typeof StarPage.Type = yield* githubQuery(
        QUERY,
        { owner, name, after },
        StarPage,
      );
      const { stargazerCount, stargazers } = result.repository;
      total = stargazerCount;
      listed += stargazers.edges.length;
      for (const { starredAt } of stargazers.edges) {
        const day = starredAt.slice(0, 10);
        perDay[day] = (perDay[day] ?? 0) + 1;
      }
      if (!stargazers.pageInfo.hasNextPage) break;
      after = stargazers.pageInfo.endCursor;
    }
    return { total, perDay: listed < total ? null : perDay };
  });
}
