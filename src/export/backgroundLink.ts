import { lookup as dnsLookup } from "node:dns";
import { request } from "node:https";
import { isIP, type LookupFunction } from "node:net";
import type { ExportBackground } from "@/src/export/background";
import { isPublicAddress } from "@/src/export/publicAddress";

export const MAX_LINKED_BACKGROUND_BYTES = 10 * 1024 * 1024;
const TIMEOUT_MS = 5_000;
const MAX_REDIRECTS = 3;
const IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
];

/** A link the export won't use; `message` is shown to the user. */
export class BackgroundLinkError extends Error {}

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

function toLinkError(error: NodeJS.ErrnoException): BackgroundLinkError {
  if (error instanceof BackgroundLinkError) return error;
  if (error.code === "ENOTPUBLIC") return new BackgroundLinkError(NOT_ALLOWED);
  if (error.name === "AbortError" || error.name === "TimeoutError") {
    return new BackgroundLinkError("The image link took too long to load.");
  }
  if (error.code === "ENOTFOUND") return new BackgroundLinkError("Couldn't find that image link.");
  return new BackgroundLinkError("Couldn't load the image link.");
}

/**
 * Downloads a background image link for export: https only, public addresses only, an image
 * content type, at most `MAX_LINKED_BACKGROUND_BYTES`, within `TIMEOUT_MS` including redirects.
 * Throws `BackgroundLinkError` when the link can't be used.
 */
export async function fetchBackgroundLink(
  link: string,
  redirectsLeft = MAX_REDIRECTS,
  signal = AbortSignal.timeout(TIMEOUT_MS),
): Promise<ExportBackground> {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    throw new BackgroundLinkError("That image link isn't a valid URL.");
  }
  if (url.protocol !== "https:") {
    throw new BackgroundLinkError("Image links must start with https://.");
  }
  // IP literals connect without a lookup, so check them here.
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host) && !isPublicAddress(host)) throw new BackgroundLinkError(NOT_ALLOWED);

  return new Promise((resolve, reject) => {
    const fail = (error: NodeJS.ErrnoException) => reject(toLinkError(error));
    const req = request(
      url,
      { lookup: publicOnlyLookup, signal, headers: { accept: IMAGE_TYPES.join(",") } },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume();
          if (redirectsLeft === 0) {
            reject(new BackgroundLinkError("The image link redirects too many times."));
            return;
          }
          const next = new URL(res.headers.location, url).href;
          fetchBackgroundLink(next, redirectsLeft - 1, signal).then(resolve, reject);
          return;
        }
        if (status !== 200) {
          res.resume();
          reject(new BackgroundLinkError(`The image link returned an error (HTTP ${status}).`));
          return;
        }
        const contentType = (res.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
        if (!IMAGE_TYPES.includes(contentType)) {
          res.destroy();
          reject(new BackgroundLinkError("That link isn't an image."));
          return;
        }
        const tooLarge = new BackgroundLinkError(
          `The linked image is larger than ${MAX_LINKED_BACKGROUND_BYTES / (1024 * 1024)} MB.`,
        );
        if (Number(res.headers["content-length"]) > MAX_LINKED_BACKGROUND_BYTES) {
          res.destroy();
          reject(tooLarge);
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_LINKED_BACKGROUND_BYTES) {
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
