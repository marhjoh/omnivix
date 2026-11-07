import { templateRegistry } from "@/src/templates/registry";
import type { BannerSettings, TemplateId } from "@/src/templates/types";
import { IMAGE_SETTINGS, isSavableImage, POSITION_KEYS } from "@/src/studio/savedSettings";
import { isPosition } from "@/src/banner/position";
import {
  EXPORT_FORMAT_DETAILS,
  IMAGE_URL_PIXEL_RATIO,
  type ExportPixelRatio,
} from "@/src/export/format";
import { DOWNLOAD_FORMAT_DETAILS, type DownloadFormat } from "@/src/studio/downloadFormat";
import { DEFAULT_THEME, type Theme } from "@/src/theme/theme";

/**
 * Builds the query of a studio link or image URL for banner `state`. `parseLinkSettings` reads it.
 * Only values that differ from the template defaults go in, to keep it short. Returns null when an
 * image is an upload, because uploads can't go in a link.
 */
export function linkQuery(templateId: TemplateId, state: BannerSettings): URLSearchParams | null {
  const { schema, initialState, meta } = templateRegistry[templateId];
  const values: Readonly<Record<string, unknown>> = state;
  const defaults: Readonly<Record<string, unknown>> = initialState;
  const keys = [
    ...(meta.needsUsername ? ["username"] : []),
    ...schema.map((field) => field.key),
    ...POSITION_KEYS,
    "backgroundZoom",
    "backgroundOpacity",
  ];
  const query = new URLSearchParams();
  for (const key of keys) {
    const value = values[key];
    if (value === undefined || value === "" || value === defaults[key]) continue;
    if (key in IMAGE_SETTINGS && !isSavableImage(key, value)) return null;
    query.set(key, isPosition(value) ? `${value.x},${value.y}` : String(value));
  }
  return query;
}

/**
 * The banner's image URL, e.g. `https://…/banner/github-banner.png?username=octocat`. Leaves out
 * the pixel ratio, theme and transparency when they're the route's defaults.
 */
export function bannerImageUrl(
  origin: string,
  templateId: TemplateId,
  query: URLSearchParams,
  {
    format,
    pixelRatio,
    uiTheme,
  }: { format: DownloadFormat; pixelRatio: ExportPixelRatio; uiTheme: Theme },
): string {
  const { file, transparent } = DOWNLOAD_FORMAT_DETAILS[format];
  const params = new URLSearchParams(query);
  if (pixelRatio < IMAGE_URL_PIXEL_RATIO) params.set("pixelRatio", String(pixelRatio));
  if (uiTheme !== DEFAULT_THEME) params.set("uiTheme", uiTheme);
  if (transparent) params.set("transparent", "true");
  const path = `/banner/${templateId}.${EXPORT_FORMAT_DETAILS[file].extension}`;
  // Keep `,` `/` `:` unescaped so positions and image links stay readable.
  const search = params.toString().replace(/%2C|%2F|%3A/g, decodeURIComponent);
  return `${origin}${path}${search ? `?${search}` : ""}`;
}
