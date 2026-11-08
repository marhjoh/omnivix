import "server-only";
import { Effect, Schema } from "effect";
import type { GithubError } from "@/src/github/errors";
import { githubQuery, QUOTA_FIELDS } from "@/src/github/api";
import { SITE_LINKS } from "@/src/lib/site";

const QUERY = `
  query RepoStars($owner: String!, $name: String!) {
    ${QUOTA_FIELDS}
    repository(owner: $owner, name: $name) { stargazerCount }
  }
`;

const RepoStars = Schema.Struct({
  repository: Schema.Struct({ stargazerCount: Schema.Number }),
});

/**
 * Omnivix's stars on GitHub. Only the total: listing who starred, with dates, needs a token that
 * can write to repos.
 */
export function starCount(): Effect.Effect<number, GithubError> {
  const [, owner, name] = new URL(SITE_LINKS.repo).pathname.split("/");
  return githubQuery(QUERY, { owner, name }, RepoStars).pipe(
    Effect.map(({ repository }) => repository.stargazerCount),
  );
}
