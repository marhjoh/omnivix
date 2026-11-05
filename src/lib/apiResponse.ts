import "server-only";
import { Effect } from "effect";
import { NextResponse } from "next/server";
import type { TimedLimit } from "@/src/lib/apiError";
import { LIMIT_TITLES } from "@/src/lib/rateLimitMessage";
import type { GithubRateLimited } from "@/src/github/errors";
import { countStats } from "@/src/stats/stats";
import { limitFields } from "@/src/stats/statFields";

// The API's error responses. `readApiError` (apiError.ts) reads them in the browser, so keep the
// two in sync.

export function errorResponse(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/**
 * A 429 that names the limit. `resetAt` is an absolute time, so the browser can show it in the
 * visitor's time zone. Each one counts in the admin stats.
 */
export function tooManyRequests(limit: TimedLimit, resetAt: Date) {
  countStats(limitFields(limit));
  const seconds = Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000));
  return NextResponse.json(
    { error: `${LIMIT_TITLES[limit]}.`, limit, resetAt: resetAt.toISOString() },
    { status: 429, headers: { "Retry-After": String(seconds) } },
  );
}

/** A 404 that points at `state.username`, so the studio can offer to change it. */
export function githubUserNotFound(username: string) {
  return errorResponse(`No GitHub user named @${username}`, 404, {
    issues: [{ path: "state.username", message: "No GitHub user with this name" }],
  });
}

/**
 * `Effect.catchTags` handlers that turn GitHub errors into responses. The GitHub routes use them,
 * and so does the export, because its render page loads GitHub data.
 */
export function githubErrorResponses(username: string) {
  return {
    GithubRateLimited: ({ resetAt }: GithubRateLimited) =>
      Effect.succeed(tooManyRequests("github", resetAt)),
    GithubUserNotFound: () => Effect.succeed(githubUserNotFound(username)),
  };
}
