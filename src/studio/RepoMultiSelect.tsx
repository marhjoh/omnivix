"use client";

import { useState } from "react";
import type { RepoNormalized } from "@/src/github/types";
import { MAX_REPOS, parseRepoSelection } from "@/src/lib/repoSelection";
import { CheckList, CheckRow, CheckRowSkeleton } from "@/src/studio/CheckList";
import { useDelayedFlag } from "@/src/ui/useDelayedFlag";
import { useTimeReached } from "@/src/ui/useTimeReached";
import { FieldValue, LabeledGroup } from "@/src/ui/FieldLabel";

const SKELETON_ROW_WIDTHS = ["70%", "55%", "80%", "45%", "65%", "50%", "75%"];

/** The owner's repositories for the picker, with their loading state. */
export interface RepoCatalog {
  repos: RepoNormalized[];
  loading: boolean;
  error: string | null;
  /** When the rate limit resets, if that's why loading failed. Retry waits until then. */
  retryAt: Date | null;
  retry: () => void;
}

/** Picks up to MAX_REPOS of the user's public repositories to show. */
export function RepoMultiSelect({
  catalog: { repos: catalog, loading, error, retryAt, retry },
  valueCsv,
  onChange,
}: {
  catalog: RepoCatalog;
  valueCsv: string;
  onChange: (csv: string) => void;
}) {
  const retryReached = useTimeReached(retryAt);
  const selected = parseRepoSelection(valueCsv);
  // Repositories picked when the list opened come first. They show checked while the rest loads,
  // and don't move when it arrives. Later clicks don't reorder anything.
  const [initialPicks] = useState(selected);
  // Show a skeleton only when loading is slow, and keep it for a minimum time once shown. Fast
  // loads go straight to the list.
  const showSkeleton = useDelayedFlag(loading);
  const pending = loading || showSkeleton;

  const toggle = (name: string) => {
    const i = selected.indexOf(name);
    let next: string[];
    if (i >= 0) {
      next = [...selected.slice(0, i), ...selected.slice(i + 1)];
    } else if (selected.length >= MAX_REPOS) {
      return;
    } else {
      next = [...selected, name];
    }
    onChange(next.join(", "));
  };

  const row = (name: string, key: string) => {
    const on = selected.includes(name);
    return (
      <CheckRow
        key={key}
        label={name}
        on={on}
        // At the limit, only already-selected repositories can be clicked (to remove them).
        disabled={!on && selected.length >= MAX_REPOS}
        onClick={() => toggle(name)}
      />
    );
  };

  // Keep showing a pick that's gone from the list (renamed, deleted or made private). Otherwise it
  // would count toward the limit with no way to remove it.
  const missing = selected.filter((name) => !catalog.some((repo) => repo.name === name));
  const ordered = [
    ...initialPicks.flatMap((name) => catalog.find((repo) => repo.name === name) ?? []),
    ...catalog.filter((repo) => !initialPicks.includes(repo.name)),
  ];

  return (
    <LabeledGroup
      label="Repositories"
      // Shows picked out of the maximum, so it's clear why rows are grayed out at the limit.
      end={
        <FieldValue>
          {selected.length}/{MAX_REPOS}
        </FieldValue>
      }
    >
      <CheckList scroll busy={pending}>
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
            <button
              type="button"
              onClick={retry}
              disabled={!retryReached}
              className="btn-secondary h-9 px-3 py-0"
            >
              Try again
            </button>
          </div>
        ) : pending ? (
          <>
            {initialPicks.map((name) => row(name, name))}
            {showSkeleton
              ? SKELETON_ROW_WIDTHS.slice(initialPicks.length).map((width, i) => (
                  <CheckRowSkeleton key={i} width={width} />
                ))
              : null}
          </>
        ) : ordered.length === 0 && missing.length === 0 ? (
          <p className="px-3 py-2.5 text-sm text-muted">No public repositories found.</p>
        ) : (
          <>
            {missing.map((name) => row(name, `missing:${name}`))}
            {ordered.map((repo) => row(repo.name, repo.id))}
          </>
        )}
      </CheckList>
    </LabeledGroup>
  );
}
