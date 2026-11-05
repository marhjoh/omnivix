"use client";

import { useId, type ReactNode } from "react";
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
} from "@/src/ui/Dropdown";
import { useDropdown } from "@/src/ui/useDropdown";
import { PlatformIcon } from "@/src/ui/PlatformIcon";
import { FieldWrapper, LabeledGroup } from "@/src/ui/FieldLabel";
import { CheckList, CheckRow } from "@/src/studio/CheckList";
import { TileGroup } from "@/src/studio/TileGroup";
import { fieldLabel } from "@/src/studio/settingGroups";
import controls from "@/src/studio/controls.module.css";
import { GRID_COLOR_PRESETS } from "@/src/banner/gridColors";
import type { EditorFieldSchema } from "@/src/templates/types";
import { useTheme } from "@/src/theme/ThemeProvider";
import type { Theme } from "@/src/theme/theme";

// Controls that ControlSidebar uses to draw settings.

export function GridColorsPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <TileGroup
      label={label}
      columns={2}
      tileClassName={controls.colorTile}
      options={GRID_COLOR_PRESETS.map((preset) => ({ ...preset, value: preset.id }))}
      value={value}
      onChange={onChange}
    >
      {(preset) => (
        <>
          <span className={controls.colorStrip} aria-hidden>
            {preset.gridLevels.slice(1).map((color) => (
              <span key={color} style={{ backgroundColor: color }} />
            ))}
          </span>
          <span className="truncate text-left">{preset.label}</span>
        </>
      )}
    </TileGroup>
  );
}

const APPEARANCES: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

/**
 * Light or dark mode for the whole app, including the banner's text and panels. It isn't a
 * template setting. It's saved in the theme cookie and shows in every template's Style group.
 */
export function AppearancePicker() {
  const { theme, setTheme } = useTheme();
  return (
    <TileGroup
      label="Appearance"
      columns={2}
      tileClassName={controls.appearanceTile}
      options={APPEARANCES}
      value={theme}
      onChange={setTheme}
    >
      {({ label, icon: Icon }) => (
        <>
          <Icon className="h-[18px] w-[18px] text-muted" aria-hidden />
          <span>{label}</span>
        </>
      )}
    </TileGroup>
  );
}

/**
 * The platform the banner is for. Platforms are grouped by banner format, and every platform in a
 * group gets the same image.
 */
export function PlatformPicker({
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

/** Show/hide settings as one list, with a row per setting. */
export function ShowList({
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
export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`settings-${title}`}>
      <h2 id={`settings-${title}`} className={controls.groupTitle}>
        {/* The landing page's heading gradient, on a span so it covers the word, not the row. */}
        <span className="gradient-text">{title}</span>
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
