"use client";

import { useState } from "react";
import type { RepoNormalized } from "@/src/github/normalize";
import { parseRepoSelection } from "@/src/lib/repoSelection";
import { CheckList, CheckRow, CheckRowSkeleton } from "@/src/studio/CheckList";
import { useDelayedFlag } from "@/src/studio/useDelayedFlag";
import { useTimeReached } from "@/src/studio/preview/useTimeReached";
import { LabeledGroup } from "@/src/ui/FieldLabel";

/** Shown while the repository list loads slowly; quicker loads go straight to the list. */
const REPO_LIST_SKELETON_DELAY_MS = 300;
const SKELETON_ROW_WIDTHS = ["70%", "55%", "80%", "45%", "65%", "50%", "75%"];

/** The repositories to show, picked from the user's public ones, up to `maxPick`. */
export function RepoMultiSelect({
  catalog,
  loading,
  error,
  retryAt,
  onRetry,
  valueCsv,
  maxPick,
  onChange,
}: {
  catalog: RepoNormalized[];
  loading: boolean;
  error: string | null;
  /** Until then Retry is disabled (GitHub's rate limit). */
  retryAt: Date | null;
  onRetry: () => void;
  valueCsv: string;
  maxPick: number;
  onChange: (csv: string) => void;
}) {
  const retryReached = useTimeReached(retryAt);
  const selected = parseRepoSelection(valueCsv);
  // The picks from when the list opened come first, so they show (checked) while the rest
  // loads and don't move when it arrives. Clicking later doesn't reorder anything.
  const [initialPicks] = useState(selected);
  const showSkeleton = useDelayedFlag(loading, REPO_LIST_SKELETON_DELAY_MS);

  const toggle = (name: string) => {
    const i = selected.indexOf(name);
    let next: string[];
    if (i >= 0) {
      next = [...selected.slice(0, i), ...selected.slice(i + 1)];
    } else if (selected.length >= maxPick) {
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
        disabled={!on && selected.length >= maxPick}
        onClick={() => toggle(name)}
      />
    );
  };

  // A pick that's no longer in the list (renamed, deleted, made private) still shows, so it can
  // be removed: otherwise it would count toward the limit with no way to unpick it.
  const missing = selected.filter((name) => !catalog.some((repo) => repo.name === name));
  const ordered = [
    ...initialPicks.flatMap((name) => catalog.find((repo) => repo.name === name) ?? []),
    ...catalog.filter((repo) => !initialPicks.includes(repo.name)),
  ];

  return (
    <LabeledGroup
      label="Repositories"
      // Picked of the most allowed, so rows greyed out at the limit make sense.
      end={
        <span className="field-label tabular-nums">
          {selected.length}/{maxPick}
        </span>
      }
    >
      <CheckList scroll busy={loading}>
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
            <button
              type="button"
              onClick={onRetry}
              disabled={!retryReached}
              className="btn-secondary h-9 px-3 py-0"
            >
              Try again
            </button>
          </div>
        ) : loading ? (
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
