"use client";

import { useId, useState, useEffect, useRef } from "react";
import { Moon, RotateCcw, Sun } from "lucide-react";
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
import { FieldLabel, LabeledGroup } from "@/src/ui/FieldLabel";
import { EditorFieldSchema } from "@/src/types/template";
import { ImagePicker } from "@/src/studio/ImagePicker";
import { ColorSelect } from "@/src/studio/ColorSelect";
import { QuoteMarksPreview } from "@/src/studio/QuoteMarksPreview";
import {
  fontFamily,
  fontStyleCss,
  fontStyleOptions,
  fontStyleShown,
  QUOTE_FONT_OPTIONS,
  QUOTE_MARKS_OPTIONS,
  AUTHOR_PREFIX_OPTIONS,
} from "@/src/banner/quoteStyle";
import { BACKGROUND_PRESETS } from "@/src/backgrounds/presets";
import { BACKGROUND_UPLOAD, LOGO_UPLOAD } from "@/src/lib/imageUpload";
import { DEFAULT_LOGO_SIZE, isDefaultLogoPosition } from "@/src/banner/logo";
import { authorPositionFromState } from "@/src/banner/authorPosition";
import { BackgroundZoomControl } from "@/src/studio/BackgroundZoomControl";
import { isDefaultBackgroundFraming, type BannerBackground } from "@/src/banner/background";
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

/** A setting's Reset, at the end of its label row, for what was changed in the preview. */
function ResetButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => {
        // The button goes once the setting is reset: focus the setting, not the page start.
        const setting = event.currentTarget.parentElement?.querySelector("label")?.control;
        onClick();
        setting?.focus();
      }}
      className={controls.reset}
    >
      <RotateCcw className="h-3 w-3" aria-hidden />
      Reset
    </button>
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
    <div className="space-y-1.5">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
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

export function ControlSidebar({
  profile,
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
  /** For templates that need a username: the Profile section, first. */
  profile?: { username: string; onChangeUsername: () => void };
}) {
  const mode = state.mode as string | undefined;
  const { theme: uiTheme } = useTheme();

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
        <PlatformPicker
          key={field.key}
          label={fieldLabel(field)}
          state={state}
          onChange={(platform) => onChange("platform", platform)}
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

    // Shown inside the logo's picker, once there's a logo.
    if (field.key === "logoSize") return null;

    if (field.type === "logoPicker") {
      const raw = state[field.key];
      const logo = typeof raw === "string" ? raw : undefined;
      const sizeField = schema.find((f) => f.key === "logoSize");
      return (
        <ImagePicker
          key={field.key}
          id={field.key}
          label={fieldLabel(field)}
          menuLabel="Logo options"
          policy={LOGO_UPLOAD}
          value={logo}
          onChange={(next) => onChange(field.key, next)}
          onError={onError}
          onErrorResolved={onErrorResolved}
          labelAction={
            // Only once the logo has been moved in the preview.
            logo && !isDefaultLogoPosition(state) ? (
              <ResetButton
                label="Reset logo position"
                onClick={() => onChange("logoPosition", undefined)}
              />
            ) : null
          }
        >
          {logo && sizeField ? (
            <Select
              label={fieldLabel(sizeField)}
              value={String(state.logoSize ?? DEFAULT_LOGO_SIZE)}
              options={sizeField.options ?? []}
              onChange={(value) => onChange("logoSize", value)}
            />
          ) : null}
        </ImagePicker>
      );
    }

    // Each font in its own typeface.
    if (field.key === "font") {
      return (
        <Select
          key={field.key}
          label={fieldLabel(field)}
          value={String(state[field.key] ?? "")}
          options={QUOTE_FONT_OPTIONS.map((option) => ({
            ...option,
            style: { fontFamily: fontFamily(option.value) },
          }))}
          onChange={(value) => onChange(field.key, value)}
        />
      );
    }

    // Only the styles the font has (some have no italics), each in its own weight and slant.
    if (field.key === "fontStyle") {
      return (
        <Select
          key={field.key}
          label={fieldLabel(field)}
          value={fontStyleShown(state.font, state.fontStyle)}
          options={fontStyleOptions(state.font).map((option) => ({
            ...option,
            style: fontStyleCss(state.font, option.value),
          }))}
          onChange={(value) => onChange(field.key, value)}
        />
      );
    }

    // Each style shown on a sample in the quote's font.
    if (field.key === "quoteMarks") {
      const sample = fontStyleCss(state.font, fontStyleShown(state.font, state.fontStyle));
      return (
        <Select
          key={field.key}
          label={fieldLabel(field)}
          value={String(state[field.key] ?? "")}
          options={QUOTE_MARKS_OPTIONS.map((option) => ({
            ...option,
            preview: <QuoteMarksPreview marks={option.value} style={sample} />,
          }))}
          onChange={(value) => onChange(field.key, value)}
        />
      );
    }

    // Each prefix by its symbol.
    if (field.key === "authorPrefix") {
      return (
        <Select
          key={field.key}
          label={fieldLabel(field)}
          value={String(state[field.key] ?? "")}
          options={AUTHOR_PREFIX_OPTIONS.map(({ symbol, ...option }) => ({
            ...option,
            preview: <span className="text-base leading-none">{symbol}</span>,
          }))}
          onChange={(value) => onChange(field.key, value)}
        />
      );
    }

    if (field.type === "colorPicker") {
      return (
        <ColorSelect
          key={field.key}
          label={fieldLabel(field)}
          value={state[field.key]}
          options={field.options ?? []}
          onChange={(value) => onChange(field.key, value)}
          disabled={disabledFields.has(field.key)}
          uiTheme={uiTheme}
          // The author is muted by default.
          defaultColor={field.key === "authorColor" ? bannerUiChrome(uiTheme).textMuted : undefined}
        />
      );
    }

    // Like Alignment: Custom once the author is dragged from under the quote.
    if (field.type === "authorPosition") {
      return (
        <Select
          key={field.key}
          label={fieldLabel(field)}
          value={authorPositionFromState(state) ? "" : "under"}
          options={[{ label: "Under the quote", value: "under" }]}
          onChange={() => onChange(field.key, undefined)}
          placeholder="Custom"
        />
      );
    }

    // Off the three spots, Alignment shows Custom.
    if (field.key === "alignment") {
      const disabled = disabledFields.has(field.key);
      const at = alignmentShown(contentPositionFromState(state));
      return (
        <Select
          key={field.key}
          label={fieldLabel(field)}
          value={at ?? ""}
          options={field.options ?? []}
          onChange={(value) => onChange(field.key, value)}
          disabled={disabled}
          placeholder="Custom"
          labelAction={
            // Only once the content has been moved in the preview.
            disabled || isDefaultContentPosition(state) ? null : (
              <ResetButton
                label="Reset content position"
                onClick={() => onChange("contentPosition", undefined)}
              />
            )
          }
        />
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
        <ImagePicker
          key={field.key}
          id={field.key}
          label={fieldLabel(field)}
          menuLabel="Background options"
          presets={BACKGROUND_PRESETS}
          policy={BACKGROUND_UPLOAD}
          value={typeof state[field.key] === "string" ? (state[field.key] as string) : undefined}
          onChange={(next) => onChange(field.key, next)}
          onError={onError}
          onErrorResolved={onErrorResolved}
          labelAction={
            // Only once the image has been moved or zoomed in the preview.
            background && !isDefaultBackgroundFraming(background) ? (
              <ResetButton
                label="Reset position and zoom"
                onClick={() => {
                  onChange("backgroundPosition", undefined);
                  onChange("backgroundZoom", undefined);
                }}
              />
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
        </ImagePicker>
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
