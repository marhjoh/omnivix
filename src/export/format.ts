/** File formats a banner can be exported as. Banners always have a solid background, so JPEG loses no transparency. */
export const EXPORT_FORMATS = ["png", "jpeg"] as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const EXPORT_FORMAT: ExportFormat = "png";

/** A 3:1 photo banner at 3× is about 1 MB as JPEG instead of 7 MB as PNG, without visible artifacts. */
export const JPEG_QUALITY = 90;

export const EXPORT_FORMAT_DETAILS: Record<
  ExportFormat,
  { label: string; hint: string; contentType: string; extension: string }
> = {
  png: { label: "PNG", hint: "Best quality", contentType: "image/png", extension: "png" },
  jpeg: { label: "JPEG", hint: "Smaller file", contentType: "image/jpeg", extension: "jpg" },
};
