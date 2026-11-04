import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { Ratelimit, type RatelimitConfig } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { TimedLimit } from "@/src/lib/apiError";
import { LIMIT_TITLES } from "@/src/lib/rateLimitMessage";

// Omnivix's own per-IP limits, counted in Upstash Redis so every server instance shares them.
// The export's burst limit is a Vercel Firewall rule instead (see docs/deployment.md).

const DEFAULT_DAILY_EXPORTS = 25;

/** A slow store shouldn't hold up the request; past this, it's let through. */
const CHECK_TIMEOUT_MS = 1000;

/** Loading a user takes up to three requests and switching year one more; CDN hits don't count. */
export const githubDataLimit = requestLimit("github-data", Ratelimit.slidingWindow(60, "10 m"));

/** Counted per UTC day, so it resets at midnight UTC. Copy counts too: it's the same route. */
export const dailyExportLimit = requestLimit(
  "daily-exports",
  Ratelimit.fixedWindow(dailyExports(), "1 d"),
);

function dailyExports(): number {
  const configured = Number(process.env.EXPORT_DAILY_LIMIT);
  return Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_DAILY_EXPORTS;
}

/**
 * Returns when a refused request may try again, or null when it may go ahead.
 *
 * Without a store (local and self-hosted runs) there's no limit, and a failing or slow store lets
 * requests through: the limits protect quotas, they aren't access control.
 */
function requestLimit(prefix: string, algorithm: RatelimitConfig["limiter"]) {
  let limiter: Ratelimit | null | undefined;

  return async function limitedUntil(request: Request): Promise<Date | null> {
    if (limiter === undefined) limiter = createLimiter(prefix, algorithm);
    if (!limiter) return null;
    try {
      const { success, reset } = await limiter.limit(clientKey(request));
      return success ? null : new Date(reset);
    } catch (error) {
      console.error(`Limit ${prefix} couldn't be checked; letting the request through.`, error);
      return null;
    }
  };
}

function createLimiter(prefix: string, algorithm: RatelimitConfig["limiter"]): Ratelimit | null {
  const redis = redisFromEnv();
  if (!redis) return null;
  const environment = process.env.VERCEL_ENV || "development";
  // Keep existing production counters; previews and local runs use separate namespaces.
  const namespace = environment === "production" ? "omnivix" : `omnivix:${environment}`;
  return new Ratelimit({
    redis,
    prefix: `${namespace}:${prefix}`,
    limiter: algorithm,
    timeout: CHECK_TIMEOUT_MS,
  });
}

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

/** A limit's 429: `limit` names it and `resetAt` says when to try again, in the visitor's time. */
export function tooManyRequests(limit: TimedLimit, resetAt: Date) {
  const seconds = Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000));
  return NextResponse.json(
    { error: `${LIMIT_TITLES[limit]}.`, limit, resetAt: resetAt.toISOString() },
    { status: 429, headers: { "Retry-After": String(seconds) } },
  );
}
