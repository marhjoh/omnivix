import "server-only";
import { Effect } from "effect";
import { GithubRateLimited } from "@/src/github/errors";
import type { GithubQuota } from "@/src/github/graphql";

/** Used when GitHub reports a limit without saying when it resets. */
const DEFAULT_WAIT_MS = 60_000;

/** When the limit resets, from `retry-after` (seconds from now) or `x-ratelimit-reset` (epoch seconds). */
function resetTime(headers: Headers, now: number): Date {
  const retryAfter = Number(headers.get("retry-after"));
  if (retryAfter > 0) return new Date(now + retryAfter * 1000);
  const reset = Number(headers.get("x-ratelimit-reset"));
  if (reset > 0) return new Date(reset * 1000);
  return new Date(now + DEFAULT_WAIT_MS);
}

/**
 * Returns when the limit resets if the response is a rate limit, otherwise null. GitHub signals it
 * with a GraphQL `RATE_LIMITED` error, an HTTP 429, or a 403 with no requests left or a
 * `retry-after` header (its secondary limits).
 */
export function rateLimitResetAt(
  response: { status: number; headers: Headers },
  errors: ReadonlyArray<{ readonly type?: string | undefined }> = [],
  now = Date.now(),
): Date | null {
  const { status, headers } = response;
  const limited =
    errors.some((error) => error.type === "RATE_LIMITED") ||
    status === 429 ||
    (status === 403 &&
      (headers.get("x-ratelimit-remaining") === "0" || headers.has("retry-after")));
  return limited ? resetTime(headers, now) : null;
}

/** This server instance sends no GitHub requests before this time. */
let limitedUntil = 0;

/**
 * Runs a GitHub request. After a rate limit hit, later requests fail right away until the limit
 * resets, so they don't use up more of it. The hit is logged once.
 */
export function guardRateLimit<A, E>(request: Effect.Effect<A, E | GithubRateLimited>) {
  return Effect.suspend(() =>
    Date.now() < limitedUntil
      ? Effect.fail(new GithubRateLimited({ resetAt: new Date(limitedUntil) }))
      : request.pipe(
          Effect.tapError((error) =>
            Effect.sync(() => {
              if (!(error instanceof GithubRateLimited)) return;
              limitedUntil = error.resetAt.getTime();
              console.warn(`GitHub rate limit reached; resets at ${error.resetAt.toISOString()}`);
            }),
          ),
        ),
  );
}

const LOW_QUOTA_SHARE = 0.1;

/** The reset time of the quota window this server instance already warned about. */
let warnedFor = "";

/**
 * Logs a warning once per quota window when less than 10% of the token's quota is left, so
 * heavy use shows up in the logs before the limit stops the studio and exports.
 */
export function warnIfQuotaLow({ limit, remaining, resetAt }: GithubQuota) {
  if (remaining >= limit * LOW_QUOTA_SHARE || warnedFor === resetAt) return;
  warnedFor = resetAt;
  console.warn(`GitHub quota low: ${remaining} of ${limit} left; resets at ${resetAt}`);
}
