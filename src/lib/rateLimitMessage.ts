// Wording for rate limits, shared by the API routes, the studio preview, the repository picker and
// the export, so every place says it the same way.

import type { ApiLimit, TimedLimit } from "@/src/lib/apiError";

export const LIMIT_TITLES: Record<TimedLimit, string> = {
  github: "GitHub's limit is reached",
  requests: "Too many requests",
};

/** A bare 429 (the export's Vercel Firewall rule) doesn't say when its window ends. */
export const TRY_AGAIN_SOON = "Try again in a few minutes.";

export const EXPORT_LIMIT_MESSAGE = `Too many exports. ${TRY_AGAIN_SOON}`;

export const REQUEST_LIMIT_MESSAGE = `${LIMIT_TITLES.requests}. ${TRY_AGAIN_SOON}`;

/** "Try again at 14:05.", in the visitor's own time and clock format. */
export function tryAgainAt(at: Date): string {
  return `Try again at ${at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`;
}

/** The full sentence for a toast or the repository picker; `firewallMessage` for a bare 429. */
export function limitMessage(limit: ApiLimit, firewallMessage: string): string {
  if (limit.kind === "firewall") return firewallMessage;
  return `${LIMIT_TITLES[limit.kind]}. ${tryAgainAt(limit.resetAt)}`;
}
