import { isOneOf } from "@/src/lib/isOneOf";
import type { ExportFormat } from "@/src/export/format";
import {
  EXPORT_PIXEL_RATIO,
  EXPORT_PIXEL_RATIOS,
  type ExportPixelRatio,
} from "@/src/export/viewport";

/**
 * Banner formats. Platforms rescale uploads, so one PNG fits every platform listed for a format.
 * Comments note each platform's recommended upload size.
 */

/** A platform, also naming its icon. */
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

/** What a device shows of the banner. Every view of a format without `views` is the whole banner. */
export const BANNER_VIEWS = ["phone", "desktop", "tv"] as const;

export type BannerView = (typeof BANNER_VIEWS)[number];

/** A part of the banner a device shows; centered on an axis without `left` or `top`. */
type ViewArea = Box & Partial<Pick<Rect, "left" | "top">>;

export interface BannerFormat extends Box {
  label: string;
  /** Set when devices show different parts of the image. Formats without TVs have no `tv`. */
  views?: { phone: ViewArea; desktop: ViewArea; tv?: ViewArea };
  /**
   * The part every device shows clearly, which the content fits: the phone view unless the
   * platform puts its own buttons or photo over part of that.
   */
  safeArea?: Rect;
  /** The largest pixel ratio per file format, for those that can't take every ratio. */
  maxPixelRatio?: Partial<Record<ExportFormat, ExportPixelRatio>>;
  platforms: BannerPlatform[];
}

/** A banner's size, and which parts of it devices show. */
export type BannerBox = Box & Pick<BannerFormat, "views" | "safeArea">;

export const BANNER_SIZE_KEYS = ["wide", "header", "reddit", "card", "youtube"] as const;

export type BannerSize = (typeof BANNER_SIZE_KEYS)[number];

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
  // Desktop cuts the top tenth. The iPhone app shows the middle half, x 750–2250, with its buttons
  // down to y 381, the avatar over x 870–1164 from y 437, and a fade from y 750 that's still
  // readable to y 850. The safe area is right of the avatar and between the buttons and the fade.
  reddit: {
    label: "3:1",
    width: 3000,
    height: 1000,
    views: {
      phone: { width: 1500, height: 1000 },
      desktop: { top: 100, width: 3000, height: 900 },
    },
    safeArea: { left: 1190, top: 390, width: 1040, height: 460 },
    // Already twice the width the app shows.
    maxPixelRatio: { png: 1, jpeg: 1 },
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
    // A 2× PNG (5120 × 2880) with a photo can go over YouTube's 6 MB limit (12 MB with London); as
    // JPEG even 3× is 4 MB at most.
    maxPixelRatio: { png: 1 },
    platforms: [{ id: "youtube", name: "YouTube" }],
  },
};

/** Every platform with a format, in picker order. */
export const BANNER_PLATFORMS = Object.values(BANNER_SIZES).flatMap((format) => format.platforms);

export function normalizeBannerSize(raw: unknown, fallback: BannerSize = "wide"): BannerSize {
  return isOneOf(BANNER_SIZE_KEYS, raw) ? raw : fallback;
}

/** The format a platform's banners use. */
export function sizeOfPlatform(id: unknown): BannerSize | undefined {
  return BANNER_SIZE_KEYS.find((key) => BANNER_SIZES[key].platforms.some((p) => p.id === id));
}

/** The platform picked in banner state, or its format's first when that's from another format. */
export function platformOf(state: Record<string, unknown>): BannerPlatform {
  const { platforms } = bannerFormatOf(state.size);
  return platforms.find((platform) => platform.id === state.platform) ?? platforms[0];
}

/** The format in banner state's `size`. */
export function bannerFormatOf(size: unknown): BannerFormat {
  return BANNER_SIZES[normalizeBannerSize(size)];
}

/** The views the format has, in toggle order; none when every device shows all of it. */
export function bannerViews(format: BannerBox): BannerView[] {
  return BANNER_VIEWS.filter((view) => format.views?.[view]);
}

/** `view` if the format has it, else the phone view (a TV view saved for YouTube, on Reddit). */
export function shownView(format: BannerBox, view: BannerView): BannerView {
  return format.views?.[view] ? view : "phone";
}

/** The part of the banner `view` shows: the whole banner without that view. */
export function viewRect(format: BannerBox, view: BannerView): Rect {
  const { width, height, left, top }: ViewArea = format.views?.[view] ?? format;
  return {
    left: left ?? Math.round((format.width - width) / 2),
    top: top ?? Math.round((format.height - height) / 2),
    width,
    height,
  };
}

/** The part every device shows clearly, where the content goes. */
export function safeAreaOf(format: BannerBox): Rect {
  return format.safeArea ?? viewRect(format, "phone");
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
