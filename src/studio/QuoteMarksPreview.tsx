import type { CSSProperties } from "react";
import { LARGE_MARK_FONT_FAMILY, textMarksOf, type QuoteMarks } from "@/src/banner/quoteStyle";

/** A large mark at `size` rem, cut to `height` rem so it sits close to the sample text. */
function LargeMark({ size, style }: { size: number; style?: CSSProperties }) {
  return (
    <span
      style={{
        fontFamily: LARGE_MARK_FONT_FAMILY,
        fontSize: `${size}rem`,
        fontWeight: 700,
        ...style,
      }}
      className="leading-none"
    >
      &ldquo;
    </span>
  );
}

/**
 * A small sample of a quote marks style around "Aa", in the quote's font (`style`), for the
 * Quote marks menu. The menu names the style, so screen readers skip the sample.
 */
export function QuoteMarksPreview({ marks, style }: { marks: QuoteMarks; style: CSSProperties }) {
  const text = textMarksOf(marks);
  return (
    <span
      aria-hidden
      className="relative -my-0.5 inline-flex h-6 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-(--control-border) bg-surface text-[0.8125rem] leading-none text-text"
    >
      {marks === "large-above" && (
        <span className="flex flex-col items-start">
          <LargeMark size={1.25} style={{ height: "0.55rem" }} />
          <span style={style}>Aa</span>
        </span>
      )}
      {marks === "large-beside" && (
        <span className="flex items-start gap-0.5">
          <LargeMark size={1.25} style={{ height: "0.8rem" }} />
          <span style={style}>Aa</span>
        </span>
      )}
      {marks === "large-behind" && (
        <>
          <LargeMark
            size={2.25}
            style={{ position: "absolute", top: "0.1rem", left: "0.5rem", opacity: 0.25 }}
          />
          <span style={style} className="relative">
            Aa
          </span>
        </>
      )}
      {marks === "bar" && (
        <span style={style} className="border-l-2 border-current pl-1.5">
          Aa
        </span>
      )}
      {(text || marks === "none") && (
        <span style={style}>
          {text?.[0]}Aa{text?.[1]}
        </span>
      )}
    </span>
  );
}
