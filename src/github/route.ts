import { NextResponse, type NextRequest } from "next/server";
import { isUserNotFound } from "@/src/github/client";

/** GitHub's rules: letters, digits and single hyphens (not at the ends), at most 39 characters. */
const GITHUB_USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

function userNotFound(username: string) {
  return NextResponse.json({ error: `No GitHub user named @${username}` }, { status: 404 });
}

/**
 * Shared GitHub API route: reads and checks `?username=`, runs `load` and returns its JSON.
 * A username that doesn't exist (or can't, by GitHub's rules) is a 404, so the studio offers to
 * change it; other failures are logged and return 502 with `failure`.
 */
export async function githubRoute<T>(
  request: NextRequest,
  failure: string,
  load: (username: string) => Promise<T>,
) {
  const username = request.nextUrl.searchParams.get("username")?.trim() ?? "";
  if (!GITHUB_USERNAME.test(username)) return userNotFound(username);
  try {
    return NextResponse.json(await load(username));
  } catch (error) {
    if (isUserNotFound(error)) return userNotFound(username);
    console.error(failure, error);
    return NextResponse.json({ error: failure }, { status: 502 });
  }
}
