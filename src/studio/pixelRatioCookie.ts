import {
  EXPORT_PIXEL_RATIO,
  EXPORT_PIXEL_RATIOS,
  type ExportPixelRatio,
} from "@/src/export/viewport";
import { setCookieClient } from "@/src/studio/studioCookies";

/** Download resolution, stored in a cookie so the server renders the last choice. */
export const PIXEL_RATIO_COOKIE_NAME = "omnivix-pixel-ratio";

export function parsePixelRatioCookie(value: string | undefined): ExportPixelRatio {
  return EXPORT_PIXEL_RATIOS.find((ratio) => String(ratio) === value) ?? EXPORT_PIXEL_RATIO;
}

/** Client-only: persist for the next page request. */
export function setPixelRatioCookieClient(ratio: ExportPixelRatio): void {
  setCookieClient(PIXEL_RATIO_COOKIE_NAME, String(ratio));
}
