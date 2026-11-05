import { BACKGROUND_PRESETS } from "@/src/backgrounds/presets";
import { GRID_COLOR_PRESETS } from "@/src/banner/gridColors";
import type { TimedLimit } from "@/src/lib/apiError";
import { BANNER_SIZE_KEYS, BANNER_SIZES, platformNames } from "@/src/lib/sizes";
import { isOneOf } from "@/src/lib/isOneOf";
import { isTemplateId, templateRegistry } from "@/src/templates/registry";
import { SERIES } from "@/src/stats/statFields";

const LIMIT_LABELS: Record<string, string> = {
  "daily-exports": "Daily exports, per IP",
  "banner-images": "Image URLs, per banner",
  requests: "GitHub routes, per IP",
  github: "GitHub's own limit",
} satisfies Record<TimedLimit, string>;

const SOURCE_LABELS: Record<string, string> = {
  download: "Download or copy",
  "image-url": "Image URL",
};

const COUNTRY_NAMES = new Intl.DisplayNames(["en-US"], { type: "region" });

function capitalized(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const LABELS: Record<string, (value: string) => string> = {
  [SERIES.page]: (value) => {
    const templateId = value.replace("/studio/", "");
    if (value === "/") return "Landing page";
    return isTemplateId(templateId) ? `${templateRegistry[templateId].meta.title} studio` : value;
  },
  [SERIES.referrer]: (value) => (value === "direct" ? "Direct or unknown" : value),
  [SERIES.country]: (value) => COUNTRY_NAMES.of(value) ?? value,
  [SERIES.device]: capitalized,
  [SERIES.source]: (value) => SOURCE_LABELS[value] ?? value,
  [SERIES.template]: (value) => (isTemplateId(value) ? templateRegistry[value].meta.title : value),
  [SERIES.size]: (value) =>
    isOneOf(BANNER_SIZE_KEYS, value)
      ? `${platformNames(BANNER_SIZES[value])} (${BANNER_SIZES[value].label})`
      : value,
  [SERIES.format]: (value) => value.toUpperCase(),
  [SERIES.uiTheme]: capitalized,
  [SERIES.gridColors]: (value) =>
    GRID_COLOR_PRESETS.find((preset) => preset.id === value)?.label ?? value,
  [SERIES.background]: (value) =>
    ({ none: "None", upload: "Upload", link: "Link", other: "Other" })[value] ??
    BACKGROUND_PRESETS.find((preset) => preset.id === value)?.label ??
    value,
  [SERIES.limits]: (value) => LIMIT_LABELS[value] ?? value,
};

/** How a counter's value reads on the dashboard, like "Norway" for `NO`. */
export function valueLabel(series: string, value: string): string {
  if (value === "unknown") return "Unknown";
  return LABELS[series]?.(value) ?? value;
}
