import { lookup as dnsLookup } from "node:dns";
import { request } from "node:https";
import { isIP, type LookupFunction } from "node:net";
import { isPublicAddress } from "@/src/export/publicAddress";

const MAX_LINKED_IMAGE_BYTES = 10 * 1024 * 1024;
const TIMEOUT_MS = 5_000;
const MAX_REDIRECTS = 3;

/** Image formats a link can be, by content type. No GIF: it would animate only in the preview. */
export const LINK_IMAGE_FORMATS = {
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
function formatNames(types: readonly LinkImageType[]): string {
  const names = types.map((type) => LINK_IMAGE_FORMATS[type]);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} or ${names.at(-1)}` : names[0];
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
  if (error.name === "AbortError" || error.name === "TimeoutError") {
    return new ImageLinkError("The image link took too long to load.");
  }
  if (error.code === "ENOTFOUND") return new ImageLinkError("Couldn't find that image link.");
  return new ImageLinkError("Couldn't load the image link.");
}

/**
 * Downloads an image link for export: https only, public addresses only, one of `types`, at most
 * `MAX_LINKED_IMAGE_BYTES`, within `TIMEOUT_MS` including redirects. Throws `ImageLinkError` when
 * the link can't be used.
 */
export async function fetchImageLink(
  link: string,
  types: readonly LinkImageType[],
  redirectsLeft = MAX_REDIRECTS,
  signal = AbortSignal.timeout(TIMEOUT_MS),
): Promise<ImageBytes> {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    throw new ImageLinkError("That image link isn't a valid URL.");
  }
  if (url.protocol !== "https:") {
    throw new ImageLinkError("Image links must start with https://.");
  }
  // IP literals connect without a lookup, so check them here.
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host) && !isPublicAddress(host)) throw new ImageLinkError(NOT_ALLOWED);

  return new Promise((resolve, reject) => {
    const fail = (error: NodeJS.ErrnoException) => reject(toLinkError(error));
    const req = request(
      url,
      { lookup: publicOnlyLookup, signal, headers: { accept: types.join(",") } },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume();
          if (redirectsLeft === 0) {
            reject(new ImageLinkError("The image link redirects too many times."));
            return;
          }
          const next = new URL(res.headers.location, url);
          if (next.protocol !== "https:") {
            reject(new ImageLinkError("That image link redirects to an insecure address."));
            return;
          }
          fetchImageLink(next.href, types, redirectsLeft - 1, signal).then(resolve, reject);
          return;
        }
        if (status !== 200) {
          res.resume();
          reject(
            new ImageLinkError("Couldn't load that image link. It may have moved or be private."),
          );
          return;
        }
        const contentType = (res.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
        if (!types.some((type) => type === contentType)) {
          res.destroy();
          reject(new ImageLinkError(`That link isn't a ${formatNames(types)} image.`));
          return;
        }
        const tooLarge = new ImageLinkError(
          `The linked image is larger than ${MAX_LINKED_IMAGE_BYTES / (1024 * 1024)} MB.`,
        );
        if (Number(res.headers["content-length"]) > MAX_LINKED_IMAGE_BYTES) {
          res.destroy();
          reject(tooLarge);
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_LINKED_IMAGE_BYTES) {
            res.destroy();
            reject(tooLarge);
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => resolve({ contentType, body: Buffer.concat(chunks) }));
        res.on("error", fail);
      },
    );
    req.on("error", fail);
    req.end();
  });
}
