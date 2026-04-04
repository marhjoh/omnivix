"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { templateRegistry } from "@/src/templates/registry";
import { BannerSize, TemplateId } from "@/src/types/template";
import { ControlSidebar } from "@/src/studio/ControlSidebar";
import { PreviewArtboard } from "@/src/studio/PreviewArtboard";
import { TopBar } from "@/src/studio/TopBar";
import { UsernameModal, getStoredUsername, storeUsername } from "@/src/studio/UsernameModal";
import { RenderData } from "@/src/templates/renderers/types";
import type { GithubUserNormalized, ContributionsNormalized, RepoNormalized } from "@/src/github/normalize";
import styles from "@/src/studio/studio.module.css";

const STATE_PREFIX = "omnivix:state:";

function loadPersistedState(templateId: string): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STATE_PREFIX + templateId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistState(templateId: string, state: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const clone = { ...state };
    delete clone.backgroundImage;
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

    if (persisted || storedUsername) {
      setState((prev) => {
        const merged = { ...prev, ...persisted };
        if (needsUsername && storedUsername && !merged.username) {
          merged.username = storedUsername;
        }
        return merged;
      });
    }
    setHydrated(true);
  }, [templateId, needsUsername]);

  const [data, setData] = useState<RenderData>({});
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingContributions, setLoadingContributions] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const contributionsOkRef = useRef(false);
  const contributionsUsernameRef = useRef<string | null>(null);

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

  const isBlockingLoad =
    needsUsername &&
    Boolean(username) &&
    !dataReady &&
    !dataError &&
    (loadingUser || loadingContributions || loadingRepos);
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
      setState((prev) => {
        const next = { ...prev, [key]: value };
        persistState(templateId, next);
        return next;
      });
    },
    [templateId],
  );

  useEffect(() => {
    if (!needsUsername || !username) {
      setAccountCreatedYear(null);
      setData((prev) => ({ ...prev, user: undefined }));
      return;
    }

    const ac = new AbortController();
    setLoadingUser(true);
    setDataError(null);

    void (async () => {
      try {
        const user = await fetchJson<GithubUserNormalized>(
          `/api/github/user-summary?username=${encodeURIComponent(username)}`,
          ac.signal,
        );
        if (ac.signal.aborted) return;
        setData((prev) => ({ ...prev, user }));
        if (user.createdAt) {
          setAccountCreatedYear(new Date(user.createdAt).getFullYear());
        }
      } catch (error) {
        if (ac.signal.aborted) return;
        setAccountCreatedYear(null);
        setData((prev) => ({ ...prev, user: undefined }));
        setDataError(error instanceof Error ? error.message : "Unable to load GitHub data");
      } finally {
        setLoadingUser(false);
      }
    })();

    return () => ac.abort();
  }, [needsUsername, username]);

  useEffect(() => {
    if (!username || !needsContributions) {
      contributionsOkRef.current = false;
      contributionsUsernameRef.current = null;
      setData((prev) => ({ ...prev, contributions: undefined }));
      return;
    }

    const usernameChanged = contributionsUsernameRef.current !== username;
    contributionsUsernameRef.current = username;
    if (usernameChanged) {
      contributionsOkRef.current = false;
      setData((prev) => ({ ...prev, contributions: undefined }));
    }

    const ac = new AbortController();
    setLoadingContributions(true);
    setDataError(null);

    const yearRaw =
      state.year != null && String(state.year).length > 0
        ? String(state.year)
        : String(new Date().getFullYear());
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
      } catch (error) {
        if (ac.signal.aborted) return;
        if (!contributionsOkRef.current) {
          setData((prev) => ({ ...prev, contributions: undefined }));
          setDataError(
            error instanceof Error ? error.message : "Unable to load GitHub data",
          );
        }
      } finally {
        setLoadingContributions(false);
      }
    })();

    return () => ac.abort();
  }, [username, needsContributions, state.year]);

  useEffect(() => {
    if (!username || !needsReposFetch) {
      setData((prev) => ({ ...prev, repos: undefined }));
      return;
    }

    const ac = new AbortController();
    setLoadingRepos(true);
    setDataError(null);

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
      } catch (error) {
        if (ac.signal.aborted) return;
        setData((prev) => ({ ...prev, repos: undefined }));
        setDataError(error instanceof Error ? error.message : "Unable to load GitHub data");
      } finally {
        setLoadingRepos(false);
      }
    })();

    return () => ac.abort();
  }, [username, needsReposFetch, state.mode, state.selectedRepos]);

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
          />
        </aside>
        <main className={styles.preview}>
          {isBlockingLoad ? (
            <div className={styles.loading}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/icon.svg" alt="" className={styles.loadingLogo} />
              <span>Loading GitHub data&hellip;</span>
            </div>
          ) : dataError ? (
            <div className={styles.error}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/icon.svg" alt="" className={styles.errorLogo} />
              <p className={styles.errorTitle}>{dataError}</p>
              <p className={styles.errorHint}>Please check the username and try again.</p>
            </div>
          ) : null}
          <PreviewArtboard templateId={templateId} size={size} state={state} data={data} />
        </main>
      </div>
    </div>
  );
}
