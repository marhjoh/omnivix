import type { GithubDataKind } from "@/src/templates/types";
import type { PreviewContentState } from "./types";

/**
 * Picks what the preview shows. A missing setting comes first because nothing loads without a
 * username. Then a problem, then loading until the data is there.
 */
export function computePreviewContentState(params: {
  /** The setting the banner waits for: the username, or a required field such as the quote. */
  missingSetting: string | undefined;
  /** Loading the GitHub data failed (`useGithubBannerData`'s problem). */
  hasProblem: boolean;
  dataReady: boolean;
}): PreviewContentState {
  if (params.missingSetting !== undefined) return "empty";
  if (params.hasProblem) return "error";
  if (!params.dataReady) return "loading";
  return "ready";
}

const DATA_NAMES: Record<GithubDataKind, string> = {
  user: "profile",
  contributions: "contributions",
  repos: "repositories",
  organizations: "organizations",
};

/** "Loading profile and contributions…", from the GitHub data the banner draws. */
export function previewLoadingMessage(githubData: readonly GithubDataKind[]): string {
  const names = new Intl.ListFormat("en-US").format(githubData.map((kind) => DATA_NAMES[kind]));
  return `Loading ${names}…`;
}

/**
 * Copy for an empty preview. GitHub banners wait for a username, and the quote banner waits for its
 * quote, the only other required setting. The action opens the username dialog or puts the cursor
 * in that setting's field.
 */
export function previewEmptyCopy(missingSetting: string) {
  return missingSetting === "username"
    ? {
        title: "Choose a GitHub username",
        hint: "Enter a username to load this banner's data.",
        actionLabel: "Choose username",
      }
    : {
        title: "Add your quote",
        hint: "Enter quote text in the sidebar to see it here.",
        actionLabel: "Add quote",
      };
}
