export const EXPORT_FORMATS = ["png", "jpeg"] as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const DEFAULT_EXPORT_FORMAT: ExportFormat = "png";

export const EXPORT_FORMAT_DETAILS: Record<
  ExportFormat,
  { contentType: string; extension: string }
> = {
  png: { contentType: "image/png", extension: "png" },
  jpeg: { contentType: "image/jpeg", extension: "jpg" },
};

/** `transparent` leaves out the theme's background color. PNG only, since JPEG has no alpha. */
export const EXPORT_BACKGROUNDS = ["transparent"] as const;

export type ExportBackground = (typeof EXPORT_BACKGROUNDS)[number];

/** 1× is the platform's exact size. */
export const EXPORT_PIXEL_RATIOS = [1, 2, 3] as const;

export type ExportPixelRatio = (typeof EXPORT_PIXEL_RATIOS)[number];

/** Used by the studio and the export API. The FAQ on the landing page quotes it. */
export const DEFAULT_PIXEL_RATIO: ExportPixelRatio = 3;

/**
 * The highest ratio for image URLs. 2× is sharp on high-density screens, and a 3× photo banner is
 * about 5 MB.
 */
export const IMAGE_URL_PIXEL_RATIO: ExportPixelRatio = 2;
