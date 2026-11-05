import { listText } from "@/src/lib/text";

/** An uploaded image, inlined as a data URL. */
export function isDataUrl(value: string): boolean {
  return value.startsWith("data:");
}

/**
 * An https:// image link (as opposed to a preset path or an uploaded data URL). Only https: the
 * studio's link field adds it, and the export loads nothing else (src/export/imageLink.ts).
 */
export function isHttpsUrl(value: string): boolean {
  return /^https:\/\//i.test(value.trim());
}

interface ImageFormat {
  /** The name in messages; formats that share one (HEIC and HEIF) are named once. */
  name: string;
  extensions: readonly string[];
  /** Converted in the browser (see `heic2any`), so only uploads take it, not links. */
  uploadOnly?: boolean;
  /** Only where the setting takes SVG (the logo). */
  vector?: boolean;
}

/**
 * Every image format Omnivix takes, by MIME type, in the order messages list them. No GIF: it
 * would animate only in the preview.
 */
const IMAGE_FORMATS = {
  "image/png": { name: "PNG", extensions: ["png"] },
  "image/jpeg": { name: "JPEG", extensions: ["jpg", "jpeg"] },
  "image/webp": { name: "WebP", extensions: ["webp"] },
  "image/avif": { name: "AVIF", extensions: ["avif"] },
  "image/heic": { name: "HEIC", extensions: ["heic"], uploadOnly: true },
  "image/heif": { name: "HEIC", extensions: ["heif"], uploadOnly: true },
  "image/svg+xml": { name: "SVG", extensions: ["svg"], vector: true },
} as const satisfies Record<string, ImageFormat>;

export type ImageType = keyof typeof IMAGE_FORMATS;

/** The formats an image link can be: every one but the upload-only ones. */
export type LinkImageType = {
  [T in ImageType]: (typeof IMAGE_FORMATS)[T] extends { uploadOnly: true } ? never : T;
}[ImageType];

const IMAGE_TYPES = Object.keys(IMAGE_FORMATS) as ImageType[];

const FORMATS: Record<ImageType, ImageFormat> = IMAGE_FORMATS;

/** The formats an upload can be; SVG only when `svg`. */
export function uploadImageTypes({ svg }: { svg: boolean }): ImageType[] {
  return IMAGE_TYPES.filter((type) => svg || !FORMATS[type].vector);
}

/** The formats a link can be; SVG only when `svg`. */
export function linkImageTypes({ svg }: { svg: boolean }): LinkImageType[] {
  return IMAGE_TYPES.filter(
    (type): type is LinkImageType => !FORMATS[type].uploadOnly && (svg || !FORMATS[type].vector),
  );
}

/** The upload-only formats (HEIC), which the browser converts before it can draw them. */
export const HEIC_TYPES = IMAGE_TYPES.filter((type) => FORMATS[type].uploadOnly);

/** The vector formats (SVG), drawn onto a canvas when uploaded. */
export const SVG_TYPES = IMAGE_TYPES.filter((type) => FORMATS[type].vector);

/** "PNG, JPEG or WebP" (or "PNG, JPEG and WebP"). */
export function formatNames(types: readonly ImageType[], conjunction: "or" | "and" = "or"): string {
  return listText([...new Set(types.map((type) => FORMATS[type].name))], conjunction);
}

/** The file extensions of `types`, without the dot. */
export function formatExtensions(types: readonly ImageType[]): string[] {
  return types.flatMap((type) => FORMATS[type].extensions);
}

/** Whether `fileName` ends in one of the extensions of `types`, in any case. */
export function hasFormatExtension(fileName: string, types: readonly ImageType[]): boolean {
  const name = fileName.toLowerCase();
  return formatExtensions(types).some((extension) => name.endsWith(`.${extension}`));
}
