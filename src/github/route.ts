import { NextResponse, type NextRequest } from "next/server";
import { isUserNotFound } from "@/src/github/client";
import { GithubRateLimitError } from "@/src/github/rateLimit";
import { isGithubUsername } from "@/src/lib/githubUsername";
import { requestLimit } from "@/src/lib/requestLimit";
import { tooManyRequests } from "@/src/lib/tooManyRequests";

/**
 * Per IP, so one visitor can't spend the token's GitHub quota for everyone. Loading a user takes
 * up to three requests and switching year one more; CDN hits don't reach the server or count.
 */
const githubDataLimit = requestLimit("github-data", 60, "10 m");

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
  }: { failure: string; ttlMs: number; load: (username: string) => Promise<T> },
) {
  const username = request.nextUrl.searchParams.get("username")?.trim() ?? "";
  if (!isGithubUsername(username)) return githubUserNotFound(username);
  const limitedUntil = await githubDataLimit(request);
  if (limitedUntil) return tooManyRequests("requests", limitedUntil);
  try {
    return NextResponse.json(await load(username), {
      headers: { "Cache-Control": `public, s-maxage=${Math.round(ttlMs / 1000)}` },
    });
  } catch (error) {
    if (isUserNotFound(error)) return githubUserNotFound(username);
    if (error instanceof GithubRateLimitError) return tooManyRequests("github", error.resetAt);
    console.error(failure, error);
    return NextResponse.json({ error: failure }, { status: 502 });
  }
}
