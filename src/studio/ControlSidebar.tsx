"use client";

import { useState, useEffect, useRef } from "react";
import { Moon, Sun } from "lucide-react";
import { BANNER_SIZE_KEYS, BANNER_SIZES } from "@/src/lib/sizes";
import { Select } from "@/src/ui/Dropdown";
import { PlatformIcon } from "@/src/ui/PlatformIcon";
import type { RepoNormalized } from "@/src/github/normalize";
import { CheckList, CheckRow } from "@/src/studio/CheckList";
import { RepoMultiSelect } from "@/src/studio/RepoMultiSelect";
import { FieldLabel, LabeledGroup } from "@/src/ui/FieldLabel";
import { EditorFieldSchema } from "@/src/types/template";
import { BackgroundImagePicker } from "@/src/studio/BackgroundImagePicker";
import { BackgroundZoomControl } from "@/src/studio/BackgroundZoomControl";
import { isDefaultBackgroundFraming, type BannerBackground } from "@/src/banner/background";
import { THEME_PRESETS } from "@/src/types/theme";
import { MAX_REPOS } from "@/src/lib/repoSelection";
import { fieldLabel, groupFields, STYLE_GROUP } from "@/src/studio/settingGroups";
import controls from "@/src/studio/controls.module.css";
import { textLinkClass } from "@/src/ui/textLinkClass";
import landingStyles from "@/src/landing/landing.module.css";
import { useTheme } from "@/src/theme/ThemeProvider";
import type { Theme } from "@/src/theme/theme";

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
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      {children}
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
    <LabeledGroup label={label}>
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
    </LabeledGroup>
  );
}

const APPEARANCES: Array<{ theme: Theme; label: string; icon: typeof Sun }> = [
  { theme: "light", label: "Light", icon: Sun },
  { theme: "dark", label: "Dark", icon: Moon },
];

/**
 * Light or dark for the whole app, which the banner's text and panels follow too. Not a template
 * setting: it's saved in the theme cookie and shown in every template's Style group.
 */
function AppearancePicker() {
  const { theme, setTheme } = useTheme();
  return (
    <LabeledGroup label="Appearance">
      <div className="grid grid-cols-2 gap-2">
        {APPEARANCES.map(({ theme: option, label, icon: Icon }) => (
          <button
            key={option}
            type="button"
            onClick={() => setTheme(option)}
            aria-pressed={theme === option}
            data-appearance={option}
            className={`${controls.tile} ${controls.appearanceTile}`}
          >
            <Icon className="h-[18px] w-[18px] text-muted" aria-hidden />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </LabeledGroup>
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
    <LabeledGroup label={label}>
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
    </LabeledGroup>
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
    <LabeledGroup label="Show">
      <CheckList>
        {fields.map((field) => {
          const disabled = disabledFields.has(field.key);
          // Shown off while disabled, without changing the saved value.
          const checked = !disabled && Boolean(state[field.key] ?? false);
          return (
            <CheckRow
              key={field.key}
              label={fieldLabel(field)}
              on={checked}
              disabled={disabled}
              onClick={() => onChange(field.key, !checked)}
            />
          );
        })}
      </CheckList>
    </LabeledGroup>
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
              {group.title === STYLE_GROUP && <AppearancePicker />}
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
