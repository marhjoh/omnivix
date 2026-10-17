import {
  EXPORT_PIXEL_RATIO,
  EXPORT_PIXEL_RATIOS,
  type ExportPixelRatio,
} from "@/src/export/viewport";
import { EXPORT_FORMAT, EXPORT_FORMATS, type ExportFormat } from "@/src/export/format";

/** Download resolution and format, stored in cookies so the server renders the last choice. */
export const PIXEL_RATIO_COOKIE_NAME = "omnivix-pixel-ratio";
export const FORMAT_COOKIE_NAME = "omnivix-format";

export function parsePixelRatioCookie(value: string | undefined): ExportPixelRatio {
  return EXPORT_PIXEL_RATIOS.find((ratio) => String(ratio) === value) ?? EXPORT_PIXEL_RATIO;
}

export function parseFormatCookie(value: string | undefined): ExportFormat {
  return EXPORT_FORMATS.find((format) => format === value) ?? EXPORT_FORMAT;
}
