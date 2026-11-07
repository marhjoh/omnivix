"use client";

import { useEffect } from "react";
import {
  AUTHOR_PREFIX_OPTIONS,
  fontFamily,
  fontStyleCss,
  fontStyleOptions,
  fontStyleShown,
  QUOTE_FONT_OPTIONS,
  QUOTE_MARKS_OPTIONS,
} from "@/src/banner/quoteStyle";
import { QuoteMarksPreview } from "@/src/studio/QuoteMarksPreview";
import type { TemplateSettings } from "@/src/templates/stateSchemas";
import { Select } from "@/src/ui/Dropdown";

// Typography settings for the quote banner. Each option is shown in its own type.

interface QuoteFieldProps {
  label: string;
  /** `state` gives the settings the options are shown in, such as the font. */
  value: string;
  state: TemplateSettings["quote-banner"];
  onChange: (value: string) => void;
}

/**
 * The quote font picker, with each option in its own typeface. Quote fonts aren't preloaded
 * (app/fonts.ts), so the upright and italic faces load once the studio is idle. That covers both
 * Font and Font style and cuts font swaps when a list opens. A list opened very early can still
 * show a swap.
 */
export function FontSelect({ label, value, onChange }: Omit<QuoteFieldProps, "state">) {
  useEffect(() => {
    const load = () => {
      // document.fonts.load can't resolve var(), so look up each family's variable.
      const root = getComputedStyle(document.documentElement);
      for (const { value: font } of QUOTE_FONT_OPTIONS) {
        for (const { value: style } of fontStyleOptions(font)) {
          // A variable face covers every weight we offer, so load it once per slant.
          if (style !== "regular" && style !== "italic") continue;
          const css = fontStyleCss(font, style);
          const family = css.fontFamily.replace(/var\((--[^)]+)\)/g, (_, variable: string) =>
            root.getPropertyValue(variable),
          );
          document.fonts.load(`${css.fontStyle} ${css.fontWeight} 1em ${family}`).catch(() => {});
        }
      }
    };
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(load);
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(load);
    return () => clearTimeout(id);
  }, []);
  return (
    <Select
      label={label}
      value={value}
      options={QUOTE_FONT_OPTIONS.map((option) => ({
        ...option,
        style: { fontFamily: fontFamily(option.value) },
      }))}
      onChange={onChange}
    />
  );
}

/** Only the styles the font has (some have no italics), each in its own weight and slant. */
export function FontStyleSelect({ label, state, onChange }: QuoteFieldProps) {
  return (
    <Select
      label={label}
      value={fontStyleShown(state.font, state.fontStyle)}
      options={fontStyleOptions(state.font).map((option) => ({
        ...option,
        style: fontStyleCss(state.font, option.value),
      }))}
      onChange={onChange}
    />
  );
}

/** Each style shown on a sample in the quote's font. */
export function QuoteMarksSelect({ label, value, state, onChange }: QuoteFieldProps) {
  const sample = fontStyleCss(state.font, fontStyleShown(state.font, state.fontStyle));
  return (
    <Select
      label={label}
      value={value}
      options={QUOTE_MARKS_OPTIONS.map((option) => ({
        ...option,
        preview: <QuoteMarksPreview marks={option.value} style={sample} />,
      }))}
      onChange={onChange}
    />
  );
}

/** Each prefix shown in the author's font. */
export function AuthorPrefixSelect({ label, value, state, onChange }: QuoteFieldProps) {
  const sample = fontStyleCss(state.font, "regular");
  return (
    <Select
      label={label}
      value={value}
      options={AUTHOR_PREFIX_OPTIONS.map(({ symbol, ...option }) => ({
        ...option,
        preview: (
          <span style={sample} className="text-base leading-none">
            {symbol}
          </span>
        ),
      }))}
      onChange={onChange}
    />
  );
}
