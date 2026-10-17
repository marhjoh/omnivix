/** Pixel ratios a banner can be exported at: 1× is the platform's exact size. */
export const EXPORT_PIXEL_RATIOS = [1, 2, 3] as const;

export type ExportPixelRatio = (typeof EXPORT_PIXEL_RATIOS)[number];

/** Default pixel ratio, for the studio and the export API; the landing FAQ quotes it. */
export const EXPORT_PIXEL_RATIO: ExportPixelRatio = 3;
