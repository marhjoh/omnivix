import "server-only";
import { Effect, Schedule, Schema } from "effect";
import { GithubRateLimited, GithubRequestFailed, GithubUserNotFound } from "@/src/github/errors";
import { guardRateLimit, rateLimitResetAt, warnIfQuotaLow } from "@/src/github/rateLimit";

const ENDPOINT = "https://api.github.com/graphql";

/** The limit for one request. The studio page waits far less (initialGithubData). */
const REQUEST_TIMEOUT = "10 seconds";

/** Added to every query so a low quota gets logged (see warnIfQuotaLow). It costs nothing. */
export const QUOTA_FIELDS = `
  rateLimit {
    limit
    remaining
    resetAt
  }
`;

const Envelope = Schema.Struct({
  data: Schema.optional(Schema.NullOr(Schema.Unknown)),
  errors: Schema.optional(
    Schema.Array(
      Schema.Struct({
        type: Schema.optional(Schema.String),
        path: Schema.optional(Schema.Array(Schema.Unknown)),
        message: Schema.optional(Schema.String),
      }),
    ),
  ),
});

const GithubQuota = Schema.Struct({
  limit: Schema.Number,
  remaining: Schema.Number,
  resetAt: Schema.String,
});

/** The token's quota, as GitHub's GraphQL `rateLimit` field reports it. */
export type GithubQuota = typeof GithubQuota.Type;

const Quota = Schema.Struct({ rateLimit: Schema.optional(GithubQuota) });

const failed = (cause: unknown, transient = false) => new GithubRequestFailed({ cause, transient });

function post(body: string) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return Effect.die(new Error("GITHUB_TOKEN is not set"));
  return Effect.tryPromise({
    try: (signal) =>
      fetch(ENDPOINT, {
        method: "POST",
        headers: {
          authorization: `bearer ${token}`,
          "content-type": "application/json",
          "user-agent": "omnivix",
        },
        body,
        signal,
      }),
    catch: (cause) => failed(cause, true),
  }).pipe(
    Effect.timeoutOrElse({
      duration: REQUEST_TIMEOUT,
      orElse: () => Effect.fail(failed(new Error("GitHub took too long to answer"), true)),
    }),
  );
}

/**
 * Runs a GraphQL query against GitHub and decodes `data` with `schema`. Network errors, timeouts
 * and 5xx responses are retried once.
 */
export function githubQuery<S extends Schema.Decoder<unknown>>(
  query: string,
  variables: Record<string, unknown>,
  schema: S,
): Effect.Effect<S["Type"], GithubRateLimited | GithubUserNotFound | GithubRequestFailed> {
  const request = Effect.gen(function* () {
    const response = yield* post(JSON.stringify({ query, variables }));
    const body = yield* Effect.tryPromise({
      try: () => response.json() as Promise<unknown>,
      catch: (cause) => failed(cause, response.status >= 500),
    }).pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(Envelope)),
      Effect.mapError((cause) =>
        cause instanceof GithubRequestFailed ? cause : failed(cause, response.status >= 500),
      ),
    );
    const errors = body.errors ?? [];
    const resetAt = rateLimitResetAt(response, errors);
    if (resetAt) return yield* new GithubRateLimited({ resetAt });
    if (errors.some((error) => error.type === "NOT_FOUND" && error.path?.[0] === "user")) {
      return yield* new GithubUserNotFound();
    }
    if (!response.ok || errors.length > 0) {
      const messages = errors.map((error) => error.message).join("; ");
      return yield* failed(
        new Error(`GitHub answered HTTP ${response.status}${messages ? `: ${messages}` : ""}`),
        response.status >= 500,
      );
    }
    const { rateLimit } = yield* Schema.decodeUnknownEffect(Quota)(body.data).pipe(
      Effect.mapError((cause) => failed(cause)),
    );
    if (rateLimit) warnIfQuotaLow(rateLimit);
    return yield* Schema.decodeUnknownEffect(schema)(body.data).pipe(
      Effect.mapError((cause) => failed(cause)),
    );
  });
  return guardRateLimit(
    request.pipe(
      Effect.retry({
        times: 1,
        schedule: Schedule.spaced("300 millis"),
        while: (error) => error instanceof GithubRequestFailed && error.transient,
      }),
    ),
  );
}
