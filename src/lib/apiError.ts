/** Limits our API names in its 429 body, with the time they reset. */
export const TIMED_LIMITS = ["github", "requests"] as const;

export type TimedLimit = (typeof TIMED_LIMITS)[number];

/**
 * Why a request was refused: a limit our API names (GitHub's, or Omnivix's own per-IP limit on
 * the GitHub data routes), or the export's Vercel Firewall rule, whose bare 429 has no reset time.
 */
export type ApiLimit = { kind: TimedLimit; resetAt: Date } | { kind: "firewall" };

export function limitResetAt(limit: ApiLimit | null): Date | null {
  return limit && limit.kind !== "firewall" ? limit.resetAt : null;
}

/**
 * Reads our API's error body: a message to show as is, and the limit that refused the request.
 * Platform errors (a timeout page, an HTML 500, Vercel's own JSON error with an object in
 * `error`) have no message, so the caller uses its own fallback.
 */
export async function readApiError(
  response: Response,
): Promise<{ message: string | null; limit: ApiLimit | null }> {
  const body = (await response.json().catch(() => ({}))) as {
    error?: unknown;
    limit?: unknown;
    resetAt?: unknown;
  };
  return {
    message: typeof body.error === "string" ? body.error : null,
    limit: limitOf(response.status, body),
  };
}

function limitOf(status: number, { limit, resetAt }: { limit?: unknown; resetAt?: unknown }) {
  if (isTimedLimit(limit) && typeof resetAt === "string") {
    return { kind: limit, resetAt: new Date(resetAt) } satisfies ApiLimit;
  }
  if (status === 429) return { kind: "firewall" } satisfies ApiLimit;
  return null;
}

function isTimedLimit(value: unknown): value is TimedLimit {
  return TIMED_LIMITS.includes(value as TimedLimit);
}
