/**
 * Reads our API's error body: a message to show as is, and when GitHub's rate limit resets.
 * Platform errors (a timeout page, an HTML 500, Vercel's own JSON error with an object in
 * `error`) have neither, so the caller uses its own fallback.
 */
export async function readApiError(
  response: Response,
): Promise<{ message: string | null; resetAt: Date | null }> {
  const body = (await response.json().catch(() => ({}))) as { error?: unknown; resetAt?: unknown };
  return {
    message: typeof body.error === "string" ? body.error : null,
    resetAt: typeof body.resetAt === "string" ? new Date(body.resetAt) : null,
  };
}
