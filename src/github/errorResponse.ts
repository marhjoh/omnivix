import { NextResponse } from "next/server";
import { isUserNotFound } from "@/src/github/client";

/**
 * Response for a failed GitHub request: 404 when the user doesn't exist (the studio then offers to
 * change the username), otherwise 502 with `message`.
 */
export function githubErrorResponse(error: unknown, username: string, message: string) {
  if (isUserNotFound(error)) {
    return NextResponse.json({ error: `No GitHub user named @${username}` }, { status: 404 });
  }
  return NextResponse.json({ error: message }, { status: 502 });
}
