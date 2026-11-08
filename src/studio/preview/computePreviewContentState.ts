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
 * "Loading profile and contributions…", from the GitHub data the banner draws. The latest posts
 * banner waits for its feed, and other banners without GitHub data only for their Simple Icons.
 */
export function previewLoadingMessage(
  githubData: readonly GithubDataKind[],
  loadsFeed = false,
): string {
  if (loadsFeed) return "Loading posts…";
  if (githubData.length === 0) return "Loading icons…";
  const names = new Intl.ListFormat("en-US").format(githubData.map((kind) => DATA_NAMES[kind]));
  return `Loading ${names}…`;
}

/**
 * Copy for an empty preview. GitHub banners wait for a username, the quote banner for its quote,
 * the tech stack banner for its icons, the intro banner for a name, the certifications banner for a
 * named certification and the AI usage banner for pasted ccusage output. The action opens the
 * username or usage dialog, or puts the cursor in that setting's field.
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
    case "certifications":
      return {
        title: "Add your certifications",
        hint: "Add a certification with a name in the sidebar to see it here.",
        actionLabel: "Add certifications",
      };
    case "feed":
      return {
        title: "Add your feed",
        hint: "Add an RSS or Atom link to show your latest posts.",
        actionLabel: "Add feed",
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
