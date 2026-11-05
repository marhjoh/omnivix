import { lookup as dnsLookup } from "node:dns";
import type { IncomingMessage } from "node:http";
import { request } from "node:https";
import { isIP, type LookupFunction } from "node:net";
import { listText } from "@/src/lib/text";
import { isPublicAddress } from "@/src/export/publicAddress";

const MAX_LINKED_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_REDIRECTS = 3;

/** Image formats a link can be, by content type. No GIF: it would animate only in the preview. */
const LINK_IMAGE_FORMATS = {
  "image/png": "PNG",
  "image/jpeg": "JPEG",
  "image/webp": "WebP",
  "image/avif": "AVIF",
  "image/svg+xml": "SVG",
} as const;

export type LinkImageType = keyof typeof LINK_IMAGE_FORMATS;

/** A downloaded image, served to the render page in place of its link. */
export interface ImageBytes {
  contentType: string;
  body: Buffer;
}

/** A link the export won't use; `message` is shown to the user. */
export class ImageLinkError extends Error {}

/** "PNG, JPEG or WebP" */
export function formatNames(types: readonly LinkImageType[]): string {
  return listText(types.map((type) => LINK_IMAGE_FORMATS[type]));
}

const NOT_ALLOWED = "That image link isn't allowed. Use a public https:// image.";

/**
 * Resolves like `dns.lookup`, but fails when any address isn't public. Used for every connection,
 * redirects included, so a link can't reach the server's own network or be re-pointed (DNS
 * rebinding) between a check and the request.
 */
const publicOnlyLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error, "");
    if (addresses.some((a) => !isPublicAddress(a.address))) {
      return callback(Object.assign(new Error(NOT_ALLOWED), { code: "ENOTPUBLIC" }), "");
    }
    if (options.all) return callback(null, addresses);
    callback(null, addresses[0].address, addresses[0].family);
  });
};

function toLinkError(error: NodeJS.ErrnoException): ImageLinkError {
  if (error.code === "ENOTPUBLIC") return new ImageLinkError(NOT_ALLOWED);
  if (error.code === "ENOTFOUND") return new ImageLinkError("Couldn't find that image link.");
  return new ImageLinkError("Couldn't load the image link.");
}

const TOO_LARGE = `The linked image is larger than ${MAX_LINKED_IMAGE_BYTES / (1024 * 1024)} MB.`;

/**
 * Downloads an image link for export: https only, public addresses only, one of `types`, at most
 * `MAX_LINKED_IMAGE_BYTES`, redirects included. Throws `ImageLinkError` when the link can't be
 * used. `signal` stops it (the caller's timeout, see `resolveExportImages`).
 */
export function fetchImageLink(
  link: string,
  types: readonly LinkImageType[],
  signal = new AbortController().signal,
): Promise<ImageBytes> {
  return download(link, types, MAX_REDIRECTS, signal);
}

async function download(
  link: string,
  types: readonly LinkImageType[],
  redirectsLeft: number,
  signal: AbortSignal,
): Promise<ImageBytes> {
  const url = checkedUrl(link);
  const res = await openResponse(url, types, signal);
  const status = res.statusCode ?? 0;
  if (status >= 300 && status < 400 && res.headers.location) {
    res.resume();
    const next = redirectTarget(res.headers.location, url, redirectsLeft);
    return download(next, types, redirectsLeft - 1, signal);
  }
  if (status !== 200) {
    res.resume();
    throw new ImageLinkError("Couldn't load that image link. It may have moved or be private.");
  }
  const contentType = (res.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
  if (!types.some((type) => type === contentType)) {
    res.destroy();
    throw new ImageLinkError(`That link isn't a ${formatNames(types)} image.`);
  }
  if (Number(res.headers["content-length"]) > MAX_LINKED_IMAGE_BYTES) {
    res.destroy();
    throw new ImageLinkError(TOO_LARGE);
  }
  return { contentType, body: await readLimitedBody(res) };
}

/** The link as a URL, if it's https and not a private IP literal (those skip the DNS check). */
function checkedUrl(link: string): URL {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    throw new ImageLinkError("That image link isn't a valid URL.");
  }
  if (url.protocol !== "https:") {
    throw new ImageLinkError("Image links must start with https://.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host) && !isPublicAddress(host)) throw new ImageLinkError(NOT_ALLOWED);
  return url;
}

/** The response's headers, from a connection that only reaches public addresses. */
function openResponse(
  url: URL,
  types: readonly LinkImageType[],
  signal: AbortSignal,
): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const req = request(
      url,
      { lookup: publicOnlyLookup, signal, headers: { accept: types.join(",") } },
      resolve,
    );
    req.on("error", (error: NodeJS.ErrnoException) => reject(toLinkError(error)));
    req.end();
  });
}

/** Where a redirect goes, if it may be followed: https, and not past the redirect limit. */
function redirectTarget(location: string, from: URL, redirectsLeft: number): string {
  if (redirectsLeft === 0) throw new ImageLinkError("The image link redirects too many times.");
  let next: URL;
  try {
    next = new URL(location, from);
  } catch {
    throw new ImageLinkError("That image link redirects to an invalid address.");
  }
  if (next.protocol !== "https:") {
    throw new ImageLinkError("That image link redirects to an insecure address.");
  }
  return next.href;
}

/** The body, stopped as soon as it passes `MAX_LINKED_IMAGE_BYTES`. */
function readLimitedBody(res: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    res.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_LINKED_IMAGE_BYTES) {
        res.destroy();
        reject(new ImageLinkError(TOO_LARGE));
        return;
      }
      chunks.push(chunk);
    });
    res.on("end", () => resolve(Buffer.concat(chunks)));
    res.on("error", (error: NodeJS.ErrnoException) => reject(toLinkError(error)));
  });
}
