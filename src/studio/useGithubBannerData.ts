import { useMemo } from "react";
import { preload } from "react-dom";
import type {
  ContributionsNormalized,
  GithubUserNormalized,
  OrganizationNormalized,
  RepoLists,
  RepoNormalized,
} from "@/src/github/types";
import { limitResetAt } from "@/src/lib/apiError";
import { limitMessage, REQUEST_LIMIT_MESSAGE } from "@/src/lib/rateLimitMessage";
import { reposForBanner } from "@/src/lib/repoSelection";
import { yearOf } from "@/src/lib/contributionYear";
import { githubDataUrls } from "@/src/studio/githubUrls";
import { fetchProblem, noReposProblem } from "@/src/studio/preview/previewProblems";
import type { PreviewProblem } from "@/src/studio/preview/types";
import { useImageStatus } from "@/src/studio/useImageStatus";
import { initialData, useApiQuery } from "@/src/studio/useApiQuery";
import { templateRegistry } from "@/src/templates/registry";
import type { BannerSettings, RenderData, TemplateId } from "@/src/templates/types";

const NO_REPOS: RepoNormalized[] = [];

/**
 * Loads the GitHub data the banner draws. Also returns what the preview and the repository picker
 * need: whether it's ready, and the problem if it can't load.
 */
export function useGithubBannerData({
  templateId,
  state,
  username,
  initialGithubData,
}: {
  templateId: TemplateId;
  state: BannerSettings;
  username: string;
  /** GitHub data the server already loaded, keyed by URL. */
  initialGithubData: Record<string, unknown>;
}) {
  const { needsUsername, githubData } = templateRegistry[templateId].meta;

  // Only the repos banner picks repositories.
  const repoMode = "mode" in state ? state.mode : undefined;
  const selectedRepos = "selectedRepos" in state ? state.selectedRepos : "";
  // One request returns both repository lists. Picking repositories or switching between pinned
  // and selected needs nothing more from GitHub.
  const urls = githubDataUrls({ githubData, username, year: yearOf(state) });

  const initialUser = initialData<GithubUserNormalized>(initialGithubData, urls.user);
  const userFetch = useApiQuery<GithubUserNormalized>(urls.user, { initial: initialUser });
  const contributionsFetch = useApiQuery<ContributionsNormalized>(urls.contributions, {
    // Another year keeps the current grid until it arrives, instead of flashing "Loading".
    keepKey: username,
    initial: initialData<ContributionsNormalized>(initialGithubData, urls.contributions),
  });
  const repoListsFetch = useApiQuery<RepoLists>(urls.repos, {
    initial: initialData<RepoLists>(initialGithubData, urls.repos),
  });
  const repoLists = repoListsFetch.error ? undefined : repoListsFetch.data;
  const organizationsFetch = useApiQuery<OrganizationNormalized[]>(urls.organizations, {
    initial: initialData<OrganizationNormalized[]>(initialGithubData, urls.organizations),
  });
  const organizations = organizationsFetch.error ? undefined : organizationsFetch.data;

  const user = userFetch.error ? undefined : userFetch.data;
  const repos = useMemo(
    () => (repoLists ? reposForBanner(repoLists, repoMode, selectedRepos) : undefined),
    [repoLists, repoMode, selectedRepos],
  );
  const contributions = contributionsFetch.data;
  const data = useMemo<RenderData>(
    () => ({ user, contributions, repos, organizations }),
    [user, contributions, repos, organizations],
  );

  // The GitHub, repos and stats banners show the avatar. When the photo is on, wait for it too, so
  // a slow connection doesn't show the banner with an empty spot. It's preloaded even when off, so
  // turning it on doesn't flash the loading state. The photo from the server render counts as
  // loaded, like the rest of the first paint, because the page is already loading it (preloaded
  // here).
  const avatarUrl = githubData.includes("user") ? data.user?.avatarUrl : undefined;
  const serverAvatarUrl = initialUser?.avatarUrl;
  if (serverAvatarUrl) preload(serverAvatarUrl, { as: "image" });
  const avatarStatus = useImageStatus(avatarUrl, {
    assumeLoaded: avatarUrl !== undefined && avatarUrl === serverAvatarUrl,
  });
  const avatarReady = ("showAvatar" in state && !state.showAvatar) || avatarStatus !== "loading";
  const avatarFailed = avatarStatus === "failed";
  // A photo that failed to load is left out, so the banner never shows a broken-image icon.
  const renderData = useMemo<RenderData>(
    () => (avatarFailed && data.user ? { ...data, user: { ...data.user, avatarUrl: "" } } : data),
    [avatarFailed, data],
  );

  const dataReady =
    !needsUsername ||
    !username ||
    (githubData.every((kind) => data[kind] !== undefined) &&
      (!githubData.includes("user") || avatarReady));

  // Find the first failed fetch among the data the banner draws. The contribution banner's user
  // fetch only feeds the sidebar's year list, so it doesn't count. A failed refetch of the same
  // year keeps showing its grid.
  const fetches = {
    user: userFetch,
    contributions: contributions && !contributionsFetch.stale ? null : contributionsFetch,
    repos: repoListsFetch,
    organizations: organizationsFetch,
  };
  const failedFetch = githubData.map((kind) => fetches[kind]).find((fetch) => fetch?.error);
  // A repos banner with no repositories is treated like a failed fetch. The preview says why
  // instead of drawing an empty banner, and export is blocked.
  const noRepos = dataReady && data.repos?.length === 0;
  const failedError = failedFetch?.error ?? null;
  const failedLimit = failedFetch?.limit ?? null;
  const failedNotFound = failedFetch?.notFound ?? false;
  const problem = useMemo<PreviewProblem | null>(() => {
    if (failedError) {
      return fetchProblem({
        error: failedError,
        limit: failedLimit,
        notFound: failedNotFound,
        username,
      });
    }
    if (repoMode && noRepos) return noReposProblem(repoMode, selectedRepos);
    return null;
  }, [failedError, failedLimit, failedNotFound, username, noRepos, repoMode, selectedRepos]);

  // Only refetch what failed.
  function retry() {
    for (const query of [userFetch, contributionsFetch, repoListsFetch, organizationsFetch]) {
      if (query.error) void query.refetch();
    }
  }

  const repoLimit = repoListsFetch.limit;
  return {
    data: renderData,
    dataReady,
    /** Why the preview can't show the banner, if it can't. */
    problem,
    retry,
    /** Another year's grid is showing while this year's loads. */
    contributionsStale: contributionsFetch.stale,
    avatarFailed,
    accountCreatedYear: user?.createdAt ? new Date(user.createdAt).getUTCFullYear() : null,
    /** The owner's repositories, for the picker. */
    repoCatalog: {
      repos: repoLists?.owned ?? NO_REPOS,
      // A refetch keeps showing the current list, so this is only true when there's no list.
      loading: repoListsFetch.loading && !repoListsFetch.data,
      error: repoLimit ? limitMessage(repoLimit, REQUEST_LIMIT_MESSAGE) : repoListsFetch.error,
      retryAt: limitResetAt(repoLimit),
      retry: () => void repoListsFetch.refetch(),
    },
  };
}
