import { isOneOf } from "@/src/lib/isOneOf";

export const CONTENT_ALIGNS = ["left", "center", "right"] as const;

export type ContentAlign = (typeof CONTENT_ALIGNS)[number];

export const CONTENT_ALIGN_OPTIONS = CONTENT_ALIGNS.map((value) => ({
  label: value[0].toUpperCase() + value.slice(1),
  value,
}));

/** Centered unless the setting is a valid alignment. */
export function normalizeContentAlign(raw: unknown): ContentAlign {
  return isOneOf(CONTENT_ALIGNS, raw) ? raw : "center";
}
