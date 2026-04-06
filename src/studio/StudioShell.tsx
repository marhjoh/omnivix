"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { templateRegistry } from "@/src/templates/registry";
import { BannerSize, TemplateId } from "@/src/types/template";
import { ControlSidebar } from "@/src/studio/ControlSidebar";
import { PreviewArtboard } from "@/src/studio/PreviewArtboard";
import { computePreviewContentState } from "@/src/studio/preview";
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

function emptyFetchErrors(): FetchSlotErrors {
  return { user: null, contributions: null, repos: null };
}

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

export function StudioShell({ templateId }: { templateId: TemplateId }) {
  const { theme: appTheme } = useTheme();
  const definition = templateRegistry[templateId];
  const needsUsername = definition.meta.needsUsername ?? false;

  const [state, setState] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = { ...definition.initialState };
    return initial;
  });

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persisted = loadPersistedState(templateId);
    const storedUsername = needsUsername ? getStoredUsername() : "";
    const themeIds = new Set(THEME_PRESETS.map((p) => p.id));

    if (persisted || storedUsername) {
      setState((prev) => {
        const merged = { ...prev, ...persisted };
        if (needsUsername) {
          merged.username = storedUsername;
        }
        if (typeof merged.themeId !== "string" || !themeIds.has(merged.themeId)) {
          merged.themeId = "default";
        }
        return merged;
      });
    }
    setHydrated(true);
  }, [templateId, needsUsername]);

  const [data, setData] = useState<RenderData>({});
  const [fetchErrors, setFetchErrors] = useState<FetchSlotErrors>(emptyFetchErrors);
  const [repoCatalog, setRepoCatalog] = useState<RepoNormalized[]>([]);
  const [repoCatalogLoading, setRepoCatalogLoading] = useState(false);
  const [repoCatalogError, setRepoCatalogError] = useState<string | null>(null);
  const [refetchNonce, setRefetchNonce] = useState(0);
  const contributionsOkRef = useRef(false);
  const contributionsUsernameRef = useRef<string | null>(null);
  const contributionsYearRef = useRef<string | null>(null);

  const needsContributions =
    templateId === "github-banner" || templateId === "contribution-banner";
  const needsReposFetch = templateId === "repos-banner";

  const size = (state.size as BannerSize) ?? definition.meta.defaultSize;
  const username = (state.username as string) ?? "";

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
    setFetchErrors(emptyFetchErrors());
    setRefetchNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    setFetchErrors(emptyFetchErrors());
  }, [templateId]);

  const [isDownloading, setIsDownloading] = useState(false);
  const [accountCreatedYear, setAccountCreatedYear] = useState<number | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  useEffect(() => {
    if (hydrated && needsUsername && !username) {
      setShowUsernameModal(true);
    }
  }, [hydrated, needsUsername, username]);

  const updateState = useCallback(
    (key: string, value: unknown) => {
      if (key === "username" && typeof value === "string") {
        storeUsername(value);
      }
      setState((prev) => {
        const next = { ...prev, [key]: value };
        persistState(templateId, next, needsUsername);
        return next;
      });
    },
    [templateId, needsUsername],
  );

  useEffect(() => {
    if (!needsUsername || !username) {
      setAccountCreatedYear(null);
      setData((prev) => ({ ...prev, user: undefined }));
      setFetchErrors(emptyFetchErrors());
      return;
    }

    const ac = new AbortController();
    setFetchErrors((prev) => ({ ...prev, user: null }));

    void (async () => {
      try {
        const user = await fetchJson<GithubUserNormalized>(
          `/api/github/user-summary?username=${encodeURIComponent(username)}`,
          ac.signal,
        );
        if (ac.signal.aborted) return;
        setData((prev) => ({ ...prev, user }));
        setFetchErrors((prev) => ({ ...prev, user: null }));
        if (user.createdAt) {
          setAccountCreatedYear(new Date(user.createdAt).getFullYear());
        }
      } catch (error) {
        if (ac.signal.aborted) return;
        setAccountCreatedYear(null);
        setData((prev) => ({ ...prev, user: undefined }));
        const msg = error instanceof Error ? error.message : "Unable to load GitHub data";
        setFetchErrors((prev) => ({ ...prev, user: msg }));
      }
    })();

    return () => ac.abort();
  }, [needsUsername, username, refetchNonce]);

  useEffect(() => {
    if (!username || !needsContributions) {
      contributionsOkRef.current = false;
      contributionsUsernameRef.current = null;
      contributionsYearRef.current = null;
      setData((prev) => ({ ...prev, contributions: undefined }));
      setFetchErrors((prev) => ({ ...prev, contributions: null }));
      return;
    }

    const yearRaw =
      state.year != null && String(state.year).length > 0
        ? String(state.year)
        : String(new Date().getFullYear());

    const usernameChanged = contributionsUsernameRef.current !== username;
    const yearChanged = contributionsYearRef.current !== yearRaw;
    contributionsUsernameRef.current = username;
    contributionsYearRef.current = yearRaw;
    if (usernameChanged || yearChanged) {
      contributionsOkRef.current = false;
      setData((prev) => ({ ...prev, contributions: undefined }));
    }

    const ac = new AbortController();
    setFetchErrors((prev) => ({ ...prev, contributions: null }));

    const yearParam = `&year=${encodeURIComponent(yearRaw)}`;

    void (async () => {
      try {
        const contributions = await fetchJson<ContributionsNormalized>(
          `/api/github/contributions?username=${encodeURIComponent(username)}${yearParam}`,
          ac.signal,
        );
        if (ac.signal.aborted) return;
        contributionsOkRef.current = true;
        setData((prev) => ({ ...prev, contributions }));
        setFetchErrors((prev) => ({ ...prev, contributions: null }));
      } catch (error) {
        if (ac.signal.aborted) return;
        if (!contributionsOkRef.current) {
          setData((prev) => ({ ...prev, contributions: undefined }));
          const msg = error instanceof Error ? error.message : "Unable to load GitHub data";
          setFetchErrors((prev) => ({ ...prev, contributions: msg }));
        }
      }
    })();

    return () => ac.abort();
  }, [username, needsContributions, state.year, refetchNonce]);

  useEffect(() => {
    if (!username || !needsReposFetch) {
      setData((prev) => ({ ...prev, repos: undefined }));
      setFetchErrors((prev) => ({ ...prev, repos: null }));
      return;
    }

    const ac = new AbortController();
    setFetchErrors((prev) => ({ ...prev, repos: null }));

    const mode = String(state.mode ?? "pinned");
    const selected = String(state.selectedRepos ?? "");

    void (async () => {
      try {
        const repos = await fetchJson<RepoNormalized[]>(
          `/api/github/repos?username=${encodeURIComponent(username)}&mode=${encodeURIComponent(mode)}&selected=${encodeURIComponent(selected)}`,
          ac.signal,
        );
        if (ac.signal.aborted) return;
        setData((prev) => ({ ...prev, repos }));
        setFetchErrors((prev) => ({ ...prev, repos: null }));
      } catch (error) {
        if (ac.signal.aborted) return;
        setData((prev) => ({ ...prev, repos: undefined }));
        const msg = error instanceof Error ? error.message : "Unable to load GitHub data";
        setFetchErrors((prev) => ({ ...prev, repos: msg }));
      }
    })();

    return () => ac.abort();
  }, [username, needsReposFetch, state.mode, state.selectedRepos, refetchNonce]);

  useEffect(() => {
    if (!username || !needsReposFetch || String(state.mode ?? "pinned") !== "selected") {
      setRepoCatalog([]);
      setRepoCatalogError(null);
      setRepoCatalogLoading(false);
      return;
    }

    const ac = new AbortController();
    setRepoCatalogLoading(true);
    setRepoCatalogError(null);

    void (async () => {
      try {
        const rows = await fetchJson<RepoNormalized[]>(
          `/api/github/repos-catalog?username=${encodeURIComponent(username)}`,
          ac.signal,
        );
        if (ac.signal.aborted) return;
        setRepoCatalog(rows);
        setRepoCatalogError(null);
      } catch (error) {
        if (ac.signal.aborted) return;
        setRepoCatalog([]);
        setRepoCatalogError(error instanceof Error ? error.message : "Unable to load repository list");
      } finally {
        if (!ac.signal.aborted) setRepoCatalogLoading(false);
      }
    })();

    return () => ac.abort();
  }, [username, needsReposFetch, state.mode, refetchNonce]);

  useEffect(() => {
    if (templateId !== "repos-banner") return;
    const mode = String(state.mode ?? "pinned");
    const maxR = mode === "selected" ? 6 : Math.min(6, Math.max(1, Number(state.maxRepos)));
    setState((prev) => {
      const parts = String(prev.selectedRepos ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length <= maxR) return prev;
      const next = { ...prev, selectedRepos: parts.slice(0, maxR).join(", ") };
      persistState(templateId, next, needsUsername);
      return next;
    });
  }, [templateId, state.maxRepos, state.selectedRepos, state.mode, needsUsername]);

  const canExport = useMemo(
    () => definition.stateSchema.safeParse(state).success,
    [definition.stateSchema, state],
  );

  async function onDownload() {
    if (!canExport) return;
    setIsDownloading(true);
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
      if (!response.ok) return;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `omnivix-${templateId}-${Date.now()}.png`;
      anchor.click();
      URL.revokeObjectURL(url);
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
          canExport={canExport}
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
