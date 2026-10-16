"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { preload } from "react-dom";
import { templateRegistry } from "@/src/templates/registry";
import type { BannerSize, GithubDataKind, TemplateId } from "@/src/types/template";
import { ControlSidebar } from "@/src/studio/ControlSidebar";
import { PreviewArtboard } from "@/src/studio/PreviewArtboard";
import {
  computePreviewContentState,
  fetchErrorProblem,
  noReposProblem,
  userNotFoundProblem,
  type PreviewProblem,
} from "@/src/studio/preview";
import type { PreviewContentState } from "@/src/studio/preview/types";
import { isExportBlocked } from "@/src/studio/exportBlocked";
import { isInsecureImageLink } from "@/src/lib/imageLink";
import { Toast, type ToastMessage } from "@/src/ui/Toast";
import { useImageStatus } from "@/src/studio/preview/useImageStatus";
import { useHoldDuringLoad } from "@/src/studio/preview/useHoldDuringLoad";
import { useKeepWhile } from "@/src/studio/preview/useKeepWhile";
import { backgroundFromState, type BackgroundPosition } from "@/src/banner/background";
import { setSidebarCollapsedCookieClient } from "@/src/studio/sidebarCookie";
import { TopBar } from "@/src/studio/TopBar";
import { UsernameModal } from "@/src/studio/UsernameModal";
import {
  parseSettingsCookie,
  parseUsernameCookie,
  readCookieClient,
  settingsCookieName,
  setCookieClient,
  USERNAME_COOKIE,
} from "@/src/studio/studioCookies";
import { RenderData } from "@/src/templates/renderers/types";
import type {
  GithubUserNormalized,
  ContributionsNormalized,
  RepoLists,
  RepoNormalized,
} from "@/src/github/normalize";
import { useTheme } from "@/src/theme/ThemeProvider";
import { EXPORT_PIXEL_RATIO } from "@/src/export/viewport";
import { BANNER_SIZES } from "@/src/lib/sizes";
import styles from "@/src/studio/studio.module.css";
import { reposForBanner } from "@/src/lib/repoSelection";
import { applySavedSettings, clampSelectedRepos } from "@/src/studio/savedSettings";
import { contributionYear, githubDataUrls } from "@/src/studio/githubUrls";

/** Shown when a GitHub request fails without a message of its own (network, platform errors). */
const GITHUB_FETCH_FALLBACK = "Couldn't load GitHub data.";

const NO_REPOS: RepoNormalized[] = [];

type FetchSlotErrors = {
  user: string | null;
  contributions: string | null;
  repos: string | null;
};

/**
 * The error the preview shows: the first failing fetch among the data the banner draws. (The
 * contribution banner's user fetch is only for the sidebar's year list, so it never shows.)
 */
function previewErrorFor(githubData: readonly GithubDataKind[], e: FetchSlotErrors) {
  for (const kind of githubData) {
    if (e[kind]) return e[kind];
  }
  return null;
}

/** The part of the state that's saved per template, as JSON. */
function storedStateJson(state: Record<string, unknown>, needsUsername: boolean): string {
  const clone = { ...state };
  // Uploads are too large to store; position and zoom only make sense with their image.
  delete clone.backgroundImage;
  delete clone.backgroundPosition;
  delete clone.backgroundZoom;
  if (needsUsername) {
    // Username is global; avoid stale per-template copies.
    delete clone.username;
  }
  return JSON.stringify(clone);
}

class FetchError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    // Platform errors (a timeout page, an HTML 500) have no message; the caller's fallback is used.
    throw new FetchError(body.error ?? "", res.status);
  }
  return res.json() as Promise<T>;
}

type FetchResult<T> = {
  url: string;
  nonce: number;
  data?: T;
  error: string | null;
  /** HTTP status of the failed request; 404 means the GitHub user doesn't exist. */
  status: number | null;
};

/**
 * Last successful response per url, kept for the browser session. Returning to the studio, or to a
 * year or user shown before, renders that data at once; it's fetched again only when older than
 * FRESH_FOR_MS, so going back and forth doesn't ask GitHub again each time.
 */
const lastFetched = new Map<string, { data: unknown; at: number }>();

const FRESH_FOR_MS = 60_000;

/** Last successful response per `keepKey` (see useFetchJson), for urls that differ only in detail. */
const lastFetchedByKey = new Map<string, unknown>();

/**
 * Results are stored with the url/nonce they belong to and derived on read,
 * so nothing has to be reset synchronously when the url changes.
 * On error, the last data for the same url is kept (from `lastFetched`).
 */
function useFetchJson<T>(
  url: string | null,
  nonce: number,
  fallbackError: string,
  {
    keepKey,
    initial,
  }: {
    /**
     * Responses with the same key stand in for each other while a new url loads, e.g. the
     * contributions for another year, so the preview keeps its content instead of flashing
     * "loading".
     */
    keepKey?: string;
    /** This url's data from the page's server render (see initialGithubData), if it has it. */
    initial?: T;
  } = {},
) {
  const [result, setResult] = useState<FetchResult<T> | null>(null);
  const lastNonceRef = useRef(nonce);

  useEffect(() => {
    if (!url) return;
    if (initial !== undefined && !lastFetched.has(url)) {
      lastFetched.set(url, { data: initial, at: Date.now() });
    }
    // A retry always asks again; otherwise a recent response is used as is.
    const retry = lastNonceRef.current !== nonce;
    lastNonceRef.current = nonce;
    const cachedEntry = lastFetched.get(url);
    const fresh = !retry && cachedEntry !== undefined && Date.now() - cachedEntry.at < FRESH_FOR_MS;
    const ac = new AbortController();
    (fresh ? Promise.resolve(cachedEntry.data as T) : fetchJson<T>(url, ac.signal)).then(
      (data) => {
        if (ac.signal.aborted) return;
        if (!fresh) lastFetched.set(url, { data, at: Date.now() });
        if (keepKey) lastFetchedByKey.set(keepKey, data);
        setResult({ url, nonce, data, error: null, status: null });
      },
      (error) => {
        if (ac.signal.aborted) return;
        // Only our API's own messages are shown; network errors ("Failed to fetch") use the fallback.
        const message =
          error instanceof FetchError && error.message ? error.message : fallbackError;
        setResult({
          url,
          nonce,
          error: message,
          status: error instanceof FetchError ? error.status : null,
        });
      },
    );
    return () => ac.abort();
  }, [url, nonce, fallbackError, keepKey, initial]);

  const current = url && result?.url === url ? result : null;
  const settled = current !== null && current.nonce === nonce;
  const ownData =
    current?.data ?? (url ? ((lastFetched.get(url)?.data as T | undefined) ?? initial) : undefined);
  const keptData =
    url && keepKey && ownData === undefined
      ? (lastFetchedByKey.get(keepKey) as T | undefined)
      : undefined;
  return {
    data: ownData ?? keptData,
    /** The data is from another request with the same `keepKey`, shown while this one loads. */
    stale: keptData !== undefined,
    error: settled ? current.error : null,
    notFound: settled && current.status === 404,
    loading: url !== null && !settled,
  };
}

/** `url`'s data from the server render, if it has it. */
function initialData<T>(initialGithubData: Record<string, unknown>, url: string | null) {
  return url ? (initialGithubData[url] as T | undefined) : undefined;
}

/** Loads quicker than this go straight to the new preview, without showing the loading screen. */
const LOADING_SCREEN_DELAY_MS = 300;
/** Once shown, the loading screen stays at least this long, so it doesn't just blink. */
const LOADING_SCREEN_MIN_MS = 400;

/** Only a finished preview is held during a load; an empty or error state goes straight to it. */
function isReadyPreview(preview: { previewState: PreviewContentState }): boolean {
  return preview.previewState === "ready";
}

/** A bit longer than the sidebar's 0.2s transition in studio.module.css. */
const SIDEBAR_ANIMATION_MS = 300;

/** Keep in sync with the drawer breakpoint in studio.module.css. */
const PHONE_QUERY = "(max-width: 767px)";

function subscribePhone(onChange: () => void) {
  const mq = window.matchMedia(PHONE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function StudioShell({
  templateId,
  initialSidebarCollapsed,
  savedSettings,
  savedUsername,
  initialGithubData,
}: {
  templateId: TemplateId;
  initialSidebarCollapsed: boolean;
  /** This template's settings from its cookie (null: none saved yet). */
  savedSettings: Record<string, unknown> | null;
  /** The GitHub username from its cookie (null: none saved yet). */
  savedUsername: string | null;
  /** GitHub data the server already loaded, by the url the studio fetches it from. */
  initialGithubData: Record<string, unknown>;
}) {
  const { theme: appTheme } = useTheme();
  const definition = templateRegistry[templateId];
  const needsUsername = definition.meta.needsUsername ?? false;

  // Saved settings come from cookies, so the server renders them and nothing switches after load.
  // The saved settings: from the server's cookie read on the first render, but read again in the
  // browser when the studio is opened by navigating (Back, Forward, a link). Next.js may reuse
  // the page from an earlier visit then, and its props would bring back older settings.
  const [saved] = useState(() =>
    typeof document === "undefined"
      ? { settings: savedSettings, username: savedUsername }
      : {
          settings: parseSettingsCookie(readCookieClient(settingsCookieName(templateId))),
          username: parseUsernameCookie(readCookieClient(USERNAME_COOKIE)),
        },
  );
  const [state, setState] = useState<Record<string, unknown>>(() =>
    applySavedSettings({ ...definition.initialState }, templateId, saved.settings, saved.username),
  );

  // Desktop collapse is remembered (cookie, read by the page); the phone drawer starts closed.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialSidebarCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isPhone = useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );
  const sidebarExpanded = isPhone ? drawerOpen : !sidebarCollapsed;

  // Crossing the breakpoint keeps what the user sees: widening turns a closed drawer into a
  // collapsed sidebar (and an open one into an open sidebar); narrowing always closes the drawer,
  // so it never pops up over the preview by itself.
  const [prevIsPhone, setPrevIsPhone] = useState(isPhone);
  if (isPhone !== prevIsPhone) {
    setPrevIsPhone(isPhone);
    if (!isPhone) setSidebarCollapsed(!drawerOpen);
    setDrawerOpen(false);
  }

  // The cookie lets the server render the desktop sidebar in the right state on the next load.
  useEffect(() => {
    setSidebarCollapsedCookieClient(sidebarCollapsed);
  }, [sidebarCollapsed]);

  // The sidebar only animates for user actions (toggle, backdrop, Escape). Without this, crossing
  // the drawer breakpoint while resizing animates its width and the preview shrinks, then grows.
  const [sidebarAnimating, setSidebarAnimating] = useState(false);
  const animationTimer = useRef<number | undefined>(undefined);
  const animateSidebar = useCallback((change: () => void) => {
    setSidebarAnimating(true);
    change();
    window.clearTimeout(animationTimer.current);
    animationTimer.current = window.setTimeout(
      () => setSidebarAnimating(false),
      SIDEBAR_ANIMATION_MS,
    );
  }, []);
  useEffect(() => () => window.clearTimeout(animationTimer.current), []);

  const closeDrawer = useCallback(
    () => animateSidebar(() => setDrawerOpen(false)),
    [animateSidebar],
  );

  function toggleSidebar() {
    animateSidebar(() => {
      if (isPhone) {
        setDrawerOpen((open) => !open);
        return;
      }
      setSidebarCollapsed((collapsed) => !collapsed);
    });
  }

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, closeDrawer]);

  // One per request, so a retry asks again only for what failed.
  const [retryNonces, setRetryNonces] = useState({ user: 0, contributions: 0, repos: 0 });

  const { githubData } = definition.meta;
  const needsRepos = githubData.includes("repos");

  const size = (state.size as BannerSize) ?? definition.meta.defaultSize;
  const username = (state.username as string) ?? "";

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

  const userFetch = useFetchJson<GithubUserNormalized>(
    urls.user,
    retryNonces.user,
    GITHUB_FETCH_FALLBACK,
    { initial: initialData<GithubUserNormalized>(initialGithubData, urls.user) },
  );
  const contributionsFetch = useFetchJson<ContributionsNormalized>(
    urls.contributions,
    retryNonces.contributions,
    GITHUB_FETCH_FALLBACK,
    {
      // Another year keeps the current grid until it arrives, instead of flashing "Loading".
      keepKey: username,
      initial: initialData<ContributionsNormalized>(initialGithubData, urls.contributions),
    },
  );
  const repoListsFetch = useFetchJson<RepoLists>(
    urls.repos,
    retryNonces.repos,
    GITHUB_FETCH_FALLBACK,
    {
      initial: initialData<RepoLists>(initialGithubData, urls.repos),
    },
  );
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

  // Errors from a previous retry nonce are not reported, so a retry clears them immediately.
  const fetchErrors = useMemo<FetchSlotErrors>(
    () => ({
      user: userFetch.error,
      // A failed refetch of the same year keeps its grid; a year that never loaded shows the error.
      contributions: contributions && !contributionsFetch.stale ? null : contributionsFetch.error,
      repos: repoListsFetch.error,
    }),
    [
      userFetch.error,
      contributions,
      contributionsFetch.stale,
      contributionsFetch.error,
      repoListsFetch.error,
    ],
  );

  const accountCreatedYear = user?.createdAt ? new Date(user.createdAt).getFullYear() : null;
  const repoCatalog = repoLists?.owned ?? NO_REPOS;
  // Only "loading" with nothing to show; a refetch keeps the list it has.
  const repoCatalogLoading = repoListsFetch.loading && !repoListsFetch.data;
  const repoCatalogError = repoListsFetch.error;

  // The GitHub and repos banners show the avatar: wait for the image too (when the photo is on), so
  // the banner doesn't appear with an empty spot that fills in later on a slow connection.
  // Preloaded even when off, so switching it on doesn't flash the loading state.
  // The photo of a profile from the server render is already loading in the page (preloaded
  // below), so it counts as loaded, like the rest of that first paint.
  const avatarUrl = githubData.includes("user") ? data.user?.avatarUrl : undefined;
  const serverAvatarUrl = initialData<GithubUserNormalized>(
    initialGithubData,
    urls.user,
  )?.avatarUrl;
  if (serverAvatarUrl) preload(serverAvatarUrl, { as: "image" });
  const avatarStatus = useImageStatus(avatarUrl, {
    assumeLoaded: avatarUrl !== undefined && avatarUrl === serverAvatarUrl,
  });
  const avatarReady = state.showAvatar === false || avatarStatus !== "loading";
  const avatarFailed = avatarStatus === "failed";
  const fill = state.contentSize === "fill";
  // A profile photo that failed to load can't be shown, and Fill covers the whole banner.
  const disabledFields = useMemo(() => {
    const keys = new Set<string>();
    if (avatarFailed) keys.add("showAvatar");
    if (fill) keys.add("alignment");
    return keys;
  }, [avatarFailed, fill]);
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

  // A required field such as the quote is empty (the username is handled on its own).
  const missingContent = definition.schema.some(
    (field) => field.required && field.key !== "username" && !String(state[field.key] ?? "").trim(),
  );

  const previewDataError = useMemo(
    () => previewErrorFor(githubData, fetchErrors),
    [githubData, fetchErrors],
  );

  // The repos banner with no repositories to show is handled like a failed fetch: the preview
  // says why instead of drawing an empty banner, and export is blocked.
  const noRepos = needsRepos && dataReady && data.repos?.length === 0;
  const userNotFound = userFetch.notFound || contributionsFetch.notFound || repoListsFetch.notFound;
  const previewProblem = useMemo<PreviewProblem | null>(() => {
    if (previewDataError) {
      return userNotFound ? userNotFoundProblem(username) : fetchErrorProblem(previewDataError);
    }
    if (noRepos) return noReposProblem(repoMode, selectedRepos);
    return null;
  }, [previewDataError, userNotFound, username, noRepos, repoMode, selectedRepos]);

  const previewState = useMemo(
    () =>
      computePreviewContentState({
        needsUsername,
        username,
        missingContent,
        dataError: previewProblem?.title ?? null,
        dataReady,
      }),
    [needsUsername, username, missingContent, previewProblem, dataReady],
  );

  const handlePreviewRetry = useCallback(() => {
    setRetryNonces((n) => ({
      user: userFetch.error ? n.user + 1 : n.user,
      contributions: contributionsFetch.error ? n.contributions + 1 : n.contributions,
      repos: repoListsFetch.error ? n.repos + 1 : n.repos,
    }));
  }, [userFetch.error, contributionsFetch.error, repoListsFetch.error]);
  const retryRepoCatalog = useCallback(() => {
    setRetryNonces((n) => ({ ...n, repos: n.repos + 1 }));
  }, []);

  const [isDownloading, setIsDownloading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const showError = useCallback((message: string) => {
    const id = Date.now();
    setToast({ id, message });
    return id;
  }, []);
  /** Hides the toast; with an id, only if that toast is still the one showing. */
  const dismissToast = useCallback((id?: number) => {
    setToast((current) => (id === undefined || current?.id === id ? null : current));
  }, []);
  // GitHub banners ask for a username right away when none is saved.
  const [showUsernameModal, setShowUsernameModal] = useState(needsUsername && !saved.username);
  const openUsernameModal = useCallback(() => setShowUsernameModal(true), []);
  const closeUsernameModal = useCallback(() => setShowUsernameModal(false), []);

  const updateState = useCallback(
    (key: string, value: unknown) => {
      setState((prev) => {
        const next = clampSelectedRepos(templateId, { ...prev, [key]: value });
        // A new background starts at its own default position.
        if (key === "backgroundImage") {
          delete next.backgroundPosition;
          delete next.backgroundZoom;
        }
        return next;
      });
    },
    [templateId],
  );

  // Saved as cookies, and only when the saved part changes (not on every background drag).
  const storedJson = useMemo(() => storedStateJson(state, needsUsername), [state, needsUsername]);
  useEffect(() => {
    setCookieClient(settingsCookieName(templateId), storedJson);
  }, [templateId, storedJson]);
  useEffect(() => {
    if (needsUsername && username) setCookieClient(USERNAME_COOKIE, username);
  }, [needsUsername, username]);

  const stateValid = useMemo(
    () => definition.stateSchema.safeParse(state).success,
    [definition.stateSchema, state],
  );
  const background = backgroundFromState(state);
  /** The image adjust mode was turned on for; choosing another image (or none) ends it. */
  const [adjustingSrc, setAdjustingSrc] = useState<string | null>(null);
  const moveBackground = useCallback(
    (position: BackgroundPosition) => updateState("backgroundPosition", position),
    [updateState],
  );

  const backgroundStatus = useImageStatus(
    typeof state.backgroundImage === "string" && state.backgroundImage
      ? state.backgroundImage
      : undefined,
  );
  const backgroundFailed = backgroundStatus === "failed";
  // A background that can't be used (it failed to load, or is an http link) is left out of the
  // preview, so the banner never shows a broken-image icon; the sidebar keeps the choice.
  const backgroundUnusable = backgroundFailed || isInsecureImageLink(state.backgroundImage);
  /** The background that can be moved and zoomed: one that's chosen and shows in the preview. */
  const adjustableBackground = backgroundUnusable ? undefined : background;
  const adjustingBackground =
    adjustableBackground !== undefined && adjustingSrc === adjustableBackground.src;
  function toggleBackgroundAdjusting() {
    setAdjustingSrc(adjustingBackground ? null : (adjustableBackground?.src ?? null));
    // On phones the settings drawer covers the preview; close it so the background can be dragged.
    if (isPhone && !adjustingBackground) closeDrawer();
  }

  // Links report their own problems (BackgroundImagePicker); a preset or upload that fails to
  // load is reported here, once per image.
  const reportedBackgroundRef = useRef<string | null>(null);
  const backgroundSrc = background?.src;
  useEffect(() => {
    if (!backgroundFailed || !backgroundSrc || /^https?:\/\//i.test(backgroundSrc)) return;
    if (reportedBackgroundRef.current === backgroundSrc) return;
    reportedBackgroundRef.current = backgroundSrc;
    showError("Couldn't load this background.");
  }, [backgroundFailed, backgroundSrc, showError]);
  const backgroundFields = useMemo(
    () => ({
      backgroundImage: backgroundUnusable ? undefined : state.backgroundImage,
      backgroundPosition: state.backgroundPosition,
      backgroundZoom: state.backgroundZoom,
    }),
    [backgroundUnusable, state.backgroundImage, state.backgroundPosition, state.backgroundZoom],
  );
  // A new background replaces the old one once it has loaded, instead of leaving the banner
  // without one in between.
  const shownBackground = useKeepWhile(backgroundFields, backgroundStatus === "loading");
  const previewBannerState = useMemo(
    () => ({ ...state, ...shownBackground }),
    [state, shownBackground],
  );
  // What the preview and the Download button show. A quick load keeps the previous preview
  // instead of flashing the loading screen (see useHoldDuringLoad); both always change together.
  const livePreview = useMemo(
    () => ({
      previewState,
      problem: previewProblem,
      bannerState: previewBannerState,
      data: renderData,
    }),
    [previewState, previewProblem, previewBannerState, renderData],
  );
  const shownPreview = useHoldDuringLoad(livePreview, previewState === "loading", {
    delayMs: LOADING_SCREEN_DELAY_MS,
    minShowMs: LOADING_SCREEN_MIN_MS,
    canHold: isReadyPreview,
  });
  const exportBlocked = isExportBlocked({
    previewState: shownPreview.previewState,
    stateValid,
    backgroundFailed: backgroundUnusable,
    previewPending:
      shownPreview !== livePreview ||
      contributionsFetch.stale ||
      shownBackground !== backgroundFields,
  });

  async function onDownload() {
    if (exportBlocked) return;
    setIsDownloading(true);
    dismissToast();
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          size,
          state,
          pixelRatio: EXPORT_PIXEL_RATIO,
          uiTheme: appTheme,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        showError(body.error ?? "Couldn't export the banner. Try again.");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const ratioSlug = BANNER_SIZES[size].label.replace(":", "x");
      anchor.download = `omnivix-${templateId}-${ratioSlug}.png`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      showError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsDownloading(false);
    }
  }

  function handleUsernameSubmit(newUsername: string) {
    updateState("username", newUsername);
    closeUsernameModal();
  }

  return (
    <div className={styles.shell}>
      <Toast toast={toast} onDismiss={dismissToast} />
      <UsernameModal
        open={showUsernameModal}
        currentUsername={username}
        onSubmit={handleUsernameSubmit}
        onCancel={closeUsernameModal}
      />

      <header className={styles.topbar}>
        <TopBar
          title={definition.meta.title}
          onDownload={onDownload}
          isDownloading={isDownloading}
          exportBlocked={exportBlocked}
          username={username}
          needsUsername={needsUsername}
          onChangeUsername={openUsernameModal}
          sidebarExpanded={sidebarExpanded}
          onToggleSidebar={toggleSidebar}
        />
      </header>
      <div
        className={styles.content}
        data-sidebar-collapsed={sidebarCollapsed}
        data-sidebar-open={drawerOpen}
        data-sidebar-animating={sidebarAnimating}
      >
        <aside id="studio-sidebar" className={styles.sidebar} aria-label="Banner settings">
          <div className={styles.sidebarInner}>
            <ControlSidebar
              schema={definition.schema}
              state={state}
              accountCreatedYear={accountCreatedYear}
              onChange={updateState}
              repoCatalog={repoCatalog}
              repoCatalogLoading={repoCatalogLoading}
              repoCatalogError={repoCatalogError}
              onRetryRepoCatalog={retryRepoCatalog}
              disabledFields={disabledFields}
              adjustableBackground={adjustableBackground}
              backgroundAdjusting={adjustingBackground}
              onToggleBackgroundAdjusting={toggleBackgroundAdjusting}
              onError={showError}
              onErrorResolved={dismissToast}
            />
          </div>
        </aside>
        <button
          type="button"
          className={styles.backdrop}
          onClick={closeDrawer}
          aria-label="Close settings"
          tabIndex={-1}
        />
        <main className={styles.preview}>
          <PreviewArtboard
            templateId={templateId}
            size={size}
            state={shownPreview.bannerState}
            data={shownPreview.data}
            previewState={shownPreview.previewState}
            problem={shownPreview.problem}
            onRetry={handlePreviewRetry}
            onChangeUsername={openUsernameModal}
            backgroundAdjust={
              adjustingBackground && adjustableBackground
                ? {
                    position: adjustableBackground.position,
                    zoom: adjustableBackground.zoom,
                    onMove: moveBackground,
                    onDone: () => setAdjustingSrc(null),
                  }
                : undefined
            }
          />
        </main>
      </div>
    </div>
  );
}
