import type { ExportFormat } from "@/src/export/format";
import { exportFormatFor, exportFormats, type BannerFormat } from "@/src/lib/sizes";

/** The studio's Download format tiles. Transparent is a PNG without the theme's background color. */
export const DOWNLOAD_FORMATS = ["png", "jpeg", "transparent"] as const;

export type DownloadFormat = (typeof DOWNLOAD_FORMATS)[number];

export const DOWNLOAD_FORMAT_DETAILS: Record<
  DownloadFormat,
  {
    label: string;
    hint: string;
    /** For "Download …" on the button. */
    name: string;
    file: ExportFormat;
    transparent?: boolean;
  }
> = {
  png: { label: "PNG", hint: "Best quality", name: "PNG", file: "png" },
  jpeg: { label: "JPEG", hint: "Smaller file", name: "JPEG", file: "jpeg" },
  transparent: {
    label: "Transparent",
    hint: "No background",
    name: "transparent PNG",
    file: "png",
    transparent: true,
  },
};

/** Reddit only takes JPEG, and a banner with a background image can't be transparent. */
export function canDownloadAs(
  banner: BannerFormat,
  format: DownloadFormat,
  hasBackgroundImage: boolean,
): boolean {
  const { file, transparent } = DOWNLOAD_FORMAT_DETAILS[format];
  return exportFormats(banner).includes(file) && !(transparent && hasBackgroundImage);
}

/** The saved choice, or the closest one the banner can take: JPEG for Reddit, else PNG. */
export function shownDownloadFormat(
  banner: BannerFormat,
  format: DownloadFormat,
  hasBackgroundImage: boolean,
): DownloadFormat {
  return canDownloadAs(banner, format, hasBackgroundImage)
    ? format
    : exportFormatFor(banner, DOWNLOAD_FORMAT_DETAILS[format].file);
}
