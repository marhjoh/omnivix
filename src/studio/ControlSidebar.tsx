"use client";

import { Fragment, useId, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import {
  BANNER_SIZE_KEYS,
  BANNER_SIZES,
  bannerFormatOf,
  platformOf,
  type PlatformId,
} from "@/src/lib/sizes";
import {
  DropdownGroupLabel,
  DropdownList,
  DropdownOption,
  DropdownRoot,
  DropdownTrigger,
  Select,
  useDropdown,
} from "@/src/ui/Dropdown";
import { PlatformIcon } from "@/src/ui/PlatformIcon";
import type { RepoNormalized } from "@/src/github/normalize";
import { CheckList, CheckRow } from "@/src/studio/CheckList";
import { RepoMultiSelect } from "@/src/studio/RepoMultiSelect";
import { FieldWrapper, LabeledGroup } from "@/src/ui/FieldLabel";
import type { EditorFieldSchema, EditorFieldType } from "@/src/types/template";
import { ColorSelect } from "@/src/studio/ColorSelect";
import {
  AuthorPrefixSelect,
  FontSelect,
  FontStyleSelect,
  QuoteMarksSelect,
} from "@/src/studio/QuoteFields";
import { BackgroundField, LogoField } from "@/src/studio/ImageFields";
import { ResetButton } from "@/src/studio/ResetButton";
import type { BannerBackground } from "@/src/banner/background";
import {
  alignmentShown,
  contentPositionFromState,
  isDefaultContentPosition,
} from "@/src/banner/contentPosition";
import { THEME_PRESETS } from "@/src/types/theme";
import { MAX_REPOS } from "@/src/lib/repoSelection";
import { fieldLabel, groupFields, STYLE_GROUP } from "@/src/studio/settingGroups";
import { UsernameField } from "@/src/studio/UsernameField";
import controls from "@/src/studio/controls.module.css";
import landingStyles from "@/src/landing/landing.module.css";
import { useTheme } from "@/src/theme/ThemeProvider";
import { bannerUiChrome, type Theme } from "@/src/theme/theme";
import { contributionYear } from "@/src/studio/githubUrls";
import { useDebouncedCallback } from "@/src/ui/useDebouncedCallback";

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
  const debounced = useDebouncedCallback(onChange, INPUT_DEBOUNCE_MS);

  if (externalValue !== prevExternalValue) {
    setPrevExternalValue(externalValue);
    setLocalValue(externalValue);
  }

  return (
    <input
      id={id}
      type="text"
      className="field-input"
      maxLength={maxLength}
      value={localValue}
      onChange={(e) => {
        setLocalValue(e.target.value);
        debounced.schedule(e.target.value);
      }}
      // Leaving the field saves a pending value now instead of after the debounce.
      onBlur={debounced.flush}
    />
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
  return (
    <LabeledGroup label={label}>
      <div className="grid grid-cols-2 gap-2">
        {THEME_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange(preset.id)}
            aria-pressed={value === preset.id}
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

/**
 * The platform the banner is for, grouped by the format they share: every platform in a group gets
 * the same image.
 */
function PlatformPicker({
  label,
  state,
  onChange,
}: {
  label: string;
  state: Record<string, unknown>;
  onChange: (platform: PlatformId) => void;
}) {
  const id = useId();
  const dropdown = useDropdown(id);
  const current = platformOf(state);
  return (
    <FieldWrapper label={label} htmlFor={id}>
      <DropdownRoot dropdown={dropdown} className="relative">
        <DropdownTrigger dropdown={dropdown}>
          <span className="flex min-w-0 items-center gap-2">
            <span className="text-muted">
              <PlatformIcon icon={current.id} size={14} />
            </span>
            <span className="truncate">
              {current.name} ({bannerFormatOf(state.size).label})
            </span>
          </span>
        </DropdownTrigger>
        <DropdownList dropdown={dropdown} label={label}>
          {BANNER_SIZE_KEYS.map((key) => {
            const format = BANNER_SIZES[key];
            return (
              <div key={key}>
                <DropdownGroupLabel>
                  {format.label}{" "}
                  <span className="font-normal text-muted">
                    ({format.width} × {format.height})
                  </span>
                </DropdownGroupLabel>
                {format.platforms.map((platform) => (
                  <DropdownOption
                    key={platform.id}
                    selected={platform.id === current.id}
                    onSelect={() => {
                      onChange(platform.id);
                      dropdown.close();
                    }}
                  >
                    {/* In the name, not the check's column, so the selected one keeps its icon. */}
                    <span className="flex items-center gap-2">
                      <span className="text-muted">
                        <PlatformIcon icon={platform.id} />
                      </span>
                      {platform.name}
                    </span>
                  </DropdownOption>
                ))}
              </div>
            );
          })}
        </DropdownList>
      </DropdownRoot>
    </FieldWrapper>
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

/** A sidebar section: its title with a rule below, then its settings. */
function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`settings-${title}`}>
      <h2 id={`settings-${title}`} className={controls.groupTitle}>
        {/* The landing page's heading gradient, on a span so it spans the word, not the row. */}
        <span className={landingStyles.gradientText}>{title}</span>
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/** The owner's repositories for the picker, and how loading them went. */
interface RepoCatalog {
  repos: RepoNormalized[];
  loading: boolean;
  error: string | null;
  /** When the rate limit resets, if that's why the repositories didn't load. */
  retryAt: Date | null;
  retry: () => void;
}

/** What every setting can draw on. */
interface FieldContext {
  schema: EditorFieldSchema[];
  state: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  disabledFields: ReadonlySet<string>;
  uiTheme: Theme;
  years: string[];
  repoCatalog: RepoCatalog;
  background: BannerBackground | undefined;
  onError: (message: string) => number;
  onErrorResolved: (toastId: number) => void;
}

type FieldRenderer = (field: EditorFieldSchema, ctx: FieldContext) => ReactNode;

/** The setting's label, value as text, and a change handler: what most controls take. */
function textProps(field: EditorFieldSchema, { state, onChange }: FieldContext) {
  return {
    label: fieldLabel(field),
    value: String(state[field.key] ?? ""),
    onChange: (value: string) => onChange(field.key, value),
  };
}

/** Settings drawn by their key, before their type: they need more than their schema says. */
const BY_KEY: Partial<Record<string, FieldRenderer>> = {
  themeId: (field, ctx) => <ThemePicker {...textProps(field, ctx)} />,
  year: (field, ctx) => (
    <Select
      {...textProps(field, ctx)}
      value={contributionYear(ctx.state.year)}
      options={[
        { value: "latest", label: "Last 365 days" },
        ...ctx.years.map((year) => ({ value: year, label: year })),
      ]}
    />
  ),
  font: (field, ctx) => <FontSelect {...textProps(field, ctx)} state={ctx.state} />,
  fontStyle: (field, ctx) => <FontStyleSelect {...textProps(field, ctx)} state={ctx.state} />,
  quoteMarks: (field, ctx) => <QuoteMarksSelect {...textProps(field, ctx)} state={ctx.state} />,
  authorPrefix: (field, ctx) => <AuthorPrefixSelect {...textProps(field, ctx)} state={ctx.state} />,
  // Off the three spots, Alignment shows Custom.
  alignment: (field, ctx) => {
    const disabled = ctx.disabledFields.has(field.key);
    return (
      <Select
        {...textProps(field, ctx)}
        value={alignmentShown(contentPositionFromState(ctx.state)) ?? ""}
        options={field.options ?? []}
        disabled={disabled}
        placeholder="Custom"
        labelAction={
          // Only once the content has been moved in the preview.
          disabled || isDefaultContentPosition(ctx.state) ? null : (
            <ResetButton
              label="Reset content position"
              onClick={() => ctx.onChange("contentPosition", undefined)}
            />
          )
        }
      />
    );
  },
};

const BY_TYPE: Record<EditorFieldType, FieldRenderer> = {
  text: (field, ctx) => (
    <FieldWrapper label={fieldLabel(field)} htmlFor={field.key}>
      <DebouncedInput id={field.key} maxLength={field.maxLength} {...textProps(field, ctx)} />
    </FieldWrapper>
  ),
  textarea: (field, ctx) => (
    <FieldWrapper label={fieldLabel(field)} htmlFor={field.key}>
      <textarea
        id={field.key}
        maxLength={field.maxLength}
        rows={4}
        className="field-input resize-y"
        value={String(ctx.state[field.key] ?? "")}
        onChange={(e) => ctx.onChange(field.key, e.target.value)}
      />
    </FieldWrapper>
  ),
  // Gathered into one Show list at the end of their group.
  toggle: () => null,
  select: (field, ctx) => (
    <Select
      {...textProps(field, ctx)}
      options={field.options ?? []}
      disabled={ctx.disabledFields.has(field.key)}
    />
  ),
  range: (field, ctx) => {
    const value = Number(ctx.state[field.key] ?? field.min ?? 1);
    return (
      <FieldWrapper label={`${fieldLabel(field)}: ${value}`} htmlFor={field.key}>
        <input
          id={field.key}
          type="range"
          min={field.min}
          max={field.max}
          step={field.step}
          value={value}
          onChange={(e) => ctx.onChange(field.key, Number(e.target.value))}
          className="w-full accent-accent"
        />
      </FieldWrapper>
    );
  },
  colorPicker: (field, ctx) => (
    <ColorSelect
      label={fieldLabel(field)}
      value={ctx.state[field.key]}
      options={field.options ?? []}
      onChange={(value) => ctx.onChange(field.key, value)}
      disabled={ctx.disabledFields.has(field.key)}
      uiTheme={ctx.uiTheme}
      // The author is muted by default.
      defaultColor={field.key === "authorColor" ? bannerUiChrome(ctx.uiTheme).textMuted : undefined}
    />
  ),
  sizeSelect: (field, ctx) => (
    <PlatformPicker
      label={fieldLabel(field)}
      state={ctx.state}
      onChange={(platform) => ctx.onChange("platform", platform)}
    />
  ),
  logoPicker: (field, ctx) => (
    <LogoField
      field={field}
      sizeField={ctx.schema.find((f) => f.key === "logoSize")}
      state={ctx.state}
      onChange={ctx.onChange}
      onError={ctx.onError}
      onErrorResolved={ctx.onErrorResolved}
    />
  ),
  backgroundPicker: (field, ctx) => (
    <BackgroundField
      field={field}
      background={ctx.background}
      state={ctx.state}
      onChange={ctx.onChange}
      onError={ctx.onError}
      onErrorResolved={ctx.onErrorResolved}
    />
  ),
  repoMultiSelect: (_field, { repoCatalog, state, onChange }) => (
    <RepoMultiSelect
      catalog={repoCatalog.repos}
      loading={repoCatalog.loading}
      error={repoCatalog.error}
      retryAt={repoCatalog.retryAt}
      onRetry={repoCatalog.retry}
      valueCsv={String(state.selectedRepos ?? "")}
      maxPick={MAX_REPOS}
      onChange={(csv) => onChange("selectedRepos", csv)}
    />
  ),
};

/** Settings that don't show on their own: inside another setting, or not in this mode. */
function isHidden(field: EditorFieldSchema, state: Record<string, unknown>): boolean {
  // Inside the logo's picker, once there's a logo.
  if (field.key === "logoSize") return true;
  // Selected mode shows the repository picker instead of the amount slider.
  if (field.key === "maxRepos") return state.mode === "selected";
  if (field.type === "repoMultiSelect") return state.mode !== "selected";
  return false;
}

export function ControlSidebar({
  profile,
  schema,
  state,
  accountCreatedYear,
  onChange,
  repoCatalog,
  disabledFields,
  adjustableBackground,
  onError,
  onErrorResolved,
}: {
  schema: EditorFieldSchema[];
  state: Record<string, unknown>;
  accountCreatedYear: number | null;
  onChange: (key: string, value: unknown) => void;
  repoCatalog: RepoCatalog;
  /** Keys of fields that are unavailable right now; they're disabled and toggles show off. */
  disabledFields: ReadonlySet<string>;
  /** The background that can be moved and zoomed; none when there's none, or it can't be used. */
  adjustableBackground: BannerBackground | undefined;
  /** Shows a one-off error as a toast (e.g. a rejected upload); returns the toast's id. */
  onError: (message: string) => number;
  /** Hides the toast with this id, if it's still showing. */
  onErrorResolved: (toastId: number) => void;
  /** For templates that need a username: the Profile section, first. */
  profile?: { username: string; onChangeUsername: () => void };
}) {
  const { theme: uiTheme } = useTheme();
  const startYear = accountCreatedYear ?? currentYear - 9;
  const ctx: FieldContext = {
    schema,
    state,
    onChange,
    disabledFields,
    uiTheme,
    years: Array.from({ length: currentYear - startYear + 1 }, (_, i) => String(currentYear - i)),
    repoCatalog,
    background: adjustableBackground,
    onError,
    onErrorResolved,
  };

  const renderField = (field: EditorFieldSchema) => {
    if (isHidden(field, state)) return null;
    const render = BY_KEY[field.key] ?? BY_TYPE[field.type];
    return <Fragment key={field.key}>{render(field, ctx)}</Fragment>;
  };

  return (
    <div className="space-y-8">
      {profile && (
        <SettingsSection title="Profile">
          <UsernameField {...profile} />
        </SettingsSection>
      )}
      {groupFields(schema).map((group) => {
        const toggles = group.fields.filter((field) => field.type === "toggle");
        return (
          <SettingsSection key={group.title} title={group.title}>
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
          </SettingsSection>
        );
      })}
    </div>
  );
}
