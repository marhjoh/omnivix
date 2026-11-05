import { templateRegistry } from "@/src/templates/registry";
import type { TemplateId } from "@/src/templates/types";
import { IMAGE_SETTINGS, isSavableImage, POSITION_KEYS } from "@/src/studio/savedSettings";
import { isPosition } from "@/src/banner/position";
import {
  EXPORT_FORMAT_DETAILS,
  IMAGE_URL_PIXEL_RATIO,
  type ExportFormat,
  type ExportPixelRatio,
} from "@/src/export/format";
import { DEFAULT_THEME, type Theme } from "@/src/theme/theme";

/**
 * Builds the query of a studio link or image URL for banner `state`. `parseLinkSettings` reads it.
 * Only values that differ from the template defaults go in, to keep it short. Returns null when an
 * image is an upload, because uploads can't go in a link.
 */
export function linkQuery(
  templateId: TemplateId,
  state: Record<string, unknown>,
): URLSearchParams | null {
  const { schema, initialState, meta } = templateRegistry[templateId];
  const keys = [
    ...(meta.needsUsername ? ["username"] : []),
    ...schema.map((field) => field.key),
    ...POSITION_KEYS,
    "backgroundZoom",
  ];
  const query = new URLSearchParams();
  for (const key of keys) {
    const value = state[key];
    if (value === undefined || value === "" || value === initialState[key]) continue;
    if (key in IMAGE_SETTINGS && !isSavableImage(key, value)) return null;
    query.set(key, isPosition(value) ? `${value.x},${value.y}` : String(value));
  }
  return query;
}

/**
 * The banner's image URL, e.g. `https://…/banner/github-banner.png?username=octocat`. Leaves out
 * the pixel ratio and theme when they're the route's defaults.
 */
export function bannerImageUrl(
  origin: string,
  templateId: TemplateId,
  query: URLSearchParams,
  {
    format,
    pixelRatio,
    uiTheme,
  }: { format: ExportFormat; pixelRatio: ExportPixelRatio; uiTheme: Theme },
): string {
  const params = new URLSearchParams(query);
  if (pixelRatio < IMAGE_URL_PIXEL_RATIO) params.set("pixelRatio", String(pixelRatio));
  if (uiTheme !== DEFAULT_THEME) params.set("uiTheme", uiTheme);
  const path = `/banner/${templateId}.${EXPORT_FORMAT_DETAILS[format].extension}`;
  // Keep `,` `/` `:` unescaped so positions and image links stay readable.
  const search = params.toString().replace(/%2C|%2F|%3A/g, decodeURIComponent);
  return `${origin}${path}${search ? `?${search}` : ""}`;
}
