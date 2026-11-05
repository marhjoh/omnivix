"use client";

import { Fragment, type ReactNode } from "react";
import { Select } from "@/src/ui/Dropdown";
import { FieldWrapper } from "@/src/ui/FieldLabel";
import { RangeField } from "@/src/ui/RangeField";
import type { RepoNormalized } from "@/src/github/types";
import type { EditorFieldSchema, EditorFieldType } from "@/src/templates/types";
import { RepoMultiSelect } from "@/src/studio/RepoMultiSelect";
import { ColorSelect } from "@/src/studio/ColorSelect";
import {
  AuthorPrefixSelect,
  FontSelect,
  FontStyleSelect,
  QuoteMarksSelect,
} from "@/src/studio/QuoteFields";
import { BackgroundField, LogoField } from "@/src/studio/ImageFields";
import { ResetButton } from "@/src/studio/ResetButton";
import {
  AppearancePicker,
  DebouncedInput,
  GridColorsPicker,
  PlatformPicker,
  SettingsSection,
  ShowList,
} from "@/src/studio/SettingControls";
import type { BannerBackground } from "@/src/banner/background";
import {
  alignmentShown,
  contentPositionFromState,
  isDefaultContentPosition,
} from "@/src/banner/contentPosition";
import { MAX_REPOS, selectedReposOf } from "@/src/lib/repoSelection";
import { fieldLabel, groupFields, STYLE_GROUP } from "@/src/studio/settingGroups";
import { UsernameField } from "@/src/studio/UsernameField";
import { useTheme } from "@/src/theme/ThemeProvider";
import { bannerUiChrome, type Theme } from "@/src/theme/theme";
import { contributionYear, currentYear, LATEST_YEAR } from "@/src/lib/contributionYear";

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
  themeId: (field, ctx) => <GridColorsPicker {...textProps(field, ctx)} />,
  year: (field, ctx) => (
    <Select
      {...textProps(field, ctx)}
      value={contributionYear(ctx.state.year)}
      options={[
        { value: LATEST_YEAR, label: "Last 365 days" },
        ...ctx.years.map((year) => ({ value: year, label: year })),
      ]}
    />
  ),
  font: (field, ctx) => <FontSelect {...textProps(field, ctx)} />,
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
      // The value is in the label, which says what it counts ("Number of repos: 4").
      <RangeField
        id={field.key}
        label={`${fieldLabel(field)}: ${value}`}
        min={field.min}
        max={field.max}
        step={field.step}
        value={value}
        onChange={(next) => ctx.onChange(field.key, next)}
      />
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
      valueCsv={selectedReposOf(state)}
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
  const thisYear = currentYear();
  const startYear = accountCreatedYear ?? thisYear - 9;
  const ctx: FieldContext = {
    schema,
    state,
    onChange,
    disabledFields,
    uiTheme,
    years: Array.from({ length: thisYear - startYear + 1 }, (_, i) => String(thisYear - i)),
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
