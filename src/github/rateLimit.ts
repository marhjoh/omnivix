/**
 * Set by the export's render page, instead of drawing the banner, when GitHub's limit is reached;
 * holds the reset time (ISO). The headless browser reads it, so the export can say why it failed.
 */
export const GITHUB_LIMIT_ATTRIBUTE = "data-github-limit-until";

/** Used when GitHub reports a limit without saying when it resets. */
const DEFAULT_WAIT_MS = 60_000;

/** GitHub's rate limit for the app's token is reached; requests work again at `resetAt`. */
export class GithubRateLimitError extends Error {
  constructor(readonly resetAt: Date) {
    super(`GitHub rate limit reached; resets at ${resetAt.toISOString()}`);
    this.name = "GithubRateLimitError";
  }
}

type Headers = Record<string, string | number | undefined>;

/** When the limit resets, from `retry-after` (seconds from now) or `x-ratelimit-reset` (epoch seconds). */
function resetTime(headers: Headers | undefined, now: number): Date {
  const retryAfter = Number(headers?.["retry-after"]);
  if (retryAfter > 0) return new Date(now + retryAfter * 1000);
  const reset = Number(headers?.["x-ratelimit-reset"]);
  if (reset > 0) return new Date(reset * 1000);
  return new Date(now + DEFAULT_WAIT_MS);
}

/**
 * When the limit resets, if `error` is GitHub's rate limit: a GraphQL `RATE_LIMITED` error, or an
 * HTTP 429, or a 403 with no requests left or a `retry-after` (GitHub's secondary limits).
 */
export function rateLimitResetAt(error: unknown, now = Date.now()): Date | null {
  const e = error as {
    errors?: Array<{ type?: string }>;
    headers?: Headers;
    status?: number;
    response?: { headers?: Headers };
  } | null;
  if (Array.isArray(e?.errors) && e.errors.some((err) => err.type === "RATE_LIMITED")) {
    return resetTime(e.headers, now);
  }
  const headers = e?.response?.headers;
  const limited =
    e?.status === 429 ||
    (e?.status === 403 &&
      (String(headers?.["x-ratelimit-remaining"]) === "0" ||
        headers?.["retry-after"] !== undefined));
  return limited ? resetTime(headers, now) : null;
}

/** Until when this server instance knows GitHub is limited; requests before then aren't sent. */
let limitedUntil = 0;

/**
 * Runs a GitHub request, turning a rate limit into a GithubRateLimitError. Until the limit
 * resets, requests fail right away instead of spending more of it, and the hit is logged once.
 */
export async function guardRateLimit<T>(request: () => Promise<T>): Promise<T> {
  if (Date.now() < limitedUntil) throw new GithubRateLimitError(new Date(limitedUntil));
  try {
    return await request();
  } catch (error) {
    const resetAt = rateLimitResetAt(error);
    if (!resetAt) throw error;
    limitedUntil = resetAt.getTime();
    const rateLimited = new GithubRateLimitError(resetAt);
    console.warn(rateLimited.message);
    throw rateLimited;
  }
}
