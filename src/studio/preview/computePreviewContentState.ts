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

/**
 * "Loading profile and contributions…", from the GitHub data the banner draws. A banner without
 * GitHub data only waits for its Simple Icons.
 */
export function previewLoadingMessage(githubData: readonly GithubDataKind[]): string {
  if (githubData.length === 0) return "Loading icons…";
  const names = new Intl.ListFormat("en-US").format(githubData.map((kind) => DATA_NAMES[kind]));
  return `Loading ${names}…`;
}

/**
 * Copy for an empty preview. GitHub banners wait for a username, the quote banner for its quote,
 * the tech stack banner for its icons, the intro banner for a name and the AI usage banner for
 * pasted ccusage output. The action opens the
 * username dialog or puts the cursor in that setting's field.
 */
export function previewEmptyCopy(missingSetting: string) {
  switch (missingSetting) {
    case "username":
      return {
        title: "Choose a GitHub username",
        hint: "Enter a username to load this banner's data.",
        actionLabel: "Choose username",
      };
    case "icons":
      return {
        title: "Add your tech stack",
        hint: "Search for icons in the sidebar to add them here.",
        actionLabel: "Add icons",
      };
    case "usage":
      return {
        title: "Add your AI usage",
        hint: "Paste the output of ccusage to see it here.",
        actionLabel: "Add usage",
      };
    case "name":
      return {
        title: "Add your name",
        hint: "Enter your name in the sidebar to see it here.",
        actionLabel: "Add name",
      };
    default:
      return {
        title: "Add your quote",
        hint: "Enter quote text in the sidebar to see it here.",
        actionLabel: "Add quote",
      };
  }
}
