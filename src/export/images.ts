import type { ExportRequest } from "@/src/types/template";
import {
  fetchImageLink,
  ImageLinkError,
  type ImageBytes,
  type LinkImageType,
} from "@/src/export/imageLink";
import { BACKGROUND_UPLOAD, LOGO_UPLOAD } from "@/src/lib/imageUpload";

const RASTER_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif"] as const;

/**
 * The banner's images, by setting. An upload (data URL) or a link is taken out of the payload and
 * served to the render page at `path` instead. No route serves it: Playwright answers the request
 * from memory (see `captureBanner`), so an upload never has to fit in the render URL's token and
 * Playwright never loads a link itself.
 */
const EXPORT_IMAGES: ReadonlyArray<{
  key: string;
  /** The image's name in messages. */
  name: string;
  path: string;
  maxUploadBytes: number;
  linkTypes: readonly LinkImageType[];
  /** Built-in images (src/backgrounds/presets.ts), used as they are. */
  presets?: RegExp;
}> = [
  {
    key: "backgroundImage",
    name: "background",
    path: "/__export/background",
    maxUploadBytes: BACKGROUND_UPLOAD.maxBytes,
    linkTypes: RASTER_TYPES,
    presets: /^\/backgrounds\/[a-z0-9-]+\.(?:avif|svg)$/,
  },
  {
    key: "logoImage",
    name: "logo",
    path: "/__export/logo",
    maxUploadBytes: LOGO_UPLOAD.maxBytes,
    // Most logos are SVG. The render page shows it as an image, which can't run scripts.
    linkTypes: [...RASTER_TYPES, "image/svg+xml"],
  },
];

/** Processed uploads are WebP, PNG or JPEG (src/lib/imageUpload.ts); AVIF is accepted too. */
const DATA_URL_PATTERN = /^data:(image\/(?:png|jpeg|webp|avif));base64,([A-Za-z0-9+/]+={0,2})$/;

/** An uploaded or linked image, and where the render page loads it from. */
export interface ExportImage extends ImageBytes {
  path: string;
}

type ExportImagesResult =
  { ok: true; payload: ExportRequest; images: ExportImage[] } | { ok: false; error: string };

/** One image setting: unchanged, served as bytes, or a problem to report. */
type Resolved = { keep: true } | { image: ExportImage } | { error: string };

async function resolveImage(
  value: unknown,
  { name, path, maxUploadBytes, linkTypes, presets }: (typeof EXPORT_IMAGES)[number],
): Promise<Resolved> {
  if (value === undefined || value === "") return { keep: true };
  if (typeof value !== "string") return { error: `Unsupported ${name} image.` };
  if (presets?.test(value)) return { keep: true };

  if (value.startsWith("data:")) {
    const match = DATA_URL_PATTERN.exec(value);
    if (!match) return { error: `The uploaded ${name} isn't a supported image.` };
    const body = Buffer.from(match[2], "base64");
    if (body.length > maxUploadBytes) {
      return { error: `The uploaded ${name} is too large. Try a smaller image.` };
    }
    return { image: { path, contentType: match[1], body } };
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      return { image: { path, ...(await fetchImageLink(value, linkTypes)) } };
    } catch (error) {
      if (error instanceof ImageLinkError) return { error: error.message };
      throw error;
    }
  }

  return { error: `Unsupported ${name} image.` };
}

/**
 * Prepares the payload's images for export. Uploads and links are returned as bytes, with their
 * `path` left in the payload in their place; links are downloaded here under `fetchImageLink`'s
 * rules. Presets stay as they are. Anything else is rejected.
 */
export async function resolveExportImages(payload: ExportRequest): Promise<ExportImagesResult> {
  const resolved = await Promise.all(
    EXPORT_IMAGES.map((slot) => resolveImage(payload.state[slot.key], slot)),
  );
  const state = { ...payload.state };
  const images: ExportImage[] = [];
  for (const [index, result] of resolved.entries()) {
    if ("error" in result) return { ok: false, error: result.error };
    if ("image" in result) {
      state[EXPORT_IMAGES[index].key] = result.image.path;
      images.push(result.image);
    }
  }
  return { ok: true, payload: images.length ? { ...payload, state } : payload, images };
}
