"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { templateRegistry } from "@/src/templates/registry";
import { BannerSize, TemplateId } from "@/src/types/template";
import { ControlSidebar } from "@/src/studio/ControlSidebar";
import { PreviewArtboard } from "@/src/studio/PreviewArtboard";
import { computePreviewContentState } from "@/src/studio/preview";
import { exportBlockedReason } from "@/src/studio/exportBlockedReason";
import { TopBar } from "@/src/studio/TopBar";
import { UsernameModal, getStoredUsername, storeUsername } from "@/src/studio/UsernameModal";
import { RenderData } from "@/src/templates/renderers/types";
import type { GithubUserNormalized, ContributionsNormalized, RepoNormalized } from "@/src/github/normalize";
import { useTheme } from "@/src/theme/ThemeProvider";
import { THEME_PRESETS } from "@/src/types/theme";
import styles from "@/src/studio/studio.module.css";

const STATE_PREFIX = "omnivix:state:";

type FetchSlotErrors = {
  user: string | null;
  contributions: string | null;
  repos: string | null;
};

/**
 * Single message for preview: one slot wins per template.
 * Contribution banner only needs contributions for the canvas; user fetch is sidebar-only.
 */
function previewErrorForTemplate(
  templateId: TemplateId,
  e: FetchSlotErrors,
  dataReady: boolean,
): string | null {
  if (templateId === "contribution-banner" && dataReady) {
    return null;
  }
  if (templateId === "github-banner") {
    if (e.user) return e.user;
    if (e.contributions) return e.contributions;
    return null;
  }
  if (templateId === "contribution-banner") {
    if (e.contributions) return e.contributions;
    if (e.user) return e.user;
    return null;
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

function persistState(templateId: string, state: Record<string, unknown>, needsUsername: boolean) {
  if (typeof window === "undefined") return;
  try {
    const clone = { ...state };
    delete clone.backgroundImage;
    if (needsUsername) {
      // Username is global; avoid stale per-template copies.
      delete clone.username;
    }
    localStorage.setItem(STATE_PREFIX + templateId, JSON.stringify(clone));
  } catch { /* quota exceeded, ignore */ }
}

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

type FetchResult<T> = { url: string; nonce: number; data?: T; error: string | null };

/**
 * Results are stored with the url/nonce they belong to and derived on read,
 * so nothing has to be reset synchronously when the url changes.
 * On error, the last data for the same url is kept.
 */
function useFetchJson<T>(url: string | null, nonce: number, fallbackError: string) {
  const [result, setResult] = useState<FetchResult<T> | null>(null);

  useEffect(() => {
    if (!url) return;
    const ac = new AbortController();
    fetchJson<T>(url, ac.signal).then(
      (data) => {
        if (!ac.signal.aborted) setResult({ url, nonce, data, error: null });
      },
      (error) => {
        if (ac.signal.aborted) return;
        const message = error instanceof Error ? error.message : fallbackError;
        setResult((prev) => ({
          url,
          nonce,
          data: prev?.url === url ? prev.data : undefined,
          error: message,
        }));
      },
    );
    return () => ac.abort();
  }, [url, nonce, fallbackError]);

  const current = url && result?.url === url ? result : null;
  const settled = current !== null && current.nonce === nonce;
  return {
    data: current?.data,
    error: settled ? current.error : null,
    loading: url !== null && !settled,
  };
}

const subscribeNever = () => () => {};

function withPersistedState(
  prev: Record<string, unknown>,
  templateId: TemplateId,
  needsUsername: boolean,
): Record<string, unknown> {
  const persisted = loadPersistedState(templateId);
  const storedUsername = needsUsername ? getStoredUsername() : "";
  if (!persisted && !storedUsername) return prev;

  const merged = { ...prev, ...persisted };
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

export function StudioShell({ templateId }: { templateId: TemplateId }) {
  const { theme: appTheme } = useTheme();
  const definition = templateRegistry[templateId];
  const needsUsername = definition.meta.needsUsername ?? false;

  const [state, setState] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = { ...definition.initialState };
    return initial;
  });

  // Persisted state lives in localStorage, so it is merged in on the first client render
  // (after hydration) to keep the server and client markup identical.
  const isClient = useSyncExternalStore(subscribeNever, () => true, () => false);
  const [hydrated, setHydrated] = useState(false);
  if (isClient && !hydrated) {
    setHydrated(true);
    setState((prev) => withPersistedState(prev, templateId, needsUsername));
  }

  const [refetchNonce, setRefetchNonce] = useState(0);

  const needsContributions =
    templateId === "github-banner" || templateId === "contribution-banner";
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
    "Unable to load GitHub data",
  );
  const contributionsFetch = useFetchJson<ContributionsNormalized>(
    username && needsContributions
      ? `/api/github/contributions?username=${encodedUsername}&year=${encodeURIComponent(yearRaw)}`
      : null,
    refetchNonce,
    "Unable to load GitHub data",
  );
  const reposFetch = useFetchJson<RepoNormalized[]>(
    username && needsReposFetch
      ? `/api/github/repos?username=${encodedUsername}&mode=${encodeURIComponent(repoMode)}&selected=${encodeURIComponent(selectedRepos)}`
      : null,
    refetchNonce,
    "Unable to load GitHub data",
  );
  const catalogFetch = useFetchJson<RepoNormalized[]>(
    username && needsReposFetch && repoMode === "selected"
      ? `/api/github/repos-catalog?username=${encodedUsername}`
      : null,
    refetchNonce,
    "Unable to load repository list",
  );

  const user = userFetch.error ? undefined : userFetch.data;
  const repos = reposFetch.error ? undefined : reposFetch.data;
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

  const dataReady = useMemo(() => {
    if (!needsUsername || !username) return true;
    if (templateId === "github-banner") {
      return Boolean(data.user && data.contributions);
    }
    if (templateId === "contribution-banner") {
      return Boolean(data.contributions);
    }
    if (templateId === "repos-banner") {
      return Boolean(data.user && data.repos);
    }
    return true;
  }, [
    needsUsername,
    username,
    templateId,
    data.user,
    data.contributions,
    data.repos,
  ]);

  const quoteText = String(state.quote ?? "");

  const previewDataError = useMemo(
    () => previewErrorForTemplate(templateId, fetchErrors, dataReady),
    [templateId, fetchErrors, dataReady],
  );

  const previewState = useMemo(
    () =>
      computePreviewContentState({
        hydrated,
        templateId,
        needsUsername,
        username,
        quoteText,
        dataError: previewDataError,
        dataReady,
      }),
    [hydrated, templateId, needsUsername, username, quoteText, previewDataError, dataReady],
  );

  const handlePreviewRetry = useCallback(() => {
    setRefetchNonce((n) => n + 1);
  }, []);

  const [isDownloading, setIsDownloading] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  // Open the username prompt whenever a username becomes required but is missing.
  const shouldPromptUsername = hydrated && needsUsername && !username;
  const [prevShouldPromptUsername, setPrevShouldPromptUsername] = useState(false);
  if (shouldPromptUsername !== prevShouldPromptUsername) {
    setPrevShouldPromptUsername(shouldPromptUsername);
    if (shouldPromptUsername) setShowUsernameModal(true);
  }

  const updateState = useCallback(
    (key: string, value: unknown) => {
      if (key === "username" && typeof value === "string") {
        storeUsername(value);
      }
      setState((prev) => {
        const next = clampSelectedRepos(templateId, { ...prev, [key]: value });
        persistState(templateId, next, needsUsername);
        return next;
      });
    },
    [templateId, needsUsername],
  );

  const stateValid = useMemo(
    () => definition.stateSchema.safeParse(state).success,
    [definition.stateSchema, state],
  );
  const blockedReason = exportBlockedReason({ templateId, previewState, stateValid });

  const [exportFailure, setExportFailure] = useState<{
    message: string;
    state: Record<string, unknown>;
  } | null>(null);
  const exportError = exportFailure?.state === state ? exportFailure.message : null;

  async function onDownload() {
    if (blockedReason) return;
    setIsDownloading(true);
    setExportFailure(null);
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
          pixelRatio: 3,
          uiTheme: appTheme,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setExportFailure({ message: body.error ?? "Export failed. Please try again.", state });
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const sizeSlug = size.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
      anchor.download = `omnivix-${templateId}-${sizeSlug}.png`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      setExportFailure({
        message: "Couldn't reach the server. Check your connection and try again.",
        state,
      });
    } finally {
      setIsDownloading(false);
    }
  }

  function handleUsernameSubmit(newUsername: string) {
    storeUsername(newUsername);
    updateState("username", newUsername);
    setShowUsernameModal(false);
  }

  return (
    <div className={styles.shell}>
      <UsernameModal
        open={showUsernameModal}
        onSubmit={handleUsernameSubmit}
        onCancel={() => setShowUsernameModal(false)}
      />

      <header className={styles.topbar}>
        <TopBar
          title={definition.meta.title}
          onDownload={onDownload}
          isDownloading={isDownloading}
          blockedReason={blockedReason}
          exportError={exportError}
          onDismissExportError={() => setExportFailure(null)}
          username={username}
          needsUsername={needsUsername}
          onChangeUsername={() => setShowUsernameModal(true)}
        />
      </header>
      <div className={styles.content}>
        <aside className={styles.sidebar}>
          <ControlSidebar
            schema={definition.schema}
            state={state}
            templateId={templateId}
            accountCreatedYear={accountCreatedYear}
            onChange={updateState}
            repoCatalog={repoCatalog}
            repoCatalogLoading={repoCatalogLoading}
            repoCatalogError={repoCatalogError}
          />
        </aside>
        <main className={styles.preview}>
          <PreviewArtboard
            templateId={templateId}
            size={size}
            state={state}
            data={data}
            previewState={previewState}
            dataError={previewDataError}
            onRetryError={handlePreviewRetry}
          />
        </main>
      </div>
    </div>
  );
}
