"use client";

import { useState, useEffect, useRef } from "react";
import { BANNER_SIZE_KEYS, BANNER_SIZES } from "@/src/lib/sizes";
import { Select } from "@/src/ui/Dropdown";
import { PlatformIcon } from "@/src/ui/PlatformIcon";
import type { RepoNormalized } from "@/src/github/normalize";
import { EditorFieldSchema, TemplateId } from "@/src/types/template";
import { BackgroundImagePicker } from "@/src/studio/BackgroundImagePicker";
import { BackgroundAdjustControls } from "@/src/studio/BackgroundAdjustControls";
import { isDefaultBackgroundFraming, type BannerBackground } from "@/src/banner/background";
import { THEME_PRESETS } from "@/src/types/theme";
import { MAX_REPOS, parseRepoSelection } from "@/src/lib/repoSelection";

const currentYear = new Date().getFullYear();

function DebouncedInput({
  id,
  placeholder,
  maxLength,
  value: externalValue,
  onChange,
}: {
  id: string;
  placeholder?: string;
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
    timeoutRef.current = setTimeout(() => onChange(newValue), 400);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <input
      id={id}
      type="text"
      className="field-input"
      placeholder={placeholder}
      maxLength={maxLength}
      value={localValue}
      onChange={handleChange}
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
      <label htmlFor={htmlFor} className="block text-xs font-medium text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

function RepoMultiSelect({
  catalog,
  loading,
  error,
  valueCsv,
  maxPick,
  onChange,
}: {
  catalog: RepoNormalized[];
  loading: boolean;
  error: string | null;
  valueCsv: string;
  maxPick: number;
  onChange: (csv: string) => void;
}) {
  const selected = parseRepoSelection(valueCsv);

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

  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-medium text-muted">Repositories</span>
      {loading && <p className="text-xs text-muted">Loading repository list…</p>}
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && (
        <div className="max-h-52 space-y-0.5 overflow-y-auto rounded-lg border border-border bg-surface-2 p-1.5">
          {catalog.length === 0 ? (
            <p className="px-2 py-2 text-xs text-muted">No public repositories found.</p>
          ) : (
            catalog.map((repo) => {
              const on = selected.includes(repo.name);
              // At the limit, only already-selected repositories can be clicked (to remove them).
              const full = !on && selected.length >= maxPick;
              return (
                <button
                  key={repo.id}
                  type="button"
                  onClick={() => toggle(repo.name)}
                  disabled={full}
                  aria-pressed={on}
                  className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    on
                      ? "border-accent bg-accent/10 text-text"
                      : "border-transparent text-muted enabled:hover:bg-surface"
                  }`}
                >
                  <span
                    className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[var(--radius)] border ${
                      on ? "border-accent bg-accent" : "border-border"
                    }`}
                  >
                    {on ? <span className="text-[8px] leading-none text-white">✓</span> : null}
                  </span>
                  <span className="min-w-0 truncate font-medium">{repo.name}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function ThemePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const resolvedId = THEME_PRESETS.some((p) => p.id === value) ? value : "default";

  return (
    <div className="space-y-2">
      <span className="block text-xs font-medium text-muted">Theme</span>
      <div className="flex flex-col gap-2">
        {THEME_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange(preset.id)}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-xs transition-all ${
              resolvedId === preset.id
                ? "border-accent bg-accent/10 text-text"
                : "border-border bg-surface-2 text-muted hover:border-accent/40"
            }`}
          >
            <span className="font-medium">{preset.label}</span>
            <div className="ml-auto flex gap-1">
              {preset.gridLevels.map((color, i) => (
                <div key={i} className="h-4 w-4 rounded-xs" style={{ backgroundColor: color }} />
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
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
    <div className="space-y-2">
      <span className="block text-xs font-medium text-muted">{label}</span>
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
              className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs transition-all ${
                value === key
                  ? "border-accent bg-accent/10 text-text"
                  : "border-border bg-surface-2 text-muted hover:border-accent/40"
              }`}
            >
              <span className="flex h-6 items-center">
                <span
                  aria-hidden
                  className="block rounded-[2px] border border-current opacity-70"
                  style={{ width: 40, aspectRatio: `${format.width} / ${format.height}` }}
                />
              </span>
              <span className="font-medium">{format.label}</span>
              <span className="flex flex-wrap justify-center gap-1 opacity-70">
                {format.platforms.map((platform) => (
                  <PlatformIcon key={platform.name} icon={platform.icon} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ControlSidebar({
  schema,
  state,
  templateId,
  accountCreatedYear,
  onChange,
  repoCatalog,
  repoCatalogLoading,
  repoCatalogError,
  disabledFields,
  adjustableBackground,
  backgroundAdjusting,
  onToggleBackgroundAdjusting,
  onError,
  onErrorResolved,
}: {
  schema: EditorFieldSchema[];
  state: Record<string, unknown>;
  templateId: TemplateId;
  accountCreatedYear: number | null;
  onChange: (key: string, value: unknown) => void;
  repoCatalog: RepoNormalized[];
  repoCatalogLoading: boolean;
  repoCatalogError: string | null;
  /** Keys of fields that are unavailable right now; they're disabled and toggles show off. */
  disabledFields: ReadonlySet<string>;
  /** The background that can be moved and zoomed; none when there's none, or it can't be used. */
  adjustableBackground: BannerBackground | undefined;
  /** Whether the preview is in background adjust mode (drag to move). */
  backgroundAdjusting: boolean;
  onToggleBackgroundAdjusting: () => void;
  /** Shows a one-off error as a toast (e.g. a rejected upload); returns the toast's id. */
  onError: (message: string) => number;
  /** Hides the toast with this id, if it's still showing. */
  onErrorResolved: (toastId: number) => void;
}) {
  const mode = state.mode as string | undefined;
  const background = adjustableBackground;

  const startYear = accountCreatedYear ?? currentYear - 9;
  const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) =>
    String(currentYear - i),
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-1 text-sm font-semibold text-text">Customize</h3>
        <p className="text-xs text-muted">Adjust settings to personalize your banner.</p>
      </div>

      {schema.map((field) => {
        if (field.key === "username") return null;

        if (field.key === "maxRepos" && templateId === "repos-banner" && mode === "selected") {
          return null;
        }

        if (field.type === "repoMultiSelect") {
          if (templateId !== "repos-banner" || mode !== "selected") {
            return null;
          }
          return (
            <RepoMultiSelect
              key={field.key}
              catalog={repoCatalog}
              loading={repoCatalogLoading}
              error={repoCatalogError}
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
              label={field.label}
              value={String(state[field.key] ?? "")}
              onChange={(v) => onChange(field.key, v)}
            />
          );
        }

        if (field.key === "themeId") {
          return (
            <ThemePicker
              key={field.key}
              value={String(state[field.key] ?? "")}
              onChange={(v) => onChange(field.key, v)}
            />
          );
        }

        if (field.key === "year") {
          const contributionTemplates =
            templateId === "github-banner" || templateId === "contribution-banner";
          const yearOptions = contributionTemplates
            ? [
                { value: "latest", label: "Last 365 days" },
                ...years.map((y) => ({ value: y, label: y })),
              ]
            : years.map((y) => ({ value: y, label: y }));
          return (
            <FieldWrapper key={field.key} label={field.label} htmlFor={field.key}>
              <Select
                id={field.key}
                label={field.label}
                value={String(state[field.key] ?? currentYear)}
                options={yearOptions}
                onChange={(value) => onChange(field.key, value)}
              />
            </FieldWrapper>
          );
        }

        if (field.type === "toggle") {
          const disabled = disabledFields.has(field.key);
          // Shown off while disabled, without changing the saved value.
          const checked = !disabled && Boolean(state[field.key] ?? false);
          return (
            <div key={field.key}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted">{field.label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={checked}
                  aria-label={field.label}
                  disabled={disabled}
                  onClick={() => onChange(field.key, !checked)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    checked ? "bg-accent" : "bg-surface-2"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      checked ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        }

        if (field.type === "range") {
          const val = Number(state[field.key] ?? field.min ?? 1);
          return (
            <FieldWrapper key={field.key} label={`${field.label}: ${val}`} htmlFor={field.key}>
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
            <FieldWrapper key={field.key} label={field.label} htmlFor={field.key}>
              <Select
                id={field.key}
                label={field.label}
                value={String(state[field.key] ?? "")}
                options={field.options ?? []}
                onChange={(value) => onChange(field.key, value)}
                disabled={disabledFields.has(field.key)}
              />
            </FieldWrapper>
          );
        }

        if (field.type === "textarea") {
          return (
            <FieldWrapper key={field.key} label={field.label} htmlFor={field.key}>
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
            <div key={field.key} className="space-y-3">
              <BackgroundImagePicker
                id={field.key}
                label={field.label}
                value={
                  typeof state[field.key] === "string" ? (state[field.key] as string) : undefined
                }
                onChange={(next) => onChange(field.key, next)}
                onError={onError}
                onErrorResolved={onErrorResolved}
              />
              {background ? (
                <BackgroundAdjustControls
                  id={field.key}
                  adjusting={backgroundAdjusting}
                  onToggleAdjusting={onToggleBackgroundAdjusting}
                  zoom={background.zoom}
                  onZoomChange={(zoom) => onChange("backgroundZoom", zoom)}
                  canReset={!isDefaultBackgroundFraming(background)}
                  onReset={() => {
                    onChange("backgroundPosition", undefined);
                    onChange("backgroundZoom", undefined);
                  }}
                />
              ) : null}
            </div>
          );
        }

        return (
          <FieldWrapper key={field.key} label={field.label} htmlFor={field.key}>
            <DebouncedInput
              id={field.key}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              value={String(state[field.key] ?? "")}
              onChange={(v) => onChange(field.key, v)}
            />
          </FieldWrapper>
        );
      })}
    </div>
  );
}
