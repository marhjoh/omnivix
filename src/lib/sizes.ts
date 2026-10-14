import { isOneOf } from "@/src/lib/isOneOf";

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
  | "discord";

interface BannerPlatform {
  name: string;
  icon: PlatformIconName;
}

interface BannerFormat {
  label: string;
  /** Render size in CSS pixels. */
  width: number;
  height: number;
  platforms: BannerPlatform[];
}

export const BANNER_SIZE_KEYS = ["wide", "header", "card"] as const;

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
};

/** Every platform with a format, in picker order. */
export const BANNER_PLATFORMS = Object.values(BANNER_SIZES).flatMap((format) => format.platforms);

export function normalizeBannerSize(raw: unknown, fallback: BannerSize = "wide"): BannerSize {
  return isOneOf(BANNER_SIZE_KEYS, raw) ? raw : fallback;
}
