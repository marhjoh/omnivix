"use client";

import { useId, type CSSProperties } from "react";
import { Check } from "lucide-react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { colorValue, isCustomColor } from "@/src/banner/quoteStyle";
import { bannerUiChrome, type Theme } from "@/src/theme/theme";
import { FieldButton, OptionLabel } from "@/src/ui/Dropdown";
import { FieldWrapper } from "@/src/ui/FieldLabel";
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

/** Expands "#f60" to "#ff6600", because colors are stored as six-digit hex. */
function sixDigits(hex: string): string {
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex);
  return short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : hex;
}

/**
 * A color setting. The field opens a panel with swatches, shown in the shades this banner uses, and
 * a custom color picker. Picking a named color closes the panel.
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
  /** The color shown for Default. Usually the banner's text color. */
  defaultColor?: string;
}) {
  const triggerId = useId();
  const panelId = useId();
  const { open, setOpen, close, rootRef, toggleRef, onBlur } = useDisclosure();
  const custom = isCustomColor(value) ? value : undefined;
  const named = options.find((option) => option.value === value);
  const shown = custom ?? colorValue(named?.value, uiTheme) ?? defaultColor;

  return (
    <FieldWrapper label={label} htmlFor={triggerId}>
      <div ref={rootRef} onBlur={onBlur} className="relative">
        <FieldButton
          ref={toggleRef}
          id={triggerId}
          open={open && !disabled}
          aria-controls={open ? panelId : undefined}
          disabled={disabled}
          onClick={() => setOpen(!open)}
        >
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
        </FieldButton>
        {open && !disabled ? (
          <div
            id={panelId}
            role="group"
            aria-label={`${label} options`}
            className={`popover popover-attached ${controls.colorPanel}`}
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
                      close();
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
    </FieldWrapper>
  );
}
