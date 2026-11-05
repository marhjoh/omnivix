/** File formats a banner can be exported as. Banners always have a solid background, so JPEG loses no transparency. */
export const EXPORT_FORMATS = ["png", "jpeg"] as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const DEFAULT_EXPORT_FORMAT: ExportFormat = "png";

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
export const DEFAULT_PIXEL_RATIO: ExportPixelRatio = 3;
