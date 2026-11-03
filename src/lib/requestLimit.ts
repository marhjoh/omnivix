import { createHash } from "node:crypto";
import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/** A slow store shouldn't hold up the request; past this, it's let through. */
const CHECK_TIMEOUT_MS = 1000;

/** The Vercel Marketplace store sets the KV_ names; Upstash's own setup the UPSTASH_ ones. */
function redisFromEnv(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? new Redis({ url, token }) : null;
}

/** IPs are stored hashed, and only for the window. Vercel sets `x-real-ip`; visitors can't. */
function clientKey(request: Request): string {
  const ip = request.headers.get("x-real-ip") ?? "unknown";
  return createHash("sha256").update(ip).digest("hex");
}

function createLimiter(prefix: string, requests: number, window: Duration): Ratelimit | null {
  const redis = redisFromEnv();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    prefix: `omnivix:${prefix}`,
    limiter: Ratelimit.slidingWindow(requests, window),
    timeout: CHECK_TIMEOUT_MS,
  });
}

/**
 * A per-IP limit of `requests` per `window`, counted in Upstash Redis so every server instance
 * shares it. Returns when a refused request may try again, or null when it may go ahead.
 *
 * Without a store (local and self-hosted runs) there's no limit, and a failing or slow store lets
 * requests through: the limit protects quotas, it isn't access control.
 */
export function requestLimit(prefix: string, requests: number, window: Duration) {
  let limiter: Ratelimit | null | undefined;

  return async function limitedUntil(request: Request): Promise<Date | null> {
    limiter ??= createLimiter(prefix, requests, window);
    if (!limiter) return null;
    try {
      const { success, reset } = await limiter.limit(clientKey(request));
      return success ? null : new Date(reset);
    } catch (error) {
      console.error(
        `Rate limit ${prefix} couldn't be checked; letting the request through.`,
        error,
      );
      return null;
    }
  };
}
