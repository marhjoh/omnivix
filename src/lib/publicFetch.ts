import "server-only";
import { lookup as dnsLookup } from "node:dns";
import type { IncomingMessage } from "node:http";
import { request } from "node:https";
import { isIP, type LookupFunction } from "node:net";
import { isPublicAddress } from "@/src/lib/publicAddress";
import { SITE_LINKS, SITE_NAME } from "@/src/lib/site";

// Downloads links that visitors give us, such as image links and feeds. They're untrusted, so only
// https links to public addresses work, with a size limit.

const MAX_REDIRECTS = 3;

/** Some sites, like dev.to, refuse requests that don't say who's asking. */
const USER_AGENT = `${SITE_NAME} (+${SITE_LINKS.repo})`;

/** Why a link couldn't be used. Each caller turns it into its own message. */
export type PublicFetchProblem =
  | "invalid-url"
  | "not-https"
  | "not-public"
  | "not-found"
  | "unreachable"
  | "bad-status"
  | "rate-limited"
  | "wrong-type"
  | "too-large"
  | "too-many-redirects"
  | "invalid-redirect"
  | "insecure-redirect";

export class PublicFetchError extends Error {
  constructor(readonly problem: PublicFetchProblem) {
    super(problem);
  }
}

export interface PublicResponse {
  /** Lowercase, without parameters such as `charset`. */
  contentType: string;
  body: Buffer;
}

export interface PublicFetchOptions {
  /** Sent as the Accept header. */
  accept: string;
  /** Checked before the body is read. */
  acceptsType: (contentType: string) => boolean;
  maxBytes: number;
  signal?: AbortSignal;
}

/**
 * `dns.lookup` that fails on any non-public address. Every connection uses it, redirects included,
 * so a link can't reach the server's network, even through DNS rebinding.
 */
const publicOnlyLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error, "");
    if (addresses.some((a) => !isPublicAddress(a.address))) {
      return callback(Object.assign(new Error("not public"), { code: "ENOTPUBLIC" }), "");
    }
    if (options.all) return callback(null, addresses);
    callback(null, addresses[0].address, addresses[0].family);
  });
};

function toFetchError(error: NodeJS.ErrnoException): PublicFetchError {
  if (error.code === "ENOTPUBLIC") return new PublicFetchError("not-public");
  if (error.code === "ENOTFOUND") return new PublicFetchError("not-found");
  return new PublicFetchError("unreachable");
}

/**
 * Downloads a link. Redirects follow the same rules. Throws `PublicFetchError` when the link can't
 * be used. `signal` cancels the download.
 */
export async function fetchPublic(
  link: string,
  options: PublicFetchOptions,
  redirectsLeft = MAX_REDIRECTS,
): Promise<PublicResponse> {
  const url = checkedUrl(link);
  const res = await openResponse(url, options);
  const status = res.statusCode ?? 0;
  if (status >= 300 && status < 400 && res.headers.location) {
    res.resume();
    const next = redirectTarget(res.headers.location, url, redirectsLeft);
    return fetchPublic(next, options, redirectsLeft - 1);
  }
  if (status !== 200) {
    res.resume();
    throw new PublicFetchError(status === 429 ? "rate-limited" : "bad-status");
  }
  const contentType = (res.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
  if (!options.acceptsType(contentType)) {
    res.destroy();
    throw new PublicFetchError("wrong-type");
  }
  if (Number(res.headers["content-length"]) > options.maxBytes) {
    res.destroy();
    throw new PublicFetchError("too-large");
  }
  return { contentType, body: await readLimitedBody(res, options.maxBytes) };
}

/**
 * Rejects links that aren't https. IP literals skip the DNS lookup, so private ones are rejected
 * here.
 */
function checkedUrl(link: string): URL {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    throw new PublicFetchError("invalid-url");
  }
  if (url.protocol !== "https:") throw new PublicFetchError("not-https");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host) && !isPublicAddress(host)) throw new PublicFetchError("not-public");
  return url;
}

/** Connects through `publicOnlyLookup`, so only public addresses are reached. */
function openResponse(
  url: URL,
  { accept, signal = new AbortController().signal }: PublicFetchOptions,
): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const req = request(
      url,
      { lookup: publicOnlyLookup, signal, headers: { accept, "user-agent": USER_AGENT } },
      resolve,
    );
    req.on("error", (error: NodeJS.ErrnoException) => reject(toFetchError(error)));
    req.end();
  });
}

function redirectTarget(location: string, from: URL, redirectsLeft: number): string {
  if (redirectsLeft === 0) throw new PublicFetchError("too-many-redirects");
  let next: URL;
  try {
    next = new URL(location, from);
  } catch {
    throw new PublicFetchError("invalid-redirect");
  }
  if (next.protocol !== "https:") throw new PublicFetchError("insecure-redirect");
  return next.href;
}

/** Stops as soon as the body passes `maxBytes`, whatever Content-Length said. */
function readLimitedBody(res: IncomingMessage, maxBytes: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    res.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBytes) {
        res.destroy();
        reject(new PublicFetchError("too-large"));
        return;
      }
      chunks.push(chunk);
    });
    res.on("end", () => resolve(Buffer.concat(chunks)));
    res.on("error", (error: NodeJS.ErrnoException) => reject(toFetchError(error)));
  });
}
