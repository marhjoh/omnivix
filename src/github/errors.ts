import "server-only";
import { Schema } from "effect";

// Ways a GitHub request can fail. The API routes turn each into a response (see githubRoute). The
// render page turns them into a marker that the export reads (see renderProblem.ts).

/** The app's token hit GitHub's rate limit. Requests work again at `resetAt`. */
export class GithubRateLimited extends Schema.TaggedError<GithubRateLimited>()(
  "GithubRateLimited",
  { resetAt: Schema.Date },
) {}

/** The requested GitHub user doesn't exist. */
export class GithubUserNotFound extends Schema.TaggedError<GithubUserNotFound>()(
  "GithubUserNotFound",
  {},
) {}

/**
 * Any other failure, like GitHub being down or slow, an HTTP or GraphQL error, or a response in
 * the wrong shape. `transient` failures (network, timeout, 5xx) are retried once.
 */
export class GithubRequestFailed extends Schema.TaggedError<GithubRequestFailed>()(
  "GithubRequestFailed",
  { cause: Schema.Defect(), transient: Schema.Boolean },
) {}

export type GithubError = GithubRateLimited | GithubUserNotFound | GithubRequestFailed;
