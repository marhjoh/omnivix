import { NextResponse, type NextRequest } from "next/server";
import { isUserNotFound } from "@/src/github/client";
import { GithubRateLimitError } from "@/src/github/rateLimit";
import { GITHUB_LIMIT_TITLE } from "@/src/lib/rateLimitMessage";

/** GitHub's rules: letters, digits and single hyphens (not at the ends), at most 39 characters. */
const GITHUB_USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

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
 * GitHub's rate limit as a 429: `resetAt` lets the studio say when to try again, in the visitor's
 * own time. Also used by the export, whose render page loads the same GitHub data.
 */
export function githubRateLimited({ resetAt }: GithubRateLimitError) {
  const seconds = Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000));
  return NextResponse.json(
    { error: `${GITHUB_LIMIT_TITLE}.`, resetAt: resetAt.toISOString() },
    { status: 429, headers: { "Retry-After": String(seconds) } },
  );
}

/**
 * Shared GitHub API route: reads and checks `?username=`, runs `load` and returns its JSON.
 * A username that doesn't exist (or can't, by GitHub's rules) is a 404, so the studio offers to
 * change it; GitHub's rate limit is a 429 (githubRateLimited); other failures are logged and return
 * 502 with `failure`.
 */
export async function githubRoute<T>(
  request: NextRequest,
  failure: string,
  load: (username: string) => Promise<T>,
) {
  const username = request.nextUrl.searchParams.get("username")?.trim() ?? "";
  if (!GITHUB_USERNAME.test(username)) return githubUserNotFound(username);
  try {
    return NextResponse.json(await load(username));
  } catch (error) {
    if (isUserNotFound(error)) return githubUserNotFound(username);
    if (error instanceof GithubRateLimitError) return githubRateLimited(error);
    console.error(failure, error);
    return NextResponse.json({ error: failure }, { status: 502 });
  }
}
