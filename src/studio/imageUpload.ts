import { isOneOf } from "@/src/lib/isOneOf";
import {
  formatExtensions,
  formatNames,
  HEIC_TYPES,
  hasFormatExtension,
  SVG_TYPES,
  uploadImageTypes,
} from "@/src/lib/imageSource";
import { MAX_IMAGE_FILE_BYTES, type ImageUploadPolicy } from "@/src/lib/imageUpload";
import { megabytes } from "@/src/lib/text";

/** Every upload format but SVG, HEIC included. */
const RASTER_TYPES = uploadImageTypes({ svg: false });

/** The file input's `accept` list. Browsers treat it as a hint, so uploads are still checked. */
export function uploadAccept(policy: ImageUploadPolicy): string {
  const types = uploadImageTypes(policy);
  return [...types, ...formatExtensions(types).map((extension) => `.${extension}`)].join(",");
}

/** Error for a file type we don't accept. GIFs are rejected because they can be animated. */
export function supportedFormatsMessage(policy: ImageUploadPolicy): string {
  return `Only ${formatNames(uploadImageTypes(policy), "and")} are supported.`;
}

/** For a file with an allowed type that won't decode, e.g. it's damaged or misnamed. */
const UNREADABLE_MESSAGE = "Couldn't read this image. Try another file.";

const PROCESSING_MESSAGE = "Couldn't process this image in your browser.";

function mimeOf(file: File): string {
  return file.type.toLowerCase().trim();
}

function isSvgFile(file: File): boolean {
  const type = mimeOf(file);
  return isOneOf(SVG_TYPES, type) || (!type && hasFormatExtension(file.name, SVG_TYPES));
}

/** Checks size and type before decoding. Returns an error message, or null if the file is OK. */
export function validateImageUploadMeta(file: File, policy: ImageUploadPolicy): string | null {
  if (file.size > MAX_IMAGE_FILE_BYTES) {
    return `Image must be ${megabytes(MAX_IMAGE_FILE_BYTES)} or smaller.`;
  }
  const unsupported = supportedFormatsMessage(policy);
  if (isSvgFile(file)) {
    return policy.svg ? null : unsupported;
  }

  // GIFs fail here because they aren't in RASTER_TYPES. HEIC files sometimes come as
  // octet-stream, and then we trust the extension.
  const type = mimeOf(file);
  if (type) {
    return isOneOf(RASTER_TYPES, type) || shouldDecodeHeicWithHeic2any(file) ? null : unsupported;
  }
  return hasFormatExtension(file.name, RASTER_TYPES) ? null : unsupported;
}

/** Trusts the MIME type over the extension, so a PNG named `.heic` skips HEIC conversion. */
export function shouldDecodeHeicWithHeic2any(file: File): boolean {
  const t = mimeOf(file);
  if (isOneOf(HEIC_TYPES, t)) return true;
  if (t && t !== "application/octet-stream") return false;
  return hasFormatExtension(file.name, HEIC_TYPES);
}

/** `toBlob` encodes off the main thread. `toDataURL` can block it for seconds on a big photo. */
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

/** `vector` images can be drawn at any size without losing quality. */
interface Decoded {
  source: CanvasImageSource;
  width: number;
  height: number;
  vector: boolean;
  close: () => void;
}

/** Uses an `<img>` because `createImageBitmap` doesn't accept SVG in every browser. */
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
 * Decodes an upload, scales it to fit the export and encodes it as a data URL. WebP is preferred,
 * with PNG or JPEG where the browser can't encode WebP.
 */
export async function normalizeImageFile(
  file: File,
  policy: ImageUploadPolicy,
): Promise<{ ok: true; dataUrl: string } | { ok: false; error: string }> {
  const metaErr = validateImageUploadMeta(file, policy);
  if (metaErr) return { ok: false, error: metaErr };

  let image: Decoded;
  try {
    image = isSvgFile(file) ? await decodeSvg(file) : await decodeRaster(file, policy);
  } catch {
    return { ok: false, error: UNREADABLE_MESSAGE };
  }

  try {
    const { width, height } = image;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    for (const maxDim of policy.dimensions) {
      // Photos are only scaled down. Vectors are drawn at the full size.
      const fit = maxDim / Math.max(width, height);
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
