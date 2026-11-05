/** The studio's cookies (see src/lib/cookies.ts). Values come from the browser, so they're checked. */

import { isGithubUsername } from "@/src/lib/githubUsername";
import { BANNER_VIEWS, type BannerView } from "@/src/lib/sizes";
import { oneOfOr } from "@/src/lib/isOneOf";
import {
  DEFAULT_PIXEL_RATIO,
  EXPORT_PIXEL_RATIOS,
  type ExportPixelRatio,
  DEFAULT_EXPORT_FORMAT,
  EXPORT_FORMATS,
  type ExportFormat,
} from "@/src/export/format";

/** A studio cookie: its name, and how its value is read (a fallback when it's missing or invalid). */
export interface StudioCookie<T> {
  name: string;
  parse: (value: string | undefined) => T;
}

/** The GitHub username, saved for every template (null: none saved yet). */
export const USERNAME_COOKIE: StudioCookie<string | null> = {
  name: "omnivix-username",
  parse: (value) => {
    if (value === undefined) return null;
    try {
      const username = decodeURIComponent(value);
      return isGithubUsername(username) ? username : null;
    } catch {
      return null;
    }
  },
};

/** One cookie per template, holding that template's settings as JSON (null: none saved yet). */
export function settingsCookie(templateId: string): StudioCookie<Record<string, unknown> | null> {
  return {
    name: `omnivix-settings-${templateId}`,
    parse: (value) => {
      if (value === undefined) return null;
      try {
        const parsed: unknown = JSON.parse(decodeURIComponent(value));
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? (parsed as Record<string, unknown>)
          : null;
      } catch {
        return null;
      }
    },
  };
}

/** Whether the desktop sidebar is collapsed, so the server renders it that way (no slide on load). */
export const SIDEBAR_COOKIE: StudioCookie<boolean> = {
  name: "omnivix-sidebar",
  parse: (value) => value === "collapsed",
};

/**
 * The preview's view (Phone, Desktop or TV), so the server renders it. Phones by default: most
 * viewers see that, and it's the part the content fits.
 */
export const PREVIEW_VIEW_COOKIE: StudioCookie<BannerView> = {
  name: "omnivix-preview-view",
  parse: (value) => oneOfOr(BANNER_VIEWS, value, "phone"),
};

/** Download resolution, so the server renders the last choice. */
export const PIXEL_RATIO_COOKIE: StudioCookie<ExportPixelRatio> = {
  name: "omnivix-pixel-ratio",
  parse: (value) =>
    EXPORT_PIXEL_RATIOS.find((ratio) => String(ratio) === value) ?? DEFAULT_PIXEL_RATIO,
};

/** Download format, so the server renders the last choice. */
export const FORMAT_COOKIE: StudioCookie<ExportFormat> = {
  name: "omnivix-format",
  parse: (value) => oneOfOr(EXPORT_FORMATS, value, DEFAULT_EXPORT_FORMAT),
};
