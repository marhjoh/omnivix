import type { PreviewProblem } from "./types";
import type { ApiLimit } from "@/src/lib/apiError";
import { LIMIT_TITLES, TRY_AGAIN_SOON, tryAgainAt } from "@/src/lib/rateLimitMessage";

// Why the preview can't show the banner, from the GitHub data: shown in place of it (PreviewStatus).

/** A GitHub request failed: the server's message, with a hint and a retry. */
export function fetchErrorProblem(message: string): PreviewProblem {
  return {
    // A heading, so no closing period (the same message ends with one elsewhere).
    title: message.replace(/\.$/, ""),
    hint: "Check the username or your connection, then try again.",
    action: "retry",
  };
}

/**
 * A rate limit refused the GitHub data: say when it resets, and keep "Try again" off until then.
 * A bare 429 from the platform has no reset time.
 */
export function limitProblem(limit: ApiLimit): PreviewProblem {
  if (limit.kind === "firewall") {
    return { title: LIMIT_TITLES.requests, hint: TRY_AGAIN_SOON, action: "retry" };
  }
  return {
    title: LIMIT_TITLES[limit.kind],
    hint: tryAgainAt(limit.resetAt),
    action: "retry",
    retryAt: limit.resetAt,
  };
}

/** A failed GitHub request: the limit that refused it, a user that doesn't exist, or its error. */
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
  if (limit) return limitProblem(limit);
  if (notFound) return userNotFoundProblem(username);
  return fetchErrorProblem(error);
}

/** GitHub has no user by that name; retrying can't help, choosing another username can. */
export function userNotFoundProblem(username: string): PreviewProblem {
  return {
    title: `No GitHub user named @${username.trim()}`,
    hint: "Check the spelling, or choose another username.",
    action: "change-username",
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
  return selectedRepos.trim()
    ? {
        title: "No matching repositories",
        hint: "Choose public repositories from the list in the sidebar.",
      }
    : {
        title: "No repositories selected",
        hint: "Choose public repositories from the list in the sidebar.",
      };
}
