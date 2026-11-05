import "server-only";
import { Cause, Effect } from "effect";
import { NextResponse, type NextRequest } from "next/server";
import type { GithubError } from "@/src/github/errors";
import { isGithubUsername } from "@/src/lib/githubUsername";
import { githubDataLimit } from "@/src/lib/requestLimits";
import {
  errorResponse,
  githubErrorResponses,
  githubUserNotFound,
  tooManyRequests,
} from "@/src/lib/apiResponse";

/**
 * Shared handler for the GitHub API routes, which take `?username=`. An invalid username gets a
 * 404, so the studio offers to change it. Unexpected failures are logged and return 502 with
 * `failure`. The CDN caches the data for `ttlMs`, the same as the server cache, so repeat requests
 * don't reach this server.
 */
export async function githubRoute<T>(
  request: NextRequest,
  {
    failure,
    ttlMs,
    load,
  }: { failure: string; ttlMs: number; load: (username: string) => Effect.Effect<T, GithubError> },
): Promise<Response> {
  const username = request.nextUrl.searchParams.get("username")?.trim() ?? "";
  if (!isGithubUsername(username)) return githubUserNotFound(username);
  const limitedUntil = await githubDataLimit(request);
  if (limitedUntil) return tooManyRequests("requests", limitedUntil);
  return Effect.runPromise(
    load(username).pipe(
      Effect.map((data) =>
        NextResponse.json(data, {
          headers: { "Cache-Control": `public, s-maxage=${Math.round(ttlMs / 1000)}` },
        }),
      ),
      Effect.catchTags(githubErrorResponses(username)),
      Effect.catchCause((cause) =>
        Effect.sync(() => {
          console.error(failure, Cause.pretty(cause));
          return errorResponse(failure, 502);
        }),
      ),
    ),
  );
}
