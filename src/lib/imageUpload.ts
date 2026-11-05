import { isOneOf } from "@/src/lib/isOneOf";
import {
  formatExtensions,
  formatNames,
  HEIC_TYPES,
  hasFormatExtension,
  SVG_TYPES,
  uploadImageTypes,
  type ImageType,
} from "@/src/lib/imageSource";
import { megabytes } from "@/src/lib/text";

/**
 * Client-side image uploads (the background and the logo): static images only (no GIF /
 * animation). HEIC/HEIF is converted in-browser (see `heic2any`) before `createImageBitmap`; SVG
 * is drawn onto a canvas, so no SVG code is kept. `accept` on file inputs is a hint only — always
 * validate here.
 */

/** Every upload format but SVG, HEIC included. */
const RASTER_TYPES = uploadImageTypes({ svg: false });

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

/** The file input's `accept`: MIME types and extensions. A hint only; uploads are checked here. */
export function uploadAccept(policy: ImageUploadPolicy): string {
  const types = uploadFormats(policy);
  return [...types, ...formatExtensions(types).map((extension) => `.${extension}`)].join(",");
}

/** User-facing line when a file type isn't allowed (including GIFs, which are animated). */
export function supportedFormatsMessage(policy: ImageUploadPolicy): string {
  return `Only ${formatNames(uploadFormats(policy), "and")} are supported.`;
}

/** The file has an allowed type but can't be decoded (damaged, or not what its name says). */
const UNREADABLE_MESSAGE = "Couldn't read this image. Try another file.";

const PROCESSING_MESSAGE = "Couldn't process this image in your browser.";

const GIF_MAGIC = [0x47, 0x49, 0x46]; // "GIF"

export function isGifMagicBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 3) return false;
  return GIF_MAGIC.every((b, i) => bytes[i] === b);
}

/**
 * Read first bytes of a file to detect GIF (even if MIME/extension lie).
 */
export async function readFileHead(file: File, byteCount: number): Promise<Uint8Array> {
  const slice = file.slice(0, byteCount);
  const buf = await slice.arrayBuffer();
  return new Uint8Array(buf);
}

function mimeOf(file: File): string {
  return file.type.toLowerCase().trim();
}

function isSvgFile(file: File): boolean {
  const type = mimeOf(file);
  return isOneOf(SVG_TYPES, type) || (!type && hasFormatExtension(file.name, SVG_TYPES));
}

/**
 * Pre-decode checks: size, MIME allowlist, GIF rejection, extension hint when type missing.
 * Returns `null` if OK, otherwise a user-facing English message.
 */
export function validateImageUploadMeta(file: File, policy: ImageUploadPolicy): string | null {
  if (file.size > MAX_IMAGE_FILE_BYTES) {
    return `Image must be ${megabytes(MAX_IMAGE_FILE_BYTES)} or smaller.`;
  }
  const unsupported = supportedFormatsMessage(policy);

  const name = file.name.toLowerCase();
  if (name.endsWith(".gif")) {
    return unsupported;
  }
  if (isSvgFile(file)) {
    return policy.svg ? null : unsupported;
  }

  // GIF isn't on the allowed list, so its MIME type is rejected here. HEIC sometimes ships as
  // octet-stream; then its extension is trusted.
  const type = mimeOf(file);
  if (type) {
    return isOneOf(RASTER_TYPES, type) || shouldDecodeHeicWithHeic2any(file) ? null : unsupported;
  }
  return hasFormatExtension(file.name, RASTER_TYPES) ? null : unsupported;
}

/** Prefer MIME when present so a PNG named `.heic` is not sent through HEIC conversion. */
export function shouldDecodeHeicWithHeic2any(file: File): boolean {
  const t = mimeOf(file);
  if (isOneOf(HEIC_TYPES, t)) return true;
  if (t && t !== "application/octet-stream") return false;
  return hasFormatExtension(file.name, HEIC_TYPES);
}

/** `toBlob` encodes off the main thread; `toDataURL` blocks it for seconds on a large photo. */
function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

async function encodeCanvas(canvas: HTMLCanvasElement, policy: ImageUploadPolicy) {
  const webp = await canvasBlob(canvas, "image/webp", policy.quality);
  // Browsers that can't encode WebP (Safari) return a PNG instead, which is far larger.
  if (webp?.type === "image/webp" || policy.transparent) return webp;
  return canvasBlob(canvas, "image/jpeg", policy.quality);
}

function readAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** A decoded image, ready to draw; `vector` images can be drawn at any size. */
interface Decoded {
  source: CanvasImageSource;
  width: number;
  height: number;
  vector: boolean;
  close: () => void;
}

/** SVG through an `<img>`: `createImageBitmap` doesn't take SVG in every browser. */
async function decodeSvg(file: File): Promise<Decoded> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
  if (!img.naturalWidth || !img.naturalHeight) {
    URL.revokeObjectURL(url);
    throw new Error("SVG has no size");
  }
  return {
    source: img,
    width: img.naturalWidth,
    height: img.naturalHeight,
    vector: true,
    close: () => URL.revokeObjectURL(url),
  };
}

async function decodeRaster(file: File, policy: ImageUploadPolicy): Promise<Decoded> {
  let blob: Blob = file;
  if (shouldDecodeHeicWithHeic2any(file)) {
    const { default: heic2any } = await import("heic2any");
    const out = await heic2any({ blob: file, toType: "image/jpeg", quality: policy.quality });
    blob = Array.isArray(out) ? out[0]! : out;
  }
  const bitmap = await createImageBitmap(blob);
  return {
    source: bitmap,
    width: bitmap.width,
    height: bitmap.height,
    vector: false,
    close: () => bitmap.close(),
  };
}

/**
 * Decode, scale to fit the export, and emit a WebP (or PNG/JPEG) data URL for stable preview and
 * export size.
 */
export async function normalizeImageFile(
  file: File,
  policy: ImageUploadPolicy,
): Promise<{ ok: true; dataUrl: string } | { ok: false; error: string }> {
  const metaErr = validateImageUploadMeta(file, policy);
  if (metaErr) return { ok: false, error: metaErr };

  const head = await readFileHead(file, 6);
  if (isGifMagicBytes(head)) {
    return { ok: false, error: supportedFormatsMessage(policy) };
  }

  let image: Decoded;
  try {
    image = isSvgFile(file) ? await decodeSvg(file) : await decodeRaster(file, policy);
  } catch {
    return { ok: false, error: UNREADABLE_MESSAGE };
  }

  try {
    const { width, height } = image;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return { ok: false, error: PROCESSING_MESSAGE };
    for (const maxDim of policy.dimensions) {
      // Photos are only scaled down; a vector is drawn at the full size.
      const fit = maxDim / Math.max(width, height, 1);
      const scale = image.vector ? fit : Math.min(1, fit);
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image.source, 0, 0, canvas.width, canvas.height);
      const blob = await encodeCanvas(canvas, policy);
      if (blob && blob.size <= policy.maxBytes) {
        return { ok: true, dataUrl: await readAsDataUrl(blob) };
      }
    }
    return { ok: false, error: "This image is too large to use. Try a smaller one." };
  } catch {
    return { ok: false, error: PROCESSING_MESSAGE };
  } finally {
    image.close();
  }
}
