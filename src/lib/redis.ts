import { Redis } from "@upstash/redis";

/**
 * The Vercel Marketplace store sets the KV_ variables. Upstash's own setup sets the UPSTASH_ ones.
 * Without them (local and self-hosted runs) there's no store.
 */
export function redisFromEnv(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? new Redis({ url, token }) : null;
}

/**
 * The prefix for every key. Each environment counts on its own, so previews and local runs never
 * touch production's limits or stats.
 */
export function redisNamespace(): string {
  return `omnivix:${process.env.VERCEL_ENV || "development"}`;
}
