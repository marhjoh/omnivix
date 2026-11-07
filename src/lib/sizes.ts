import { oneOfOr } from "@/src/lib/isOneOf";
import type { BaseSettings } from "@/src/templates/stateSchemas";
import {
  DEFAULT_EXPORT_FORMAT,
  EXPORT_FORMATS,
  type ExportFormat,
  DEFAULT_PIXEL_RATIO,
  EXPORT_PIXEL_RATIOS,
  type ExportPixelRatio,
} from "@/src/export/format";

/**
 * Banner formats. Platforms rescale uploads, so one image fits every platform listed for a format.
 * Comments note each platform's recommended upload size.
 */

/** Also names the platform's icon. */
export type PlatformId =
  | "linkedin"
  | "x"
  | "bluesky"
  | "mastodon"
  | "kofi"
  | "buymeacoffee"
  | "twitch"
  | "patreon"
  | "discord"
  | "youtube"
  | "reddit";

interface BannerPlatform {
  id: PlatformId;
  name: string;
}

export interface Box {
  width: number;
  height: number;
}

/** A part of the banner, in banner pixels from its top left. */
export interface Rect extends Box {
  left: number;
  top: number;
}

/**
 * What a device shows of the banner. Every view of a format without `views` is the whole banner.
 */
export const BANNER_VIEWS = ["phone", "desktop", "tv"] as const;

export type BannerView = (typeof BANNER_VIEWS)[number];

export interface BannerFormat extends Box {
  label: string;
  /** Set when devices show different parts of the image. Formats without TVs have no `tv`. */
  views?: { phone: Box; desktop: Box; tv?: Box };
  /**
   * The part every device shows clearly, where the content goes. Defaults to the phone view. Set it
   * when the platform puts its own buttons or photo over part of that.
   */
  safeArea?: Rect;
  /** The largest pixel ratio per file format, for those that can't take every ratio. */
  maxPixelRatio?: Partial<Record<ExportFormat, ExportPixelRatio>>;
  /** The file formats the platform takes, when it doesn't take every one. */
  formats?: readonly ExportFormat[];
  /** Uploads must be smaller than this many bytes. The export lowers JPEG quality until it fits. */
  uploadLimit?: number;
  platforms: BannerPlatform[];
}

/** A banner's size, and which parts of it devices show. */
export type BannerBox = Box & Pick<BannerFormat, "views" | "safeArea">;

export const BANNER_SIZE_KEYS = ["wide", "header", "reddit", "card", "youtube"] as const;

export type BannerSize = (typeof BANNER_SIZE_KEYS)[number];

/** "LinkedIn, X" */
export function platformNames(format: BannerFormat): string {
  return format.platforms.map((platform) => platform.name).join(", ");
}

/** The CSS `aspect-ratio` of a box, e.g. "1584 / 396". */
export function aspectRatioOf({ width, height }: Box): string {
  return `${width} / ${height}`;
}

export const BANNER_SIZES: Record<BannerSize, BannerFormat> = {
  // LinkedIn 1584 × 396, Buy Me a Coffee 1600 × 400
  wide: {
    label: "4:1",
    width: 1584,
    height: 396,
    platforms: [
      { id: "linkedin", name: "LinkedIn" },
      { id: "buymeacoffee", name: "Buy Me a Coffee" },
    ],
  },
  // X, Bluesky and Mastodon 1500 × 500, Ko-fi 1200 × 400
  header: {
    label: "3:1",
    width: 1500,
    height: 500,
    platforms: [
      { id: "x", name: "X (Twitter)" },
      { id: "bluesky", name: "Bluesky" },
      { id: "mastodon", name: "Mastodon" },
      { id: "kofi", name: "Ko-fi" },
    ],
  },
  // Reddit keeps the whole upload and each screen crops it (3000 × 1000 test uploads, #111).
  // Desktop shows it as a 316 × 97 card in the sidebar. That's a 10:3 crop whose rows Reddit picks
  // from the content (about the middle 900), minus about 35 px on each side. The iPhone app shows
  // the middle half, x 750–2250, with its buttons down to y 381, the avatar over x 870–1164 from
  // y 437, and a fade from y 750 that's still readable to y 850. The safe area is right of the
  // avatar and between the buttons and the fade.
  reddit: {
    label: "3:1",
    width: 3000,
    height: 1000,
    views: {
      phone: { width: 1500, height: 1000 },
      desktop: { width: 2930, height: 900 },
    },
    safeArea: { left: 1190, top: 390, width: 1040, height: 460 },
    // Already twice the width the app shows.
    maxPixelRatio: { jpeg: 1 },
    // Reddit rejects 500 KB or more, which a PNG with a photo always is (3.5 MB with London).
    formats: ["jpeg"],
    uploadLimit: 500_000,
    platforms: [{ id: "reddit", name: "Reddit" }],
  },
  // Twitch 1200 × 480, Patreon 2500 × 1000, Discord 600 × 240
  card: {
    label: "5:2",
    width: 1500,
    height: 600,
    platforms: [
      { id: "twitch", name: "Twitch" },
      { id: "patreon", name: "Patreon" },
      { id: "discord", name: "Discord" },
    ],
  },
  // YouTube 2560 × 1440, at least 2048 × 1152 and 6 MB or less. Phones show the middle 1546 × 423,
  // desktop the 2560 × 423 strip it's in.
  youtube: {
    label: "16:9",
    width: 2560,
    height: 1440,
    views: {
      phone: { width: 1546, height: 423 },
      desktop: { width: 2560, height: 423 },
      tv: { width: 2560, height: 1440 },
    },
    // YouTube shows at most 1×. Above it, PNGs pass its 6 MB limit and 3× runs Chromium out of memory.
    maxPixelRatio: { png: 1, jpeg: 1 },
    platforms: [{ id: "youtube", name: "YouTube" }],
  },
};

/** Every platform with a format, in picker order. */
export const BANNER_PLATFORMS = Object.values(BANNER_SIZES).flatMap((format) => format.platforms);

/** The size every template starts at, and what an unknown size falls back to. */
export const DEFAULT_BANNER_SIZE: BannerSize = "wide";

export function normalizeBannerSize(
  raw: unknown,
  fallback: BannerSize = DEFAULT_BANNER_SIZE,
): BannerSize {
  return oneOfOr(BANNER_SIZE_KEYS, raw, fallback);
}

/** The format a platform's banners use. */
export function sizeOfPlatform(id: unknown): BannerSize | undefined {
  return BANNER_SIZE_KEYS.find((key) => BANNER_SIZES[key].platforms.some((p) => p.id === id));
}

/**
 * The platform picked in banner state. If it belongs to another format, the format's first
 * platform.
 */
export function platformOf(state: Pick<BaseSettings, "size" | "platform">): BannerPlatform {
  const { platforms } = BANNER_SIZES[state.size];
  return platforms.find((platform) => platform.id === state.platform) ?? platforms[0];
}

/** The format's views in toggle order. Empty when every device shows the whole banner. */
export function bannerViews(format: BannerBox): BannerView[] {
  return BANNER_VIEWS.filter((view) => format.views?.[view]);
}

/**
 * Falls back to the phone view when the format lacks `view`, like a TV view saved for YouTube and
 * then used on Reddit.
 */
export function shownView(format: BannerBox, view: BannerView): BannerView {
  return format.views?.[view] ? view : "phone";
}

/** The centered part of the banner that `view` shows. Without that view, it's the whole banner. */
export function viewRect(format: BannerBox, view: BannerView): Rect {
  const { width, height } = format.views?.[view] ?? format;
  return {
    left: Math.round((format.width - width) / 2),
    top: Math.round((format.height - height) / 2),
    width,
    height,
  };
}

/** The part every device shows clearly, where the content goes. */
export function safeAreaOf(format: BannerBox): Rect {
  return format.safeArea ?? viewRect(format, "phone");
}

export function exportFormats(format: BannerFormat): readonly ExportFormat[] {
  return format.formats ?? EXPORT_FORMATS;
}

export function exportFormatFor(
  format: BannerFormat,
  file: ExportFormat = DEFAULT_EXPORT_FORMAT,
): ExportFormat {
  const formats = exportFormats(format);
  return formats.includes(file) ? file : formats[0];
}

export function exportPixelRatios(
  format: BannerFormat,
  file: ExportFormat,
): readonly ExportPixelRatio[] {
  const max = format.maxPixelRatio?.[file];
  return max ? EXPORT_PIXEL_RATIOS.filter((ratio) => ratio <= max) : EXPORT_PIXEL_RATIOS;
}

/** Caps `ratio` at the format's largest one for `file`. */
export function exportPixelRatioFor(
  format: BannerFormat,
  file: ExportFormat,
  ratio: ExportPixelRatio = DEFAULT_PIXEL_RATIO,
): ExportPixelRatio {
  const max = format.maxPixelRatio?.[file];
  return max !== undefined && max < ratio ? max : ratio;
}
