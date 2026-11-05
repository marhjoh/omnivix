import { uploadImageTypes, type ImageType } from "@/src/lib/imageSource";

/**
 * What an image upload (the background and the logo) may be: its formats, file size and processed
 * size. The studio processes uploads to fit (src/studio/imageUpload.ts); the export checks them.
 */

/** Raw file size limit before decode (bytes). */
export const MAX_IMAGE_FILE_BYTES = 12 * 1024 * 1024;

/** How an upload is processed for the banner. */
export interface ImageUploadPolicy {
  /**
   * Longest edges to try, largest first; smaller sizes are fallbacks for images too detailed to
   * fit `maxBytes`.
   */
  dimensions: readonly number[];
  /** Decoded size limit for a processed upload; the export rejects larger ones. */
  maxBytes: number;
  quality: number;
  /** Keeps transparency: WebP, else PNG. Without it, WebP, else the smaller JPEG. */
  transparent: boolean;
  /** Accepts SVG, drawn at the largest of `dimensions`. */
  svg: boolean;
}

// An export request carries both uploads, and Vercel limits a request body to 4.5 MB. As base64,
// the background's 3 MB is 4 MB and the logo's 200 KB about 270 KB.

/** Exports are up to 4752px wide. Shown at 28% opacity, where compression artifacts don't show. */
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

/** The formats an upload under `policy` can be. */
export function uploadFormats(policy: ImageUploadPolicy): ImageType[] {
  return uploadImageTypes({ svg: policy.svg });
}
