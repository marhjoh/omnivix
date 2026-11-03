import type { GithubDataKind } from "@/src/types/template";
import type { PreviewContentState, PreviewProblem } from "./types";
import type { ApiLimit } from "@/src/lib/apiError";
import { LIMIT_TITLES, TRY_AGAIN_SOON, tryAgainAt } from "@/src/lib/rateLimitMessage";

export function computePreviewContentState(params: {
  needsUsername: boolean;
  username: string;
  /** A required field (other than the username), such as the quote, is empty. */
  missingContent: boolean;
  dataError: string | null;
  dataReady: boolean;
}): PreviewContentState {
  const username = params.username.trim();

  if ((params.needsUsername && !username) || params.missingContent) {
    return "empty";
  }

  if (params.dataError) {
    return "error";
  }

  if (params.needsUsername && !params.dataReady) {
    return "loading";
  }

  return "ready";
}

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

const DATA_NAMES: Record<GithubDataKind, string> = {
  user: "profile",
  contributions: "contributions",
  repos: "repositories",
};

/** "Loading profile and contributions…", from the GitHub data the banner draws. */
export function previewLoadingMessage(githubData: readonly GithubDataKind[]): string {
  return githubData.length > 0
    ? `Loading ${githubData.map((kind) => DATA_NAMES[kind]).join(" and ")}…`
    : "Loading…";
}

/**
 * GitHub banners wait for a username; the quote banner for its quote. The action opens the
 * username dialog, or puts the cursor in that setting's field.
 */
export function previewEmptyCopy(needsUsername: boolean): {
  title: string;
  description: string;
  action: { label: string; setting: "username" | "quote" };
} {
  return needsUsername
    ? {
        title: "Choose a GitHub username",
        description: "Enter a username to load this banner's data.",
        action: { label: "Choose username", setting: "username" },
      }
    : {
        title: "Add your quote",
        description: "Enter quote text in the sidebar to see it here.",
        action: { label: "Add quote", setting: "quote" },
      };
}
