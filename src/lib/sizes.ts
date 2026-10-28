import { isOneOf } from "@/src/lib/isOneOf";
import type { ExportFormat } from "@/src/export/format";
import {
  EXPORT_PIXEL_RATIO,
  EXPORT_PIXEL_RATIOS,
  type ExportPixelRatio,
} from "@/src/export/viewport";

/**
 * Banner formats, one per aspect ratio. Platforms rescale uploads, so one PNG fits every platform
 * listed for its ratio. Comments note each platform's recommended upload size.
 */

export type PlatformIconName =
  | "linkedin"
  | "x"
  | "bluesky"
  | "mastodon"
  | "kofi"
  | "buymeacoffee"
  | "twitch"
  | "patreon"
  | "discord"
  | "youtube";

interface BannerPlatform {
  name: string;
  icon: PlatformIconName;
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

/** What a device shows of the banner. Every view of a format without `views` is the whole banner. */
export const BANNER_VIEWS = ["phone", "desktop", "tv"] as const;

export type BannerView = (typeof BANNER_VIEWS)[number];

export interface BannerFormat extends Box {
  label: string;
  /**
   * Set when devices show different parts of the image, each centered in it; TVs show all of it.
   * The content fits `phone`, the part every device shows.
   */
  views?: Record<Exclude<BannerView, "tv">, Box>;
  /** The largest pixel ratio per file format, for those that can't take every ratio. */
  maxPixelRatio?: Partial<Record<ExportFormat, ExportPixelRatio>>;
  platforms: BannerPlatform[];
}

/** A banner's size, and which parts of it devices show. */
export type BannerBox = Box & Pick<BannerFormat, "views">;

export const BANNER_SIZE_KEYS = ["wide", "header", "card", "youtube"] as const;

export type BannerSize = (typeof BANNER_SIZE_KEYS)[number];

export const BANNER_SIZES: Record<BannerSize, BannerFormat> = {
  // LinkedIn 1584 × 396, Buy Me a Coffee 1600 × 400
  wide: {
    label: "4:1",
    width: 1584,
    height: 396,
    platforms: [
      { name: "LinkedIn", icon: "linkedin" },
      { name: "Buy Me a Coffee", icon: "buymeacoffee" },
    ],
  },
  // X, Bluesky and Mastodon 1500 × 500, Ko-fi 1200 × 400
  header: {
    label: "3:1",
    width: 1500,
    height: 500,
    platforms: [
      { name: "X / Twitter", icon: "x" },
      { name: "Bluesky", icon: "bluesky" },
      { name: "Mastodon", icon: "mastodon" },
      { name: "Ko-fi", icon: "kofi" },
    ],
  },
  // Twitch 1200 × 480, Patreon 2500 × 1000, Discord 600 × 240
  card: {
    label: "5:2",
    width: 1500,
    height: 600,
    platforms: [
      { name: "Twitch", icon: "twitch" },
      { name: "Patreon", icon: "patreon" },
      { name: "Discord", icon: "discord" },
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
    },
    // A 3× PNG (7680 × 4320) with a photo is over YouTube's 6 MB limit; as JPEG it's about 1 MB.
    maxPixelRatio: { png: 2 },
    platforms: [{ name: "YouTube", icon: "youtube" }],
  },
};

/** Every platform with a format, in picker order. */
export const BANNER_PLATFORMS = Object.values(BANNER_SIZES).flatMap((format) => format.platforms);

export function normalizeBannerSize(raw: unknown, fallback: BannerSize = "wide"): BannerSize {
  return isOneOf(BANNER_SIZE_KEYS, raw) ? raw : fallback;
}

/** The format in banner state's `size`. */
export function bannerFormatOf(size: unknown): BannerFormat {
  return BANNER_SIZES[normalizeBannerSize(size)];
}

/** The part of the banner `view` shows, centered in it. */
export function viewRect(format: BannerBox, view: BannerView): Rect {
  const { width, height } = view === "tv" ? format : (format.views?.[view] ?? format);
  return {
    left: Math.round((format.width - width) / 2),
    top: Math.round((format.height - height) / 2),
    width,
    height,
  };
}

/** The pixel ratios the banner format can be exported at as `file`. */
export function exportPixelRatios(
  format: BannerFormat,
  file: ExportFormat,
): readonly ExportPixelRatio[] {
  const max = format.maxPixelRatio?.[file];
  return max ? EXPORT_PIXEL_RATIOS.filter((ratio) => ratio <= max) : EXPORT_PIXEL_RATIOS;
}

/** `ratio`, or the banner format's largest one for `file` if that's smaller. */
export function exportPixelRatioFor(
  format: BannerFormat,
  file: ExportFormat,
  ratio: ExportPixelRatio = EXPORT_PIXEL_RATIO,
): ExportPixelRatio {
  const max = format.maxPixelRatio?.[file];
  return max !== undefined && max < ratio ? max : ratio;
}
