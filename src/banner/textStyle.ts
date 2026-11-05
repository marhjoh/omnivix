import type { CSSProperties } from "react";

/** One line, cut off with "…" when it doesn't fit. */
export const ELLIPSIS = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const satisfies CSSProperties;

/** At most `lines` lines; the last is cut off with "…". */
export function lineClamp(lines: number) {
  return {
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical",
  } as const satisfies CSSProperties;
}
