import { NextResponse } from "next/server";
import type { TimedLimit } from "@/src/lib/apiError";
import { LIMIT_TITLES } from "@/src/lib/rateLimitMessage";

/** A limit's 429: `limit` names it and `resetAt` says when to try again, in the visitor's time. */
export function tooManyRequests(limit: TimedLimit, resetAt: Date) {
  const seconds = Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000));
  return NextResponse.json(
    { error: `${LIMIT_TITLES[limit]}.`, limit, resetAt: resetAt.toISOString() },
    { status: 429, headers: { "Retry-After": String(seconds) } },
  );
}
