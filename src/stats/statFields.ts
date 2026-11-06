import type { ExportRequest } from "@/src/export/request";
import type { ExportFormat } from "@/src/export/format";
import type { TimedLimit } from "@/src/lib/apiError";
import { presetBySrc } from "@/src/backgrounds/presets";
import { isDataUrl, isHttpsUrl } from "@/src/lib/imageSource";
import { DEFAULT_THEME } from "@/src/theme/theme";

// Stats are counters in one Redis hash per UTC day. Each event adds one to a few fields, named
// `<series>` or `<series>:<value>`. Values that come from a request, like referring sites or failure
// messages, are cleaned and shortened first.

/** Download and copy use the export API. Image URLs only count renders the CDN didn't serve. */
export type ExportSource = "download" | "image-url";

export const SERIES = {
  views: "views",
  page: "views:page",
  referrer: "views:source",
  country: "views:country",
  device: "views:device",
  browser: "views:browser",
  exports: "exports",
  source: "exports:source",
  template: "exports:template",
  size: "exports:size",
  format: "exports:format",
  uiTheme: "exports:ui-theme",
  gridColors: "exports:grid-colors",
  background: "exports:background",
  duration: "exports:seconds",
  limits: "limits",
  failures: "failures",
  failureMessage: "failures:message",
} as const;

const MAX_MESSAGE_LENGTH = 120;

/**
 * Upper bounds of the export time buckets, in seconds. A render normally takes 6–14 s on Vercel and
 * stops at 45 s.
 */
export const DURATION_BUCKETS = [2, 4, 6, 8, 10, 12, 15, 20, 30, 45] as const;

function durationBucket(seconds: number): number {
  return DURATION_BUCKETS.find((bound) => seconds <= bound) ?? DURATION_BUCKETS.at(-1)!;
}

export function exportFields(
  source: ExportSource,
  {
    templateId,
    size,
    uiTheme,
    state,
    format,
    background,
  }: ExportRequest & { format: ExportFormat },
  seconds: number,
): string[] {
  const fields = [
    SERIES.exports,
    `${SERIES.duration}:${durationBucket(seconds)}`,
    `${SERIES.source}:${source}`,
    `${SERIES.template}:${templateId}`,
    `${SERIES.size}:${size}`,
    `${SERIES.format}:${background === "transparent" ? "transparent" : format}`,
    `${SERIES.uiTheme}:${uiTheme ?? DEFAULT_THEME}`,
    `${SERIES.background}:${backgroundKind(state.backgroundImage)}`,
  ];
  // Only the templates with a contribution grid have grid colors. The settings schema checks them.
  if (typeof state.themeId === "string") fields.push(`${SERIES.gridColors}:${state.themeId}`);
  return fields;
}

/** A built-in background by its id. Links and uploads are only counted, never stored. */
function backgroundKind(image: unknown): string {
  if (typeof image !== "string" || !image) return "none";
  if (isDataUrl(image)) return "upload";
  if (isHttpsUrl(image)) return "link";
  return presetBySrc(image)?.id ?? "other";
}

export function limitFields(limit: TimedLimit): string[] {
  return [SERIES.limits, `${SERIES.limits}:${limit}`];
}

export function failureFields(message: string): string[] {
  return [SERIES.failures, `${SERIES.failureMessage}:${cleanMessage(message)}`];
}

/**
 * The first line, without links. Browser errors quote the render URL, and its token holds the
 * banner's settings.
 */
function cleanMessage(message: string): string {
  const firstLine = message.split("\n").find((line) => line.trim()) ?? "";
  const cleaned = firstLine.replace(/\bhttps?:\/\/\S+/gi, "<url>").trim();
  return (cleaned || "Unknown error").slice(0, MAX_MESSAGE_LENGTH);
}

/** Each value of a series with its count, most first. */
export function breakdown(totals: Record<string, number>, series: string): [string, number][] {
  const prefix = `${series}:`;
  return Object.entries(totals)
    .filter(([field]) => field.startsWith(prefix))
    .map(([field, count]): [string, number] => [field.slice(prefix.length), count])
    .sort(([a, countA], [b, countB]) => countB - countA || a.localeCompare(b));
}
