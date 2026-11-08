/**
 * Limits for image uploads (the background, the logo and the intro banner's photo). The studio
 * processes uploads to fit them (src/studio/imageUpload.ts), and the export checks them again.
 */

/** Raw file size limit before decode (bytes). */
export const MAX_IMAGE_FILE_BYTES = 12 * 1024 * 1024;

/** How an upload is processed for the banner. */
export interface ImageUploadPolicy {
  /**
   * Longest edges to try, largest first. The smaller ones are for images too detailed to fit
   * `maxBytes`.
   */
  dimensions: readonly number[];
  /** The limit for a processed upload, in decoded bytes. The export rejects larger ones. */
  maxBytes: number;
  quality: number;
  /**
   * Keeps transparency. Browsers that can't encode WebP fall back to PNG with it, or to the smaller
   * JPEG without.
   */
  transparent: boolean;
  /** Accepts SVG, drawn at the largest of `dimensions`. */
  svg: boolean;
}

// An export request carries every upload, and Vercel limits a request body to 4.5 MB. As base64,
// the background's 3 MB is 4 MB, the logo's 200 KB about 270 KB and the photo's 100 KB about
// 135 KB.

/**
 * Exports are up to 4752px wide. The background is shown at 28% opacity, which hides compression
 * artifacts.
 */
export const BACKGROUND_UPLOAD: ImageUploadPolicy = {
  dimensions: [4800, 3600, 2400],
  maxBytes: 3 * 1024 * 1024,
  quality: 0.82,
  transparent: false,
  svg: false,
};

/** An XL logo is at most about 2100px wide in a 3× export, and usually far smaller. */
export const LOGO_UPLOAD: ImageUploadPolicy = {
  dimensions: [1600, 1200, 800, 600],
  maxBytes: 200 * 1024,
  quality: 0.9,
  transparent: true,
  svg: true,
};

/**
 * Next to a name only, at XL in a 3× export, the photo is 1000px across or more. A photo too
 * detailed for 100 KB at 1200px is made smaller. The cap stays low because the request also
 * carries the background.
 */
export const PHOTO_UPLOAD: ImageUploadPolicy = {
  dimensions: [1200, 800, 600],
  maxBytes: 100 * 1024,
  quality: 0.86,
  transparent: false,
  svg: false,
};
