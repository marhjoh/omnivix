import { Effect } from "effect";
import { GithubRateLimited } from "@/src/github/errors";

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
 * When the limit resets, if a GitHub response is its rate limit: a GraphQL `RATE_LIMITED` error,
 * an HTTP 429, or a 403 with no requests left or a `retry-after` (GitHub's secondary limits).
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

/** Until when this server instance knows GitHub is limited; requests before then aren't sent. */
let limitedUntil = 0;

/**
 * Runs a GitHub request. Once it hits the rate limit, requests fail right away until the limit
 * resets instead of spending more of it, and the hit is logged once.
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

/** The token's quota, as GitHub's GraphQL `rateLimit` field reports it. */
export type GithubQuota = { limit: number; remaining: number; resetAt: string };

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
