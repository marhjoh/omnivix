import { useMemo } from "react";
import { preload } from "react-dom";
import type {
  ContributionsNormalized,
  GithubUserNormalized,
  RepoLists,
  RepoNormalized,
} from "@/src/github/normalize";
import { type ApiLimit, limitResetAt } from "@/src/lib/apiError";
import { limitMessage, REQUEST_LIMIT_MESSAGE } from "@/src/lib/rateLimitMessage";
import { reposForBanner } from "@/src/lib/repoSelection";
import { contributionYear, githubDataUrls } from "@/src/studio/githubUrls";
import { fetchProblem, noReposProblem } from "@/src/studio/preview/computePreviewContentState";
import type { PreviewProblem } from "@/src/studio/preview/types";
import { useImageStatus } from "@/src/studio/preview/useImageStatus";
import { initialData, useApiQuery } from "@/src/studio/useApiQuery";
import type { RenderData } from "@/src/templates/renderers/types";
import { templateRegistry } from "@/src/templates/registry";
import type { GithubDataKind, TemplateId } from "@/src/types/template";

/** Shown when a GitHub request fails without a message of its own (network, platform errors). */
const GITHUB_FETCH_FALLBACK = "Couldn't load GitHub data.";

const NO_REPOS: RepoNormalized[] = [];

type FailedFetch = { error: string | null; limit: ApiLimit | null; notFound: boolean };

/**
 * The fetch the preview reports: the first failing one among the data the banner draws. (The
 * contribution banner's user fetch is only for the sidebar's year list, so it never shows.)
 */
function failedFetchFor(
  githubData: readonly GithubDataKind[],
  fetches: Record<GithubDataKind, FailedFetch | null>,
): FailedFetch | null {
  for (const kind of githubData) {
    if (fetches[kind]?.error) return fetches[kind];
  }
  return null;
}

/**
 * The GitHub data the banner draws, loaded for its username, and what the preview and the
 * repository picker say about it: when it's ready, and the problem when it can't be loaded.
 */
export function useGithubBannerData({
  templateId,
  state,
  username,
  initialGithubData,
}: {
  templateId: TemplateId;
  state: Record<string, unknown>;
  username: string;
  /** GitHub data the server already loaded, by the url the studio fetches it from. */
  initialGithubData: Record<string, unknown>;
}) {
  const { needsUsername, githubData } = templateRegistry[templateId].meta;

  const repoMode = String(state.mode ?? "pinned");
  const selectedRepos = String(state.selectedRepos ?? "");
  // Both repository lists come in one request per user: picking repositories and switching
  // between pinned and selected need nothing more from GitHub.
  const urls = githubDataUrls({
    needsUsername,
    githubData,
    username,
    year: contributionYear(state.year),
  });

  const initialUser = initialData<GithubUserNormalized>(initialGithubData, urls.user);
  const userFetch = useApiQuery<GithubUserNormalized>(urls.user, GITHUB_FETCH_FALLBACK, {
    initial: initialUser,
  });
  const contributionsFetch = useApiQuery<ContributionsNormalized>(
    urls.contributions,
    GITHUB_FETCH_FALLBACK,
    {
      // Another year keeps the current grid until it arrives, instead of flashing "Loading".
      keepKey: username,
      initial: initialData<ContributionsNormalized>(initialGithubData, urls.contributions),
    },
  );
  const repoListsFetch = useApiQuery<RepoLists>(urls.repos, GITHUB_FETCH_FALLBACK, {
    initial: initialData<RepoLists>(initialGithubData, urls.repos),
  });
  const repoLists = repoListsFetch.error ? undefined : repoListsFetch.data;

  const user = userFetch.error ? undefined : userFetch.data;
  const repos = useMemo(
    () => (repoLists ? reposForBanner(repoLists, repoMode, selectedRepos) : undefined),
    [repoLists, repoMode, selectedRepos],
  );
  const contributions = contributionsFetch.data;
  const data = useMemo<RenderData>(
    () => ({ user, contributions, repos }),
    [user, contributions, repos],
  );

  // The GitHub and repos banners show the avatar: wait for the image too (when the photo is on), so
  // the banner doesn't appear with an empty spot that fills in later on a slow connection.
  // Preloaded even when off, so switching it on doesn't flash the loading state. The photo from
  // the server render is already loading in the page (preloaded here), so it counts as loaded,
  // like the rest of that first paint.
  const avatarUrl = githubData.includes("user") ? data.user?.avatarUrl : undefined;
  const serverAvatarUrl = initialUser?.avatarUrl;
  if (serverAvatarUrl) preload(serverAvatarUrl, { as: "image" });
  const avatarStatus = useImageStatus(avatarUrl, {
    assumeLoaded: avatarUrl !== undefined && avatarUrl === serverAvatarUrl,
  });
  const avatarReady = state.showAvatar === false || avatarStatus !== "loading";
  const avatarFailed = avatarStatus === "failed";
  // A photo that failed to load is left out, so the banner never shows a broken-image icon.
  const renderData = useMemo<RenderData>(
    () => (avatarFailed && data.user ? { ...data, user: { ...data.user, avatarUrl: "" } } : data),
    [avatarFailed, data],
  );

  // Ready once the data the banner draws has loaded (and the profile photo, when it shows one).
  const dataReady =
    !needsUsername ||
    !username ||
    (githubData.every((kind) => data[kind] !== undefined) &&
      (!githubData.includes("user") || avatarReady));

  const failedFetch = failedFetchFor(githubData, {
    user: userFetch,
    // A failed refetch of the same year keeps its grid; a year that never loaded shows the error.
    contributions: contributions && !contributionsFetch.stale ? null : contributionsFetch,
    repos: repoListsFetch,
  });
  // The repos banner with no repositories to show is handled like a failed fetch: the preview
  // says why instead of drawing an empty banner, and export is blocked.
  const noRepos = githubData.includes("repos") && dataReady && data.repos?.length === 0;
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
    if (noRepos) return noReposProblem(repoMode, selectedRepos);
    return null;
  }, [failedError, failedLimit, failedNotFound, username, noRepos, repoMode, selectedRepos]);

  // Asks again only for what failed.
  function retry() {
    for (const query of [userFetch, contributionsFetch, repoListsFetch]) {
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
    accountCreatedYear: user?.createdAt ? new Date(user.createdAt).getFullYear() : null,
    /** The owner's repositories, for the picker. */
    repoCatalog: {
      repos: repoLists?.owned ?? NO_REPOS,
      // Only "loading" with nothing to show; a refetch keeps the list it has.
      loading: repoListsFetch.loading && !repoListsFetch.data,
      error: repoLimit ? limitMessage(repoLimit, REQUEST_LIMIT_MESSAGE) : repoListsFetch.error,
      retryAt: limitResetAt(repoLimit),
      retry: () => void repoListsFetch.refetch(),
    },
  };
}
