"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { templateRegistry } from "@/src/templates/registry";
import { BannerSize, TemplateId } from "@/src/types/template";
import { ControlSidebar } from "@/src/studio/ControlSidebar";
import { PreviewArtboard } from "@/src/studio/PreviewArtboard";
import {
  computePreviewContentState,
  fetchErrorProblem,
  noReposProblem,
  userNotFoundProblem,
  type PreviewProblem,
} from "@/src/studio/preview";
import { isExportBlocked } from "@/src/studio/exportBlocked";
import { isInsecureImageLink } from "@/src/lib/imageLink";
import { Toast, type ToastMessage } from "@/src/ui/Toast";
import { useImageStatus } from "@/src/studio/preview/useImageStatus";
import { backgroundFromState, type BackgroundPosition } from "@/src/banner/background";
import { setSidebarCollapsedCookieClient } from "@/src/studio/sidebarCookie";
import { TopBar } from "@/src/studio/TopBar";
import { UsernameModal, getStoredUsername, storeUsername } from "@/src/studio/UsernameModal";
import { RenderData } from "@/src/templates/renderers/types";
import type {
  GithubUserNormalized,
  ContributionsNormalized,
  RepoNormalized,
} from "@/src/github/normalize";
import { useTheme } from "@/src/theme/ThemeProvider";
import { THEME_PRESETS } from "@/src/types/theme";
import { EXPORT_PIXEL_RATIO } from "@/src/export/viewport";
import { BANNER_SIZES, normalizeBannerSize } from "@/src/lib/sizes";
import styles from "@/src/studio/studio.module.css";

const STATE_PREFIX = "omnivix:state:";

/** Shown when a GitHub request fails without a message of its own (network, platform errors). */
const GITHUB_FETCH_FALLBACK = "Couldn't load GitHub data.";

type FetchSlotErrors = {
  user: string | null;
  contributions: string | null;
  repos: string | null;
};

/**
 * Single message for preview: one slot wins per template.
 * The contribution banner only draws contributions; its user fetch is for the sidebar (year list).
 */
function previewErrorForTemplate(templateId: TemplateId, e: FetchSlotErrors): string | null {
  if (templateId === "github-banner") {
    if (e.user) return e.user;
    if (e.contributions) return e.contributions;
    return null;
  }
  if (templateId === "contribution-banner") {
    return e.contributions;
  }
  if (templateId === "repos-banner") {
    if (e.user) return e.user;
    if (e.repos) return e.repos;
    return null;
  }
  return null;
}

function loadPersistedState(templateId: string): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STATE_PREFIX + templateId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
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
 * year or user shown before, renders that data at once while it is fetched again.
 */
const lastFetched = new Map<string, unknown>();

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
  /**
   * Responses with the same key stand in for each other while a new url loads, e.g. the
   * repositories for another selection, so the preview keeps its content instead of flashing
   * "loading".
   */
  keepKey?: string,
) {
  const [result, setResult] = useState<FetchResult<T> | null>(null);

  useEffect(() => {
    if (!url) return;
    const ac = new AbortController();
    fetchJson<T>(url, ac.signal).then(
      (data) => {
        if (ac.signal.aborted) return;
        lastFetched.set(url, data);
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
  }, [url, nonce, fallbackError, keepKey]);

  const current = url && result?.url === url ? result : null;
  const settled = current !== null && current.nonce === nonce;
  return {
    data:
      current?.data ??
      (url
        ? ((lastFetched.get(url) ?? (keepKey ? lastFetchedByKey.get(keepKey) : undefined)) as
            T | undefined)
        : undefined),
    error: settled ? current.error : null,
    notFound: settled && current.status === 404,
    loading: url !== null && !settled,
  };
}

const subscribeNever = () => () => {};

/** Keep in sync with the drawer breakpoint in studio.module.css. */
const PHONE_QUERY = "(max-width: 767px)";

function subscribePhone(onChange: () => void) {
  const mq = window.matchMedia(PHONE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function withPersistedState(
  prev: Record<string, unknown>,
  templateId: TemplateId,
  needsUsername: boolean,
): Record<string, unknown> {
  const persisted = loadPersistedState(templateId);
  const storedUsername = needsUsername ? getStoredUsername() : "";
  if (!persisted && !storedUsername) return prev;

  const merged = { ...prev, ...persisted };
  merged.size = normalizeBannerSize(merged.size, prev.size as BannerSize);
  // A saved choice the field no longer offers falls back to the template default.
  for (const field of templateRegistry[templateId].schema) {
    if (field.options && !field.options.some((option) => option.value === merged[field.key])) {
      merged[field.key] = prev[field.key];
    }
  }
  if (needsUsername) {
    merged.username = storedUsername;
  }
  const themeIds = new Set(THEME_PRESETS.map((p) => p.id));
  if (typeof merged.themeId !== "string" || !themeIds.has(merged.themeId)) {
    merged.themeId = "default";
  }
  return clampSelectedRepos(templateId, merged);
}

/** Repos banner: keep selectedRepos within the number of repos that can be shown. */
function clampSelectedRepos(
  templateId: TemplateId,
  state: Record<string, unknown>,
): Record<string, unknown> {
  if (templateId !== "repos-banner") return state;
  const mode = String(state.mode ?? "pinned");
  const maxR = mode === "selected" ? 6 : Math.min(6, Math.max(1, Number(state.maxRepos ?? 6)));
  const parts = String(state.selectedRepos ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length <= maxR) return state;
  return { ...state, selectedRepos: parts.slice(0, maxR).join(", ") };
}

export function StudioShell({
  templateId,
  initialSidebarCollapsed,
}: {
  templateId: TemplateId;
  initialSidebarCollapsed: boolean;
}) {
  const { theme: appTheme } = useTheme();
  const definition = templateRegistry[templateId];
  const needsUsername = definition.meta.needsUsername ?? false;

  const [state, setState] = useState<Record<string, unknown>>(() => ({
    ...definition.initialState,
  }));

  // Persisted state lives in localStorage, so it is merged in on the first client render
  // (after hydration) to keep the server and client markup identical.
  const isClient = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  const [hydrated, setHydrated] = useState(false);
  if (isClient && !hydrated) {
    setHydrated(true);
    setState((prev) => withPersistedState(prev, templateId, needsUsername));
  }

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
    animationTimer.current = window.setTimeout(() => setSidebarAnimating(false), 300);
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

  const [refetchNonce, setRefetchNonce] = useState(0);

  const needsContributions = templateId === "github-banner" || templateId === "contribution-banner";
  const needsReposFetch = templateId === "repos-banner";

  const size = (state.size as BannerSize) ?? definition.meta.defaultSize;
  const username = (state.username as string) ?? "";

  const yearRaw =
    state.year != null && String(state.year).length > 0
      ? String(state.year)
      : String(new Date().getFullYear());
  const repoMode = String(state.mode ?? "pinned");
  const selectedRepos = String(state.selectedRepos ?? "");
  const encodedUsername = encodeURIComponent(username);

  const userFetch = useFetchJson<GithubUserNormalized>(
    needsUsername && username ? `/api/github/user-summary?username=${encodedUsername}` : null,
    refetchNonce,
    GITHUB_FETCH_FALLBACK,
  );
  const contributionsFetch = useFetchJson<ContributionsNormalized>(
    username && needsContributions
      ? `/api/github/contributions?username=${encodedUsername}&year=${encodeURIComponent(yearRaw)}`
      : null,
    refetchNonce,
    GITHUB_FETCH_FALLBACK,
  );
  const reposFetch = useFetchJson<RepoNormalized[]>(
    username && needsReposFetch
      ? `/api/github/repos?username=${encodedUsername}&mode=${encodeURIComponent(repoMode)}&selected=${encodeURIComponent(selectedRepos)}`
      : null,
    refetchNonce,
    GITHUB_FETCH_FALLBACK,
    `${username}:${repoMode}`,
  );
  const catalogFetch = useFetchJson<RepoNormalized[]>(
    username && needsReposFetch && repoMode === "selected"
      ? `/api/github/repos-catalog?username=${encodedUsername}`
      : null,
    refetchNonce,
    "Couldn't load your repositories.",
  );

  const user = userFetch.error ? undefined : userFetch.data;
  // While another selection loads, the previous repositories stay on screen; an empty list doesn't,
  // or picking the first repository would flash "No repositories selected".
  const repos =
    reposFetch.error || (reposFetch.loading && reposFetch.data?.length === 0)
      ? undefined
      : reposFetch.data;
  // Contributions keep the last good result for the same username/year when a refetch fails.
  const contributions = contributionsFetch.data;

  const data = useMemo<RenderData>(
    () => ({ user, contributions, repos }),
    [user, contributions, repos],
  );

  // Errors from a previous refetchNonce are not reported, so a retry clears them immediately.
  const fetchErrors = useMemo<FetchSlotErrors>(
    () => ({
      user: userFetch.error,
      contributions: contributions ? null : contributionsFetch.error,
      repos: reposFetch.error,
    }),
    [userFetch.error, contributions, contributionsFetch.error, reposFetch.error],
  );

  const accountCreatedYear = user?.createdAt ? new Date(user.createdAt).getFullYear() : null;
  const repoCatalog = useMemo(
    () => (catalogFetch.error ? [] : (catalogFetch.data ?? [])),
    [catalogFetch.error, catalogFetch.data],
  );
  const repoCatalogLoading = catalogFetch.loading;
  const repoCatalogError = catalogFetch.error;

  // The GitHub and repos banners show the avatar: wait for the image too (when the photo is on), so
  // the banner doesn't appear with an empty spot that fills in later on a slow connection.
  // Preloaded even when off, so switching it on doesn't flash the loading state.
  const avatarStatus = useImageStatus(data.user?.avatarUrl);
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

  const dataReady = useMemo(() => {
    if (!needsUsername || !username) return true;
    if (templateId === "github-banner") {
      return Boolean(data.user && data.contributions && avatarReady);
    }
    if (templateId === "contribution-banner") {
      return Boolean(data.contributions);
    }
    if (templateId === "repos-banner") {
      return Boolean(data.user && data.repos && avatarReady);
    }
    return true;
  }, [needsUsername, username, templateId, data.user, data.contributions, data.repos, avatarReady]);

  const quoteText = String(state.quote ?? "");

  const previewDataError = useMemo(
    () => previewErrorForTemplate(templateId, fetchErrors),
    [templateId, fetchErrors],
  );

  // The repos banner with no repositories to show is handled like a failed fetch: the preview
  // says why instead of drawing an empty banner, and export is blocked.
  const noRepos = templateId === "repos-banner" && dataReady && data.repos?.length === 0;
  const userNotFound = userFetch.notFound || contributionsFetch.notFound || reposFetch.notFound;
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
        hydrated,
        templateId,
        needsUsername,
        username,
        quoteText,
        dataError: previewProblem?.title ?? null,
        dataReady,
      }),
    [hydrated, templateId, needsUsername, username, quoteText, previewProblem, dataReady],
  );

  const handlePreviewRetry = useCallback(() => {
    setRefetchNonce((n) => n + 1);
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
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const openUsernameModal = useCallback(() => setShowUsernameModal(true), []);
  const closeUsernameModal = useCallback(() => setShowUsernameModal(false), []);

  // Open the username prompt whenever a username becomes required but is missing.
  const shouldPromptUsername = hydrated && needsUsername && !username;
  const [prevShouldPromptUsername, setPrevShouldPromptUsername] = useState(false);
  if (shouldPromptUsername !== prevShouldPromptUsername) {
    setPrevShouldPromptUsername(shouldPromptUsername);
    if (shouldPromptUsername) setShowUsernameModal(true);
  }

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

  // Saved after hydration, and only when the saved part changes (not on every background drag).
  const storedJson = useMemo(() => storedStateJson(state, needsUsername), [state, needsUsername]);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STATE_PREFIX + templateId, storedJson);
    } catch {
      /* storage blocked or full; settings just aren't remembered */
    }
  }, [hydrated, templateId, storedJson]);

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
  const previewBannerState = useMemo(
    () => (backgroundUnusable ? { ...state, backgroundImage: undefined } : state),
    [backgroundUnusable, state],
  );
  const exportBlocked = isExportBlocked({
    previewState,
    stateValid,
    backgroundFailed: backgroundUnusable,
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
          format: "png",
          scale: 2,
          pixelRatio: EXPORT_PIXEL_RATIO,
          uiTheme: appTheme,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        showError(body.error ?? "Export failed. Please try again.");
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
    storeUsername(newUsername);
    updateState("username", newUsername);
    closeUsernameModal();
  }

  return (
    <div className={styles.shell}>
      <Toast toast={toast} onDismiss={dismissToast} />
      <UsernameModal
        open={showUsernameModal}
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
              templateId={templateId}
              accountCreatedYear={accountCreatedYear}
              onChange={updateState}
              repoCatalog={repoCatalog}
              repoCatalogLoading={repoCatalogLoading}
              repoCatalogError={repoCatalogError}
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
            state={previewBannerState}
            data={renderData}
            previewState={previewState}
            problem={previewProblem}
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
