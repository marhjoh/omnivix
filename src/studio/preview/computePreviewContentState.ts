import type { GithubDataKind } from "@/src/types/template";
import type { PreviewContentState, PreviewProblem } from "./types";

export function computePreviewContentState(params: {
  hydrated: boolean;
  needsUsername: boolean;
  username: string;
  /** A required field (other than the username), such as the quote, is empty. */
  missingContent: boolean;
  dataError: string | null;
  dataReady: boolean;
}): PreviewContentState {
  const username = params.username.trim();

  if (!params.hydrated) {
    return "loading";
  }

  if ((params.needsUsername && !username) || params.missingContent) {
    return "empty";
  }

  if (params.dataError) {
    return "error";
  }

  if (params.needsUsername && username && !params.dataReady) {
    return "loading";
  }

  return "ready";
}

/** A GitHub request failed: the server's message, with a hint and a retry. */
export function fetchErrorProblem(message: string): PreviewProblem {
  return {
    title: message,
    hint: "Check the username or your connection, then try again.",
    action: "retry",
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

/** GitHub banners wait for a username; the quote banner for its quote. */
export function previewEmptyCopy(needsUsername: boolean): { title: string; description: string } {
  return needsUsername
    ? {
        title: "Choose a GitHub profile",
        description: "Select a username to load data for this banner.",
      }
    : {
        title: "Add your quote",
        description: "Enter quote text in the sidebar to see it here.",
      };
}
