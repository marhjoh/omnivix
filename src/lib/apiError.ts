import { isOneOf } from "@/src/lib/isOneOf";

/** Limits the API names in its 429 body, along with when they reset. */
const TIMED_LIMITS = ["github", "requests", "daily-exports", "banner-images"] as const;

export type TimedLimit = (typeof TIMED_LIMITS)[number];

/**
 * Why a request was refused. Either a limit the API names (GitHub's or one of Omnivix's own), or
 * the export's Vercel Firewall rule. The firewall sends a bare 429 with no reset time.
 */
export type ApiLimit = { kind: TimedLimit; resetAt: Date } | { kind: "firewall" };

export function limitResetAt(limit: ApiLimit | null): Date | null {
  return limit && limit.kind !== "firewall" ? limit.resetAt : null;
}

/**
 * Reads the API's error body: the message to show and the limit that refused the request. Platform
 * errors give no message. Those are a timeout page, an HTML 500, or Vercel's own JSON error, which
 * has an object in `error`.
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
  if (isOneOf(TIMED_LIMITS, limit) && typeof resetAt === "string") {
    return { kind: limit, resetAt: new Date(resetAt) } satisfies ApiLimit;
  }
  if (status === 429) return { kind: "firewall" } satisfies ApiLimit;
  return null;
}
