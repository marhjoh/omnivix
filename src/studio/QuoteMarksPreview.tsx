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
 * Quote marks menu. It fits the menu's preview slot and the field's line height.
 */
export function QuoteMarksPreview({ marks, style }: { marks: QuoteMarks; style: CSSProperties }) {
  const text = textMarksOf(marks);
  return (
    <span className="relative inline-flex h-5 items-center text-xs leading-none text-text">
      {marks === "large-above" && (
        <span className="flex flex-col items-center">
          <LargeMark size={1.125} style={{ height: "0.45rem" }} />
          <span style={style}>Aa</span>
        </span>
      )}
      {marks === "large-beside" && (
        <span className="flex items-start gap-0.5">
          <LargeMark size={1.125} style={{ height: "0.7rem" }} />
          <span style={style}>Aa</span>
        </span>
      )}
      {marks === "large-behind" && (
        <>
          <LargeMark
            size={1.75}
            style={{ position: "absolute", top: "0.1rem", left: 0, opacity: 0.35 }}
          />
          <span style={style} className="relative pt-1.5 pl-2">
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
