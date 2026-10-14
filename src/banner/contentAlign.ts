import { isOneOf } from "@/src/lib/isOneOf";

export const CONTENT_ALIGNS = ["left", "center", "right"] as const;

export type ContentAlign = (typeof CONTENT_ALIGNS)[number];

export const CONTENT_ALIGN_OPTIONS = CONTENT_ALIGNS.map((value) => ({
  label: value[0].toUpperCase() + value.slice(1),
  value,
}));

/** Flexbox alignment for each setting. */
export const FLEX_ALIGN: Record<ContentAlign, "flex-start" | "center" | "flex-end"> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

/** Centred unless the setting is a valid alignment. */
export function normalizeContentAlign(raw: unknown): ContentAlign {
  return isOneOf(CONTENT_ALIGNS, raw) ? raw : "center";
}
