"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [accountCreatedYear, setAccountCreatedYear] = useState<number | null>(null);
  const size = (state.size as BannerSize) ?? definition.meta.defaultSize;
  const username = (state.username as string) ?? "";
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
    if (!username) return;
    const run = async () => {
      try {
        setDataError(null);
        setIsLoadingData(true);

        async function fetchJson<T>(url: string): Promise<T> {
          const res = await fetch(url);
          if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
          return res.json();
        }

        const user = await fetchJson<GithubUserNormalized>(`/api/github/user-summary?username=${encodeURIComponent(username)}`);

        if (user.createdAt) {
          setAccountCreatedYear(new Date(user.createdAt).getFullYear());
        }

        const yearRaw = state.year ? String(state.year) : "";
        const thisYear = String(new Date().getFullYear());
        const yearParam = yearRaw && yearRaw !== "latest" && yearRaw !== thisYear
          ? `&year=${encodeURIComponent(yearRaw)}`
          : "";
        const contributions = await fetchJson<ContributionsNormalized>(`/api/github/contributions?username=${encodeURIComponent(username)}${yearParam}`);

        let repos: RepoNormalized[] | undefined = undefined;
        if (templateId === "pinned-repos-banner") {
          const mode = String(state.mode ?? "pinned");
          const selected = String(state.selectedRepos ?? "");
          repos = await fetchJson<RepoNormalized[]>(
            `/api/github/repos?username=${encodeURIComponent(username)}&mode=${mode}&selected=${encodeURIComponent(selected)}`,
          );
        }

        setData({ user, contributions, repos });
        setHasLoadedOnce(true);
      } catch (error) {
        setDataError(error instanceof Error ? error.message : "Unable to load GitHub data");
        setData({});
      } finally {
        setIsLoadingData(false);
      }
    };
    void run();
  }, [username, state.mode, state.selectedRepos, state.year, templateId]);

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
          pixelRatio: 2,
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
          {isLoadingData && !hasLoadedOnce ? (
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
