"use client";

import { useId, type CSSProperties } from "react";
import { Check } from "lucide-react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { colorValue, isCustomColor } from "@/src/banner/quoteStyle";
import { bannerUiChrome, type Theme } from "@/src/theme/theme";
import { DropdownChevron, OptionLabel } from "@/src/ui/Dropdown";
import { FieldLabel } from "@/src/ui/FieldLabel";
import { useDisclosure } from "@/src/ui/useDisclosure";
import controls from "@/src/studio/controls.module.css";

/** A custom color's starting point, when none is picked yet. */
const CUSTOM_START = "#3b82f6";

/** A dark check on light colors (near-white, amber), a white one on the rest. */
function checkColor(color: string): string {
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
  const rgb = hex
    ? hex.slice(1).map((part) => parseInt(part, 16))
    : (/rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(color)?.slice(1).map(Number) ?? [0, 0, 0]);
  const [r, g, b] = rgb;
  return 0.299 * r + 0.587 * g + 0.114 * b > 170 ? "#1f2328" : "#ffffff";
}

function swatchStyle(color: string): CSSProperties {
  return { "--swatch": color, color: checkColor(color) } as CSSProperties;
}

/** "#f60" as "#ff6600": colors are kept as six-digit hex codes. */
function sixDigits(hex: string): string {
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex);
  return short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : hex;
}

/**
 * A color setting: a field with the color and its name, opening a panel under it with round
 * swatches, each in the shade it shows on this banner (Default is the banner's own color), and a
 * last one for any color, with a picker. The panel closes like the app's other popups
 * (useDisclosure), and when a named color is picked.
 */
export function ColorSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
  uiTheme,
  defaultColor = bannerUiChrome(uiTheme).text,
}: {
  label: string;
  value: unknown;
  options: ReadonlyArray<{ label: string; value: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** The banner's theme, for the shade each color shows in. */
  uiTheme: Theme;
  /** What Default looks like: the banner's text color unless the setting's default differs. */
  defaultColor?: string;
}) {
  const triggerId = useId();
  const panelId = useId();
  const { open, setOpen, rootRef, toggleRef, onBlur } = useDisclosure();
  const custom = isCustomColor(value) ? value : undefined;
  const named = options.find((option) => option.value === value);
  const shown = custom ?? colorValue(named?.value, uiTheme) ?? defaultColor;

  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={triggerId} id={`${triggerId}-label`}>
        {label}
      </FieldLabel>
      <div ref={rootRef} onBlur={onBlur} className="relative">
        <button
          ref={toggleRef}
          id={triggerId}
          type="button"
          aria-labelledby={`${triggerId}-label ${triggerId}-value`}
          aria-expanded={open && !disabled}
          aria-controls={open ? panelId : undefined}
          disabled={disabled}
          onClick={() => setOpen(!open)}
          className="field-select flex items-center justify-between gap-2 text-left"
        >
          <span id={`${triggerId}-value`} className="min-w-0 flex-1">
            <OptionLabel
              preview={<span className={controls.colorDot} style={swatchStyle(shown)} />}
              label={
                custom ? (
                  <>
                    Custom <span className="text-muted">{custom}</span>
                  </>
                ) : (
                  (named?.label ?? options[0]?.label)
                )
              }
            />
          </span>
          <DropdownChevron open={open} className="self-center text-muted" />
        </button>
        {open && !disabled ? (
          <div
            id={panelId}
            role="group"
            aria-label={`${label} options`}
            className={`popover absolute top-full right-0 left-0 z-50 -mt-px rounded-b-lg border-(--control-border) ${controls.colorPanel}`}
          >
            <div className={controls.swatches}>
              {options.map((option) => {
                const selected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-label={option.label}
                    aria-pressed={selected}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                      toggleRef.current?.focus();
                    }}
                    className={controls.swatch}
                    style={swatchStyle(colorValue(option.value, uiTheme) ?? defaultColor)}
                  >
                    {selected && <Check className="h-4 w-4" aria-hidden />}
                  </button>
                );
              })}
              <button
                type="button"
                aria-label="Custom color"
                aria-pressed={Boolean(custom)}
                onClick={() => onChange(custom ?? CUSTOM_START)}
                className={custom ? controls.swatch : `${controls.swatch} ${controls.swatchCustom}`}
                style={custom ? swatchStyle(custom) : undefined}
              >
                {custom && <Check className="h-4 w-4" aria-hidden />}
              </button>
            </div>
            {custom ? (
              <div className={controls.customColor}>
                <HexColorPicker color={custom} onChange={onChange} />
                <HexColorInput
                  color={custom}
                  onChange={(hex) => onChange(sixDigits(hex))}
                  prefixed
                  aria-label={`${label}, hex code`}
                  className="field-input"
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
