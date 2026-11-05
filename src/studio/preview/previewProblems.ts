import type { PreviewProblem } from "./types";
import type { ApiLimit } from "@/src/lib/apiError";
import { LIMIT_TITLES, TRY_AGAIN_SOON, tryAgainAt } from "@/src/lib/rateLimitMessage";

// Problems with the GitHub data that keep the preview from showing the banner (see PreviewStatus).

/**
 * A failed GitHub request. A rate limit says when it resets and keeps "Try again" disabled until
 * then. A bare 429 from the platform has no reset time. A user that doesn't exist can't be retried,
 * only changed. Anything else shows the server's message with a retry.
 */
export function fetchProblem({
  error,
  limit,
  notFound,
  username,
}: {
  error: string;
  limit: ApiLimit | null;
  notFound: boolean;
  username: string;
}): PreviewProblem {
  if (limit?.kind === "firewall") {
    return { title: LIMIT_TITLES.requests, hint: TRY_AGAIN_SOON, action: "retry" };
  }
  if (limit) {
    return {
      title: LIMIT_TITLES[limit.kind],
      hint: tryAgainAt(limit.resetAt),
      action: "retry",
      retryAt: limit.resetAt,
    };
  }
  if (notFound) {
    return {
      title: `No GitHub user named @${username.trim()}`,
      hint: "Check the spelling, or choose another username.",
      action: "change-username",
    };
  }
  return {
    // Used as a heading, so drop the closing period. The message has one elsewhere.
    title: error.replace(/\.$/, ""),
    hint: "Check the username or your connection, then try again.",
    action: "retry",
  };
}

/**
 * The repos banner has no repositories to show. Only the user can fix that (pick or pin some), so
 * there's no retry.
 */
export function noReposProblem(mode: string, selectedRepos: string): PreviewProblem {
  if (mode !== "selected") {
    return {
      title: "No pinned repositories",
      hint: "Pin repositories on your GitHub profile, or switch to Selected mode.",
    };
  }
  return {
    title: selectedRepos.trim() ? "No matching repositories" : "No repositories selected",
    hint: "Choose public repositories from the list in the sidebar.",
  };
}
