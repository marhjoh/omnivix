import { Cause, Effect } from "effect";
import { NextResponse, type NextRequest } from "next/server";
import type { GithubError } from "@/src/github/errors";
import { isGithubUsername } from "@/src/lib/githubUsername";
import { githubDataLimit, tooManyRequests } from "@/src/lib/requestLimits";

/** The user doesn't exist, as a 404 naming `state.username`. Also used by the export. */
export function githubUserNotFound(username: string) {
  return NextResponse.json(
    {
      error: `No GitHub user named @${username}`,
      issues: [{ path: "state.username", message: "No GitHub user with this name" }],
    },
    { status: 404 },
  );
}

/**
 * Shared GitHub API route: reads and checks `?username=`, runs `load` and returns its JSON.
 * A username that doesn't exist (or can't, by GitHub's rules) is a 404, so the studio offers to
 * change it. Our per-IP limit and GitHub's rate limit are 429s (tooManyRequests); other failures are
 * logged and return 502 with `failure`. Only the data is cached by the CDN, for `ttlMs` (the server
 * cache's TTL), so repeat requests for a user don't reach this server or GitHub.
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
      Effect.catchTags({
        GithubUserNotFound: () => Effect.succeed(githubUserNotFound(username)),
        GithubRateLimited: ({ resetAt }) => Effect.succeed(tooManyRequests("github", resetAt)),
      }),
      Effect.catchCause((cause) =>
        Effect.sync(() => {
          console.error(failure, Cause.pretty(cause));
          return NextResponse.json({ error: failure }, { status: 502 });
        }),
      ),
    ),
  );
}
