/**
 * Client-side background upload policy: static raster images only (no GIF / animation).
 * HEIC/HEIF is converted in-browser (see `heic2any`) before `createImageBitmap`.
 * `accept` on file inputs is a hint only — always validate here.
 */

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

/** Raw file size limit before decode (bytes). */
export const MAX_BACKGROUND_UPLOAD_BYTES = 12 * 1024 * 1024;

/** Longest edge after normalization (px). */
export const MAX_BACKGROUND_OUTPUT_DIMENSION = 2048;

export const BACKGROUND_JPEG_QUALITY = 0.88;

/** User-facing line when a file fails validation or decode (no “not supported” callouts). */
export const SUPPORTED_BACKGROUND_FORMATS_MESSAGE =
  "Only PNG, JPEG, WebP, and HEIC/HEIF are supported.";

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

/**
 * Pre-decode checks: size, MIME allowlist, GIF rejection, extension hint when type missing.
 * Returns `null` if OK, otherwise a user-facing English message.
 */
export function validateBackgroundUploadMeta(file: File): string | null {
  if (file.size > MAX_BACKGROUND_UPLOAD_BYTES) {
    return `Image must be ${MAX_BACKGROUND_UPLOAD_BYTES / (1024 * 1024)} MB or smaller.`;
  }

  const name = file.name.toLowerCase();
  if (name.endsWith(".gif")) {
    return SUPPORTED_BACKGROUND_FORMATS_MESSAGE;
  }

  const type = file.type.toLowerCase().trim();
  if (type === "image/gif") {
    return SUPPORTED_BACKGROUND_FORMATS_MESSAGE;
  }

  if (type && !(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(type)) {
    // HEIC sometimes ships as octet-stream or an empty type; trust the extension in those cases.
    const heicByName = /\.(heic|heif)$/i.test(name);
    if (!(heicByName && type === "application/octet-stream")) {
      return SUPPORTED_BACKGROUND_FORMATS_MESSAGE;
    }
  }

  if (!type) {
    if (!/\.(png|jpe?g|webp|heic|heif)$/i.test(file.name)) {
      return SUPPORTED_BACKGROUND_FORMATS_MESSAGE;
    }
  }

  return null;
}

/** Prefer MIME when present so a PNG named `.heic` is not sent through HEIC conversion. */
export function shouldDecodeHeicWithHeic2any(file: File): boolean {
  const t = file.type.toLowerCase().trim();
  if (t === "image/heic" || t === "image/heif") return true;
  if (t && t !== "application/octet-stream") return false;
  return /\.(heic|heif)$/i.test(file.name);
}

/**
 * Decode, optionally downscale, emit JPEG data URL for stable preview + export size.
 */
export async function normalizeBackgroundImageFile(
  file: File,
): Promise<{ ok: true; dataUrl: string } | { ok: false; error: string }> {
  if (typeof document === "undefined") {
    return { ok: false, error: "Upload is only available in the browser." };
  }

  const metaErr = validateBackgroundUploadMeta(file);
  if (metaErr) return { ok: false, error: metaErr };

  const head = await readFileHead(file, 6);
  if (isGifMagicBytes(head)) {
    return { ok: false, error: SUPPORTED_BACKGROUND_FORMATS_MESSAGE };
  }

  let decodeBlob: Blob = file;
  if (shouldDecodeHeicWithHeic2any(file)) {
    try {
      const { default: heic2any } = await import("heic2any");
      const out = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: BACKGROUND_JPEG_QUALITY,
      });
      decodeBlob = Array.isArray(out) ? out[0]! : out;
    } catch {
      return { ok: false, error: SUPPORTED_BACKGROUND_FORMATS_MESSAGE };
    }
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(decodeBlob);
  } catch {
    return { ok: false, error: SUPPORTED_BACKGROUND_FORMATS_MESSAGE };
  }

  try {
    const { width, height } = bitmap;
    const maxDim = MAX_BACKGROUND_OUTPUT_DIMENSION;
    const scale = Math.min(1, maxDim / Math.max(width, height, 1));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { ok: false, error: "Unable to process image in this browser." };
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", BACKGROUND_JPEG_QUALITY);
    return { ok: true, dataUrl };
  } finally {
    bitmap.close();
  }
}

export function truncateMiddle(str: string, maxChars: number): string {
  if (str.length <= maxChars) return str;
  const keep = maxChars - 3;
  const head = Math.ceil(keep / 2);
  const tail = Math.floor(keep / 2);
  return `${str.slice(0, head)}…${str.slice(-tail)}`;
}
