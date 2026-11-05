import "server-only";
import { Schema } from "effect";

// Why a GitHub request failed. The routes turn each into its response (see githubRoute), and the
// render page into a marker the export reads (see renderProblem.ts).

/** GitHub's rate limit for the app's token is reached; requests work again at `resetAt`. */
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
 * Any other failure: GitHub unreachable or slow, an HTTP or GraphQL error, or a response that
 * doesn't match what we asked for. `transient` ones (network, timeout, 5xx) are retried once.
 */
export class GithubRequestFailed extends Schema.TaggedError<GithubRequestFailed>()(
  "GithubRequestFailed",
  { cause: Schema.Defect(), transient: Schema.Boolean },
) {}

export type GithubError = GithubRateLimited | GithubUserNotFound | GithubRequestFailed;
