import { isOneOf } from "@/src/lib/isOneOf";

/**
 * Client-side background upload policy: static raster images only (no GIF / animation).
 * HEIC/HEIF is converted in-browser (see `heic2any`) before `createImageBitmap`.
 * `accept` on file inputs is a hint only — always validate here.
 */

const ALLOWED_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
] as const;

/** Raw file size limit before decode (bytes). */
export const MAX_BACKGROUND_UPLOAD_BYTES = 12 * 1024 * 1024;

/**
 * Longest edges to try, largest first. Exports are up to 4752px wide; smaller sizes are fallbacks
 * for images too detailed to fit `MAX_UPLOADED_BACKGROUND_BYTES`.
 */
const BACKGROUND_OUTPUT_DIMENSIONS = [4800, 3600, 2400];

/** Shown at 28% opacity, where compression artifacts don't show. */
const BACKGROUND_QUALITY = 0.82;

/** Decoded size limit for a processed upload; the export rejects larger ones (Vercel body limit). */
export const MAX_UPLOADED_BACKGROUND_BYTES = 3 * 1024 * 1024;

/** User-facing line when a file type isn't allowed (including GIFs, which are animated). */
export const SUPPORTED_BACKGROUND_FORMATS_MESSAGE =
  "Only PNG, JPEG, WebP, AVIF and HEIC are supported.";

/** The file has an allowed type but can't be decoded (damaged, or not what its name says). */
const UNREADABLE_BACKGROUND_MESSAGE = "Couldn't read this image. Try another file.";

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

  if (type && !isOneOf(ALLOWED_IMAGE_MIME_TYPES, type)) {
    // HEIC sometimes ships as octet-stream or an empty type; trust the extension in those cases.
    const heicByName = /\.(heic|heif)$/i.test(name);
    if (!(heicByName && type === "application/octet-stream")) {
      return SUPPORTED_BACKGROUND_FORMATS_MESSAGE;
    }
  }

  if (!type) {
    if (!/\.(png|jpe?g|webp|avif|heic|heif)$/i.test(file.name)) {
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

/** Size in bytes of a base64 data URL's content. */
export function dataUrlByteLength(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return (base64.length * 3) / 4 - padding;
}

function encodeCanvas(canvas: HTMLCanvasElement): string {
  const webp = canvas.toDataURL("image/webp", BACKGROUND_QUALITY);
  // Browsers that can't encode WebP (Safari) return a PNG instead, which is far larger.
  return webp.startsWith("data:image/webp")
    ? webp
    : canvas.toDataURL("image/jpeg", BACKGROUND_QUALITY);
}

/**
 * Decode, downscale to fit the export, and emit a WebP (or JPEG) data URL for stable preview and
 * export size.
 */
export async function normalizeBackgroundImageFile(
  file: File,
): Promise<{ ok: true; dataUrl: string } | { ok: false; error: string }> {
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
        quality: BACKGROUND_QUALITY,
      });
      decodeBlob = Array.isArray(out) ? out[0]! : out;
    } catch {
      return { ok: false, error: UNREADABLE_BACKGROUND_MESSAGE };
    }
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(decodeBlob);
  } catch {
    return { ok: false, error: UNREADABLE_BACKGROUND_MESSAGE };
  }

  try {
    const { width, height } = bitmap;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { ok: false, error: "Couldn't process this image in your browser." };
    }
    for (const maxDim of BACKGROUND_OUTPUT_DIMENSIONS) {
      const scale = Math.min(1, maxDim / Math.max(width, height, 1));
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const dataUrl = encodeCanvas(canvas);
      if (dataUrlByteLength(dataUrl) <= MAX_UPLOADED_BACKGROUND_BYTES) return { ok: true, dataUrl };
    }
    return { ok: false, error: "This image is too large to use. Try a smaller one." };
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
