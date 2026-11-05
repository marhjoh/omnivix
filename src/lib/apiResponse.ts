import "server-only";
import { Effect } from "effect";
import { NextResponse } from "next/server";
import type { TimedLimit } from "@/src/lib/apiError";
import { LIMIT_TITLES } from "@/src/lib/rateLimitMessage";
import type { GithubRateLimited } from "@/src/github/errors";

// The API's error responses; `readApiError` (apiError.ts) reads them in the browser.

/** `{ error }` with `status`, plus any `extra` fields. */
export function errorResponse(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** A limit's 429: `limit` names it and `resetAt` says when to try again, in the visitor's time. */
export function tooManyRequests(limit: TimedLimit, resetAt: Date) {
  const seconds = Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000));
  return NextResponse.json(
    { error: `${LIMIT_TITLES[limit]}.`, limit, resetAt: resetAt.toISOString() },
    { status: 429, headers: { "Retry-After": String(seconds) } },
  );
}

/** The user doesn't exist, as a 404 naming `state.username`. */
export function githubUserNotFound(username: string) {
  return errorResponse(`No GitHub user named @${username}`, 404, {
    issues: [{ path: "state.username", message: "No GitHub user with this name" }],
  });
}

/**
 * Responses for the GitHub problems every route that loads GitHub data can hit, for
 * `Effect.catchTags`: the GitHub routes, and the export (its render page loads the data).
 */
export function githubErrorResponses(username: string) {
  return {
    GithubRateLimited: ({ resetAt }: GithubRateLimited) =>
      Effect.succeed(tooManyRequests("github", resetAt)),
    GithubUserNotFound: () => Effect.succeed(githubUserNotFound(username)),
  };
}
