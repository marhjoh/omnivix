"use client";

import { useState, useEffect, useId, useRef } from "react";
import { Check } from "lucide-react";
import { BANNER_SIZE_KEYS, BANNER_SIZES } from "@/src/lib/sizes";
import { Select } from "@/src/ui/Dropdown";
import { PlatformIcon } from "@/src/ui/PlatformIcon";
import type { RepoNormalized } from "@/src/github/normalize";
import { EditorFieldSchema } from "@/src/types/template";
import { BackgroundImagePicker } from "@/src/studio/BackgroundImagePicker";
import { useDelayedFlag } from "@/src/studio/useDelayedFlag";
import { useTimeReached } from "@/src/studio/preview/useTimeReached";
import { BackgroundZoomControl } from "@/src/studio/BackgroundZoomControl";
import { isDefaultBackgroundFraming, type BannerBackground } from "@/src/banner/background";
import { THEME_PRESETS } from "@/src/types/theme";
import { MAX_REPOS, parseRepoSelection } from "@/src/lib/repoSelection";
import { fieldLabel, groupFields } from "@/src/studio/settingGroups";
import controls from "@/src/studio/controls.module.css";
import { textLinkClass } from "@/src/ui/textLinkClass";
import landingStyles from "@/src/landing/landing.module.css";

const currentYear = new Date().getFullYear();

/** How long text fields wait after the last keystroke before updating the banner. */
const INPUT_DEBOUNCE_MS = 400;

function DebouncedInput({
  id,
  maxLength,
  value: externalValue,
  onChange,
}: {
  id: string;
  maxLength?: number;
  value: string;
  onChange: (value: string) => void;
}) {
  const [localValue, setLocalValue] = useState(externalValue);
  const [prevExternalValue, setPrevExternalValue] = useState(externalValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (externalValue !== prevExternalValue) {
    setPrevExternalValue(externalValue);
    setLocalValue(externalValue);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      onChange(newValue);
    }, INPUT_DEBOUNCE_MS);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Leaving the field saves a pending value now instead of after the debounce.
  const flush = () => {
    if (!timeoutRef.current) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    onChange(localValue);
  };

  return (
    <input
      id={id}
      type="text"
      className="field-input"
      maxLength={maxLength}
      value={localValue}
      onChange={handleChange}
      onBlur={flush}
    />
  );
}

function FieldWrapper({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="field-label">
        {label}
      </label>
      {children}
    </div>
  );
}

/** Shown while the repository list loads slowly; quicker loads go straight to the list. */
const REPO_LIST_SKELETON_DELAY_MS = 300;
const SKELETON_ROW_WIDTHS = ["70%", "55%", "80%", "45%", "65%", "50%", "75%"];

function RepoRow({
  name,
  on,
  disabled,
  onClick,
}: {
  name: string;
  on: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        on
          ? "border-accent bg-accent/10 text-text"
          : "border-transparent text-muted enabled:hover:bg-surface"
      }`}
    >
      <span
        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
          on ? "border-accent bg-accent" : "border-border"
        }`}
      >
        {on ? <span className="text-[8px] leading-none text-white">✓</span> : null}
      </span>
      <span className="min-w-0 truncate font-medium">{name}</span>
    </button>
  );
}

function RepoMultiSelect({
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
      <RepoRow
        key={key}
        name={name}
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
    <div className="space-y-1.5" role="group" aria-labelledby="repositories-label">
      <span id="repositories-label" className="field-label">
        Repositories
      </span>
      {/* The box keeps one height whether loading, loaded or failed, so nothing below it moves. */}
      <div
        className="h-52 space-y-0.5 overflow-y-auto rounded-lg border border-border bg-surface-2 p-1.5"
        aria-busy={loading}
      >
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-3 text-center">
            <p className="text-xs text-danger" role="alert">
              {error}
            </p>
            <button
              type="button"
              onClick={onRetry}
              disabled={!retryReached}
              className="btn-secondary px-3 py-1 text-xs"
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <>
            {initialPicks.map((name) => row(name, name))}
            {showSkeleton
              ? SKELETON_ROW_WIDTHS.slice(initialPicks.length).map((width, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1.5" aria-hidden>
                    <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-border/70 motion-safe:animate-pulse" />
                    <span
                      className="h-2.5 rounded bg-border/70 motion-safe:animate-pulse"
                      style={{ width }}
                    />
                  </div>
                ))
              : null}
          </>
        ) : ordered.length === 0 && missing.length === 0 ? (
          <p className="px-2 py-2 text-xs text-muted">No public repositories found.</p>
        ) : (
          <>
            {missing.map((name) => row(name, `missing:${name}`))}
            {ordered.map((repo) => row(repo.name, repo.id))}
          </>
        )}
      </div>
    </div>
  );
}

function ThemePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
}) {
  const resolvedId = THEME_PRESETS.some((p) => p.id === value) ? value : "default";
  return (
    <TileGroup label={label}>
      <div className="grid grid-cols-2 gap-2">
        {THEME_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange(preset.id)}
            aria-pressed={resolvedId === preset.id}
            className={`${controls.tile} ${controls.colorTile}`}
          >
            <span className={controls.colorStrip} aria-hidden>
              {preset.gridLevels.slice(1).map((color) => (
                <span key={color} style={{ backgroundColor: color }} />
              ))}
            </span>
            <span className="truncate text-left">{preset.label}</span>
          </button>
        ))}
      </div>
    </TileGroup>
  );
}

function SizePicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (size: string) => void;
  label: string;
}) {
  return (
    <TileGroup label={label}>
      <div className="grid grid-cols-3 gap-2">
        {BANNER_SIZE_KEYS.map((key) => {
          const format = BANNER_SIZES[key];
          const platforms = format.platforms.map((p) => p.name).join(", ");
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-pressed={value === key}
              aria-label={`${format.label}: ${platforms}`}
              className={controls.tile}
            >
              <span className="font-semibold">{format.label}</span>
              <span className="flex flex-wrap justify-center gap-1 text-muted">
                {/* Muted, like the platform icons on the landing page. */}
                {format.platforms.map((platform) => (
                  <PlatformIcon key={platform.name} icon={platform.icon} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </TileGroup>
  );
}

/** A labeled group of tiles: the visible label names the group for screen readers. */
function TileGroup({ label, children }: { label: string; children: React.ReactNode }) {
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId} className="space-y-1.5">
      <span id={labelId} className="field-label">
        {label}
      </span>
      {children}
    </div>
  );
}

/** Show/hide settings as one list, a row per setting with a check on the right. */
function ShowList({
  fields,
  state,
  disabledFields,
  onChange,
}: {
  fields: EditorFieldSchema[];
  state: Record<string, unknown>;
  disabledFields: ReadonlySet<string>;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <TileGroup label="Show">
      <div className={controls.showList}>
        {fields.map((field) => {
          const disabled = disabledFields.has(field.key);
          // Shown off while disabled, without changing the saved value.
          const checked = !disabled && Boolean(state[field.key] ?? false);
          return (
            <button
              key={field.key}
              type="button"
              aria-pressed={checked}
              disabled={disabled}
              onClick={() => onChange(field.key, !checked)}
              className={controls.showRow}
            >
              <span className="truncate">{fieldLabel(field)}</span>
              <span className={controls.check} aria-hidden>
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>
    </TileGroup>
  );
}

export function ControlSidebar({
  schema,
  state,
  accountCreatedYear,
  onChange,
  repoCatalog,
  repoCatalogLoading,
  repoCatalogError,
  repoCatalogRetryAt,
  onRetryRepoCatalog,
  disabledFields,
  adjustableBackground: background,
  onError,
  onErrorResolved,
  onUnusableLinkText,
}: {
  schema: EditorFieldSchema[];
  state: Record<string, unknown>;
  accountCreatedYear: number | null;
  onChange: (key: string, value: unknown) => void;
  repoCatalog: RepoNormalized[];
  repoCatalogLoading: boolean;
  repoCatalogError: string | null;
  /** When GitHub's rate limit resets, if that's why the repositories didn't load. */
  repoCatalogRetryAt: Date | null;
  onRetryRepoCatalog: () => void;
  /** Keys of fields that are unavailable right now; they're disabled and toggles show off. */
  disabledFields: ReadonlySet<string>;
  /** The background that can be moved and zoomed; none when there's none, or it can't be used. */
  adjustableBackground: BannerBackground | undefined;
  /** Shows a one-off error as a toast (e.g. a rejected upload); returns the toast's id. */
  onError: (message: string) => number;
  /** Hides the toast with this id, if it's still showing. */
  onErrorResolved: (toastId: number) => void;
  /** The background's link field holds text that isn't a link (see BackgroundImagePicker). */
  onUnusableLinkText: (unusable: boolean) => void;
}) {
  const mode = state.mode as string | undefined;

  const startYear = accountCreatedYear ?? currentYear - 9;
  const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) =>
    String(currentYear - i),
  );

  const renderField = (field: EditorFieldSchema) => {
    // Selected mode shows the repository picker instead of the amount slider.
    if (field.key === "maxRepos" && mode === "selected") {
      return null;
    }

    if (field.type === "repoMultiSelect") {
      if (mode !== "selected") {
        return null;
      }
      return (
        <RepoMultiSelect
          key={field.key}
          catalog={repoCatalog}
          loading={repoCatalogLoading}
          error={repoCatalogError}
          retryAt={repoCatalogRetryAt}
          onRetry={onRetryRepoCatalog}
          valueCsv={String(state.selectedRepos ?? "")}
          maxPick={MAX_REPOS}
          onChange={(csv) => onChange("selectedRepos", csv)}
        />
      );
    }

    if (field.type === "sizeSelect") {
      return (
        <SizePicker
          key={field.key}
          label={fieldLabel(field)}
          value={String(state[field.key] ?? "")}
          onChange={(v) => onChange(field.key, v)}
        />
      );
    }

    if (field.key === "themeId") {
      return (
        <ThemePicker
          key={field.key}
          label={fieldLabel(field)}
          value={String(state[field.key] ?? "")}
          onChange={(v) => onChange(field.key, v)}
        />
      );
    }

    if (field.key === "year") {
      const yearOptions = [
        { value: "latest", label: "Last 365 days" },
        ...years.map((y) => ({ value: y, label: y })),
      ];
      return (
        <Select
          key={field.key}
          label={fieldLabel(field)}
          value={String(state[field.key] ?? currentYear)}
          options={yearOptions}
          onChange={(value) => onChange(field.key, value)}
        />
      );
    }

    if (field.type === "range") {
      const val = Number(state[field.key] ?? field.min ?? 1);
      return (
        <FieldWrapper key={field.key} label={`${fieldLabel(field)}: ${val}`} htmlFor={field.key}>
          <input
            id={field.key}
            type="range"
            min={field.min}
            max={field.max}
            step={field.step}
            value={val}
            onChange={(e) => onChange(field.key, Number(e.target.value))}
            className="w-full accent-accent"
          />
        </FieldWrapper>
      );
    }

    if (field.type === "select") {
      return (
        <Select
          key={field.key}
          label={fieldLabel(field)}
          value={String(state[field.key] ?? "")}
          options={field.options ?? []}
          onChange={(value) => onChange(field.key, value)}
          disabled={disabledFields.has(field.key)}
        />
      );
    }

    if (field.type === "textarea") {
      return (
        <FieldWrapper key={field.key} label={fieldLabel(field)} htmlFor={field.key}>
          <textarea
            id={field.key}
            maxLength={field.maxLength}
            rows={4}
            className="field-input resize-y"
            value={String(state[field.key] ?? "")}
            onChange={(e) => onChange(field.key, e.target.value)}
          />
        </FieldWrapper>
      );
    }

    if (field.type === "backgroundPicker") {
      return (
        <BackgroundImagePicker
          key={field.key}
          id={field.key}
          label={fieldLabel(field)}
          value={typeof state[field.key] === "string" ? (state[field.key] as string) : undefined}
          onChange={(next) => onChange(field.key, next)}
          onError={onError}
          onErrorResolved={onErrorResolved}
          onUnusableLinkText={onUnusableLinkText}
          labelAction={
            // Only once the image has been moved or zoomed in the preview.
            background && !isDefaultBackgroundFraming(background) ? (
              <button
                type="button"
                aria-label="Reset position and zoom"
                onClick={() => {
                  onChange("backgroundPosition", undefined);
                  onChange("backgroundZoom", undefined);
                }}
                className={`text-[13px] font-medium ${textLinkClass}`}
              >
                Reset
              </button>
            ) : null
          }
        >
          {background ? (
            <BackgroundZoomControl
              id={field.key}
              zoom={background.zoom}
              onZoomChange={(zoom) => onChange("backgroundZoom", zoom)}
            />
          ) : null}
        </BackgroundImagePicker>
      );
    }

    return (
      <FieldWrapper key={field.key} label={fieldLabel(field)} htmlFor={field.key}>
        <DebouncedInput
          id={field.key}
          maxLength={field.maxLength}
          value={String(state[field.key] ?? "")}
          onChange={(v) => onChange(field.key, v)}
        />
      </FieldWrapper>
    );
  };

  return (
    <div className="space-y-8">
      {groupFields(schema).map((group) => {
        const toggles = group.fields.filter((field) => field.type === "toggle");
        return (
          <section key={group.title} aria-labelledby={`settings-${group.title}`}>
            <h2 id={`settings-${group.title}`} className={controls.groupTitle}>
              {/* The landing page's heading gradient, on a span so it spans the word, not the row. */}
              <span className={landingStyles.gradientText}>{group.title}</span>
            </h2>
            <div className="space-y-4">
              {/* Show/hide options are gathered at the end of their group, as one list. */}
              {group.fields.filter((field) => field.type !== "toggle").map(renderField)}
              {toggles.length > 0 && (
                <ShowList
                  fields={toggles}
                  state={state}
                  disabledFields={disabledFields}
                  onChange={onChange}
                />
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
