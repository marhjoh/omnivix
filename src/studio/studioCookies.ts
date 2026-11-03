/** The studio's cookies (see src/lib/cookies.ts). Values come from the browser, so they're checked. */

import { isGithubUsername } from "@/src/lib/githubUsername";
import { setCookieClient } from "@/src/lib/cookies";
import { BANNER_VIEWS, type BannerView } from "@/src/lib/sizes";
import { oneOfOr } from "@/src/lib/isOneOf";
import {
  EXPORT_PIXEL_RATIO,
  EXPORT_PIXEL_RATIOS,
  type ExportPixelRatio,
  EXPORT_FORMAT,
  EXPORT_FORMATS,
  type ExportFormat,
} from "@/src/export/format";

export const USERNAME_COOKIE = "omnivix-username";

/** One cookie per template, holding that template's settings as JSON. */
export function settingsCookieName(templateId: string): string {
  return `omnivix-settings-${templateId}`;
}

export function parseUsernameCookie(value: string | undefined): string | null {
  if (value === undefined) return null;
  try {
    const username = decodeURIComponent(value);
    return isGithubUsername(username) ? username : null;
  } catch {
    return null;
  }
}

export function parseSettingsCookie(value: string | undefined): Record<string, unknown> | null {
  if (value === undefined) return null;
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Desktop sidebar collapse, stored in a cookie so the server renders it correctly (no slide on load). */
export const SIDEBAR_COOKIE_NAME = "omnivix-sidebar";

export function parseSidebarCollapsedCookie(value: string | undefined): boolean {
  return value === "collapsed";
}

export function setSidebarCollapsedCookieClient(collapsed: boolean): void {
  setCookieClient(SIDEBAR_COOKIE_NAME, collapsed ? "collapsed" : "expanded");
}

/** The preview's view (Phone, Desktop or TV), stored in a cookie so the server renders it. */
export const PREVIEW_VIEW_COOKIE_NAME = "omnivix-preview-view";

/** Phones by default: most viewers see that, and it's the part the content fits. */
export function parsePreviewViewCookie(value: string | undefined): BannerView {
  return oneOfOr(BANNER_VIEWS, value, "phone");
}

/** Download resolution and format, stored in cookies so the server renders the last choice. */
export const PIXEL_RATIO_COOKIE_NAME = "omnivix-pixel-ratio";
export const FORMAT_COOKIE_NAME = "omnivix-format";

export function parsePixelRatioCookie(value: string | undefined): ExportPixelRatio {
  return EXPORT_PIXEL_RATIOS.find((ratio) => String(ratio) === value) ?? EXPORT_PIXEL_RATIO;
}

export function parseFormatCookie(value: string | undefined): ExportFormat {
  return oneOfOr(EXPORT_FORMATS, value, EXPORT_FORMAT);
}
