import "server-only";
import { Effect } from "effect";
import type { ExportRequest } from "@/src/types/template";
import { UnusableImage } from "@/src/export/errors";
import { fetchImageLink, ImageLinkError, type ImageBytes } from "@/src/export/imageLink";
import { BACKGROUND_UPLOAD, LOGO_UPLOAD } from "@/src/lib/imageUpload";
import {
  formatNames,
  isDataUrl,
  isHttpImageUrl,
  linkImageTypes,
  type LinkImageType,
} from "@/src/lib/imageSource";
import { isOneOf } from "@/src/lib/isOneOf";

/** Raster images the export draws as they are: uploads (once processed) and background links. */
const RASTER_TYPES = linkImageTypes({ svg: false });

type ImageSettingKey = "backgroundImage" | "logoImage";

/**
 * The banner's images, by setting. An upload (data URL) or a link is taken out of the payload and
 * served to the render page at `path` instead. No route serves it: Playwright answers the request
 * from memory (see `captureBanner`), so an upload never has to fit in the render URL's token and
 * Playwright never loads a link itself.
 */
const EXPORT_IMAGES: ReadonlyArray<{
  key: ImageSettingKey;
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
    linkTypes: linkImageTypes({ svg: true }),
  },
];

/** The formats a link in image setting `key` can be, e.g. "PNG, JPEG, WebP or AVIF". */
export function linkFormatsOf(key: ImageSettingKey): string {
  return formatNames(EXPORT_IMAGES.find((image) => image.key === key)!.linkTypes);
}

/**
 * A base64 data URL. Processed uploads are WebP, PNG or JPEG (src/lib/imageUpload.ts); any of
 * RASTER_TYPES is accepted.
 */
const DATA_URL_PATTERN = /^data:([^;,]+);base64,([A-Za-z0-9+/]+={0,2})$/;

/** An uploaded or linked image, and where the render page loads it from. */
export interface ExportImage extends ImageBytes {
  path: string;
}

type ImageSlot = (typeof EXPORT_IMAGES)[number];

/** How long a link may take to download, redirects included. */
const LINK_TIMEOUT = "5 seconds";

/**
 * A link downloaded under `fetchImageLink`'s rules, within LINK_TIMEOUT. A timeout, or the
 * export's deadline, stops the download.
 */
function downloadLink(link: string, types: readonly LinkImageType[]) {
  return Effect.tryPromise({
    try: (signal) => fetchImageLink(link, types, signal),
    catch: (cause) => cause,
  }).pipe(
    Effect.catch((cause) =>
      cause instanceof ImageLinkError
        ? Effect.fail(new UnusableImage({ message: cause.message }))
        : Effect.die(cause),
    ),
    Effect.timeoutOrElse({
      duration: LINK_TIMEOUT,
      orElse: () =>
        Effect.fail(new UnusableImage({ message: "The image link took too long to load." })),
    }),
  );
}

/** One image setting: null to keep it as it is, or the image to serve at its `path`. */
const resolveImage = Effect.fnUntraced(function* (
  value: unknown,
  { name, path, maxUploadBytes, linkTypes, presets }: ImageSlot,
): Effect.fn.Return<ExportImage | null, UnusableImage> {
  if (value === undefined || value === "") return null;
  if (typeof value !== "string") {
    return yield* new UnusableImage({ message: `Unsupported ${name} image.` });
  }
  if (presets?.test(value)) return null;

  if (isDataUrl(value)) {
    const match = DATA_URL_PATTERN.exec(value);
    if (!match || !isOneOf(RASTER_TYPES, match[1])) {
      return yield* new UnusableImage({ message: `The uploaded ${name} isn't a supported image.` });
    }
    const body = Buffer.from(match[2], "base64");
    if (body.length > maxUploadBytes) {
      return yield* new UnusableImage({
        message: `The uploaded ${name} is too large. Try a smaller image.`,
      });
    }
    return { path, contentType: match[1], body };
  }

  if (isHttpImageUrl(value)) return { path, ...(yield* downloadLink(value, linkTypes)) };

  return yield* new UnusableImage({ message: `Unsupported ${name} image.` });
});

/**
 * Prepares the payload's images for export. Uploads and links are returned as bytes, with their
 * `path` left in the payload in their place; links are downloaded here under `fetchImageLink`'s
 * rules. Presets stay as they are. Anything else fails with `UnusableImage`.
 */
export const resolveExportImages = Effect.fnUntraced(function* <T extends ExportRequest>(
  payload: T,
): Effect.fn.Return<{ payload: T; images: ExportImage[] }, UnusableImage> {
  const resolved = yield* Effect.all(
    EXPORT_IMAGES.map((slot) => resolveImage(payload.state[slot.key], slot)),
    { concurrency: "unbounded" },
  );
  const state = { ...payload.state };
  const images: ExportImage[] = [];
  for (const [index, image] of resolved.entries()) {
    if (!image) continue;
    state[EXPORT_IMAGES[index].key] = image.path;
    images.push(image);
  }
  return { payload: images.length ? { ...payload, state } : payload, images };
});
