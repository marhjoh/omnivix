import { createHash } from "node:crypto";
import { Ratelimit, type RatelimitConfig } from "@upstash/ratelimit";
import { redisFromEnv, redisNamespace } from "@/src/lib/redis";

// Omnivix's own limits, counted in Upstash Redis so every server instance shares them. The
// export's burst limit is a Vercel Firewall rule instead (see docs/deployment.md).

const DEFAULT_DAILY_EXPORTS = 25;

/** After this, a slow store is skipped and the request goes through. */
const CHECK_TIMEOUT_MS = 1000;

/**
 * Loading a user takes up to three requests, and switching the year one more. CDN hits don't count.
 */
export const githubDataLimit = perIp(
  requestLimit("github-data", Ratelimit.slidingWindow(60, "10 m")),
);

/**
 * Counted per UTC day, so it resets at midnight UTC. Copy counts too, because it uses the same
 * route.
 */
export const dailyExportLimit = perIp(
  requestLimit("daily-exports", Ratelimit.fixedWindow(dailyExports(), "1 d")),
);

/**
 * Counts image URL renders per UTC day. The key is the banner (see `bannerImageRoute`), not the IP.
 * README images come through GitHub's image proxy, and all viewers share its few addresses. CDN
 * hits never reach the route, so only fresh renders count.
 */
export const bannerImageLimit = requestLimit("banner-images", Ratelimit.fixedWindow(30, "1 d"));

function dailyExports(): number {
  const configured = Number(process.env.EXPORT_DAILY_LIMIT);
  return Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_DAILY_EXPORTS;
}

/**
 * Returns when a refused request may try again, or null when it may go ahead.
 *
 * Without a store (local and self-hosted runs) there's no limit. A failing or slow store also lets
 * requests through. The limits protect quotas and aren't access control.
 */
function requestLimit(prefix: string, algorithm: RatelimitConfig["limiter"]) {
  let limiter: Ratelimit | null | undefined;

  return async function limitedUntil(key: string): Promise<Date | null> {
    if (limiter === undefined) limiter = createLimiter(prefix, algorithm);
    if (!limiter) return null;
    try {
      const { success, reset } = await limiter.limit(key);
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
  return new Ratelimit({
    redis,
    prefix: `${redisNamespace()}:${prefix}`,
    limiter: algorithm,
    timeout: CHECK_TIMEOUT_MS,
  });
}

/**
 * Counts a limit per IP. IPs are stored hashed, and only for the window. Vercel sets `x-real-ip`,
 * and visitors can't fake it.
 */
function perIp(limitedUntil: (key: string) => Promise<Date | null>) {
  return (request: Request) =>
    limitedUntil(
      createHash("sha256")
        .update(request.headers.get("x-real-ip") ?? "unknown")
        .digest("hex"),
    );
}
