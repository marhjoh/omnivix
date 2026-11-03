/** File formats a banner can be exported as. Banners always have a solid background, so JPEG loses no transparency. */
export const EXPORT_FORMATS = ["png", "jpeg"] as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const EXPORT_FORMAT: ExportFormat = "png";

/**
 * A 3:1 photo banner at 3× is at most about 1.2 MB as JPEG instead of 6 MB as PNG, without visible
 * artifacts.
 */
export const JPEG_QUALITY = 90;

export const EXPORT_FORMAT_DETAILS: Record<
  ExportFormat,
  { label: string; hint: string; contentType: string; extension: string }
> = {
  png: { label: "PNG", hint: "Best quality", contentType: "image/png", extension: "png" },
  jpeg: { label: "JPEG", hint: "Smaller file", contentType: "image/jpeg", extension: "jpg" },
};

/** Pixel ratios a banner can be exported at: 1× is the platform's exact size. */
export const EXPORT_PIXEL_RATIOS = [1, 2, 3] as const;

export type ExportPixelRatio = (typeof EXPORT_PIXEL_RATIOS)[number];

/** Default pixel ratio, for the studio and the export API; the landing FAQ quotes it. */
export const EXPORT_PIXEL_RATIO: ExportPixelRatio = 3;
