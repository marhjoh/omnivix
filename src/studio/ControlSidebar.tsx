"use client";

import { Fragment, type ReactNode } from "react";
import { Select } from "@/src/ui/Dropdown";
import { FieldWrapper } from "@/src/ui/FieldLabel";
import { RangeField } from "@/src/ui/RangeField";
import type {
  BannerSettings,
  EditorFieldSchema,
  EditorFieldType,
  StudioSettings,
} from "@/src/templates/types";
import { RepoMultiSelect, type RepoCatalog } from "@/src/studio/RepoMultiSelect";
import { ColorSelect } from "@/src/studio/ColorSelect";
import { IconPicker } from "@/src/studio/IconPicker";
import { UsageField } from "@/src/studio/UsageField";
import { FeedField } from "@/src/studio/FeedField";
import { CertificationList } from "@/src/studio/CertificationList";
import {
  AuthorPrefixSelect,
  FontSelect,
  FontStyleSelect,
  QuoteMarksSelect,
} from "@/src/studio/QuoteFields";
import { BackgroundField, LogoField, PhotoField } from "@/src/studio/ImageFields";
import { ResetButton } from "@/src/studio/ResetButton";
import {
  AppearancePicker,
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
import { fieldValue } from "@/src/studio/fieldValue";
import { fieldLabel, groupFields, STYLE_GROUP } from "@/src/studio/settingGroups";
import { UsernameField } from "@/src/studio/UsernameField";
import { useTheme } from "@/src/theme/ThemeProvider";
import { bannerUiChrome, type Theme } from "@/src/theme/theme";
import { currentYear, LATEST_YEAR } from "@/src/lib/contributionYear";
import { decodeAiUsage } from "@/src/banner/aiUsage";

interface FieldContext {
  schema: EditorFieldSchema[];
  state: StudioSettings;
  onChange: (key: string, value: unknown) => void;
  disabledFields: ReadonlySet<string>;
  uiTheme: Theme;
  years: string[];
  repoCatalog: RepoCatalog;
  background: BannerBackground | undefined;
  onError: (message: string) => number;
  onErrorResolved: (toastId: number) => void;
  onOpenUsage: () => void;
  onOpenFeed: () => void;
}

type FieldOfType<T extends EditorFieldType> = Extract<EditorFieldSchema, { type: T }>;

type FieldRenderer<T extends EditorFieldType> = (
  field: FieldOfType<T>,
  ctx: FieldContext,
) => ReactNode;

/** The label, value and change handler that select controls take. */
function textProps(field: FieldOfType<"select">, { state, onChange }: FieldContext) {
  return {
    label: fieldLabel(field),
    value: fieldValue(state, field),
    onChange: (value: string) => onChange(field.key, value),
  };
}

/** Selects that need more than their schema gives, so they're rendered by key, not type. */
const BY_KEY: Partial<Record<string, FieldRenderer<"select">>> = {
  themeId: (field, ctx) => <GridColorsPicker {...textProps(field, ctx)} />,
  year: (field, ctx) => (
    <Select
      {...textProps(field, ctx)}
      options={[
        { value: LATEST_YEAR, label: "Last 365 days" },
        ...ctx.years.map((year) => ({ value: year, label: year })),
      ]}
    />
  ),
  font: (field, ctx) => <FontSelect {...textProps(field, ctx)} />,
  // The quote banner's typography is shown in its font.
  fontStyle: (field, ctx) =>
    "font" in ctx.state && <FontStyleSelect {...textProps(field, ctx)} state={ctx.state} />,
  quoteMarks: (field, ctx) =>
    "font" in ctx.state && <QuoteMarksSelect {...textProps(field, ctx)} state={ctx.state} />,
  authorPrefix: (field, ctx) =>
    "font" in ctx.state && <AuthorPrefixSelect {...textProps(field, ctx)} state={ctx.state} />,
  // Alignment shows Custom when the content isn't on one of the three spots.
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

const BY_TYPE: { [T in EditorFieldType]: FieldRenderer<T> } = {
  text: (field, ctx) => (
    <FieldWrapper label={fieldLabel(field)} htmlFor={field.key}>
      <input
        id={field.key}
        type="text"
        className="field-input"
        maxLength={field.maxLength}
        value={fieldValue(ctx.state, field)}
        onChange={(e) => ctx.onChange(field.key, field.format?.(e.target.value) ?? e.target.value)}
      />
    </FieldWrapper>
  ),
  textarea: (field, ctx) => (
    <FieldWrapper label={fieldLabel(field)} htmlFor={field.key}>
      <textarea
        id={field.key}
        maxLength={field.maxLength}
        rows={4}
        className="field-input resize-y"
        value={fieldValue(ctx.state, field)}
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
    const value = fieldValue(ctx.state, field);
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
      value={fieldValue(ctx.state, field)}
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
  photoPicker: (field, ctx) => (
    <PhotoField
      field={field}
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
  repoMultiSelect: (field, { repoCatalog, state, onChange }) => (
    <RepoMultiSelect
      catalog={repoCatalog}
      valueCsv={fieldValue(state, field)}
      onChange={(csv) => onChange("selectedRepos", csv)}
    />
  ),
  iconPicker: (field, { state, onChange }) => (
    <IconPicker
      id={field.key}
      label={fieldLabel(field)}
      value={fieldValue(state, field)}
      onChange={(value) => onChange(field.key, value)}
    />
  ),
  certificationList: (field, { state, onChange }) => (
    <CertificationList
      id={field.key}
      label={fieldLabel(field)}
      value={fieldValue(state, field)}
      onChange={(value) => onChange(field.key, value)}
    />
  ),
  feedLink: (field, { state, onOpenFeed }) => (
    <FeedField label={fieldLabel(field)} value={fieldValue(state, field)} onOpen={onOpenFeed} />
  ),
  usagePaste: (field, { state, onOpenUsage }) => (
    <UsageField label={fieldLabel(field)} value={fieldValue(state, field)} onOpen={onOpenUsage} />
  ),
};

function renderControl(field: EditorFieldSchema, ctx: FieldContext): ReactNode {
  if (field.type === "select") {
    const byKey = BY_KEY[field.key];
    if (byKey) return byKey(field, ctx);
  }
  return renderByType(field.type, field, ctx);
}

/** Takes the type on its own, so TypeScript can pair BY_TYPE's renderer with the field. */
function renderByType<T extends EditorFieldType>(
  type: T,
  field: FieldOfType<T>,
  ctx: FieldContext,
) {
  return BY_TYPE[type](field, ctx);
}

/** Settings shown inside another setting, or that don't apply in the current mode. */
function isHidden(field: EditorFieldSchema, state: BannerSettings): boolean {
  // Shown inside the logo's picker once there's a logo.
  if (field.key === "logoSize") return true;
  // Selected mode shows the repository picker instead of the amount slider.
  const selectedMode = "mode" in state && state.mode === "selected";
  if (field.key === "maxRepos") return selectedMode;
  if (field.type === "repoMultiSelect") return !selectedMode;
  // Only once there's text to put something behind.
  if (field.key === "showContributions") return "gridText" in state && !state.gridText;
  // Output made with `ccusage --no-cost` has no cost to show.
  if (field.key === "showCost") return "usage" in state && decodeAiUsage(state.usage)?.cost == null;
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
  onOpenUsage,
  onOpenFeed,
}: {
  schema: EditorFieldSchema[];
  state: StudioSettings;
  accountCreatedYear: number | null;
  onChange: (key: string, value: unknown) => void;
  repoCatalog: RepoCatalog;
  /** Fields that can't be used right now. They're disabled, and toggles show as off. */
  disabledFields: ReadonlySet<string>;
  /** The background to move and zoom. Undefined when there's none or it can't be used. */
  adjustableBackground: BannerBackground | undefined;
  /** Shows an error toast, e.g. for a rejected upload, and returns its id. */
  onError: (message: string) => number;
  /** Hides the toast with this id, if it's still showing. */
  onErrorResolved: (toastId: number) => void;
  /** Opens the AI usage dialog. */
  onOpenUsage: () => void;
  /** Opens the feed dialog. */
  onOpenFeed: () => void;
  /** The Profile section at the top, for templates that need a username. */
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
    onOpenUsage,
    onOpenFeed,
  };

  const renderField = (field: EditorFieldSchema) => {
    if (isHidden(field, state)) return null;
    return <Fragment key={field.key}>{renderControl(field, ctx)}</Fragment>;
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
            {/* Toggles go last, in one Show list. */}
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
