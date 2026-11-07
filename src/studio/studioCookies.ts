/** The studio's cookies (see src/lib/cookies.ts). Values come from the browser and are checked. */

import { isGithubUsername } from "@/src/lib/githubUsername";
import { BANNER_VIEWS, type BannerView } from "@/src/lib/sizes";
import { oneOfOr } from "@/src/lib/isOneOf";
import {
  DEFAULT_PIXEL_RATIO,
  EXPORT_PIXEL_RATIOS,
  type ExportPixelRatio,
  DEFAULT_EXPORT_FORMAT,
} from "@/src/export/format";
import { DOWNLOAD_FORMATS, type DownloadFormat } from "@/src/studio/downloadFormat";

/** `parse` returns a fallback when the value is missing or invalid. */
export interface StudioCookie<T> {
  name: string;
  parse: (value: string | undefined) => T;
}

/** The GitHub username, shared by all templates. Null when none is saved. */
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

/** One cookie per template with its settings as JSON. Null when none are saved. */
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

/** Read on the server so the collapsed desktop sidebar doesn't slide closed on load. */
export const SIDEBAR_COOKIE: StudioCookie<boolean> = {
  name: "omnivix-sidebar",
  parse: (value) => value === "collapsed",
};

/**
 * The preview's view (Phone, Desktop or TV). Defaults to Phone because most viewers see that, and
 * it's the crop the content is made to fit.
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
export const FORMAT_COOKIE: StudioCookie<DownloadFormat> = {
  name: "omnivix-format",
  parse: (value) => oneOfOr(DOWNLOAD_FORMATS, value, DEFAULT_EXPORT_FORMAT),
};
