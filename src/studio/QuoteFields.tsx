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
import { Select } from "@/src/ui/Dropdown";

// The quote banner's typography settings, each option shown in the quote's own type.

interface QuoteFieldProps {
  label: string;
  state: Record<string, unknown>;
  onChange: (value: string) => void;
}

/**
 * The quote's font, each in its own typeface. The quote fonts aren't preloaded (app/fonts.ts), so
 * their available styles start loading once the studio is idle: otherwise they'd all start when the
 * list first opens, and its options would change font one by one as they arrive.
 */
export function FontSelect({ label, state, onChange }: QuoteFieldProps) {
  useEffect(() => {
    const load = () => {
      // document.fonts.load can't read var(), so each family is read from its variable.
      const root = getComputedStyle(document.documentElement);
      for (const { value: font } of QUOTE_FONT_OPTIONS) {
        for (const { value: style } of fontStyleOptions(font)) {
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
      value={String(state.font ?? "")}
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
export function QuoteMarksSelect({ label, state, onChange }: QuoteFieldProps) {
  const sample = fontStyleCss(state.font, fontStyleShown(state.font, state.fontStyle));
  return (
    <Select
      label={label}
      value={String(state.quoteMarks ?? "")}
      options={QUOTE_MARKS_OPTIONS.map((option) => ({
        ...option,
        preview: <QuoteMarksPreview marks={option.value} style={sample} />,
      }))}
      onChange={onChange}
    />
  );
}

/** Each prefix shown in the author's font. */
export function AuthorPrefixSelect({ label, state, onChange }: QuoteFieldProps) {
  const sample = fontStyleCss(state.font, "regular");
  return (
    <Select
      label={label}
      value={String(state.authorPrefix ?? "")}
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
