import "server-only";
import { createHash } from "node:crypto";
import { after } from "next/server";
import { redisFromEnv, redisNamespace } from "@/src/lib/redis";
import { KEEP_SECONDS, qualityKey, utcDay } from "@/src/stats/quality";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Unique visitors are counted per day for each step: anyone on the site, those who opened the
 * studio, and those who downloaded or copied a banner. `readStats` adds them as `visitors:<step>`.
 */
const VISITOR_STEPS = ["site", "studio", "export"] as const;

export type VisitorStep = (typeof VISITOR_STEPS)[number];

export function visitorsField(step: VisitorStep): string {
  return `visitors:${step}`;
}

/** A day's counters, by UTC date (`2026-11-05`). */
export type DailyStats = { day: string; counts: Record<string, number> };

function dayKey(day: string): string {
  return `${redisNamespace()}:stats:${day}`;
}

/** A HyperLogLog, which keeps an estimate of the count and not the visitors. */
function visitorsKey(step: VisitorStep, day: string): string {
  return `${redisNamespace()}:visitors:${step}:${day}`;
}

/**
 * The same visitor gets the same id all day, and a new one the next day, like Plausible
 * (https://plausible.io/data-policy#how-we-count-unique-users-without-cookies). It only feeds the
 * HyperLogLogs and is never stored.
 */
export function visitorId(request: Request): string {
  return createHash("sha256")
    .update(utcDay(Date.now()))
    .update(request.headers.get("x-real-ip") ?? "")
    .update(request.headers.get("user-agent") ?? "")
    .digest("base64url");
}

/**
 * Adds one to each field in today's counters, after the response is sent. A `visitor` also counts
 * toward today's unique visitors for the given steps. Without a store nothing is counted, and a
 * failing store is only logged.
 */
export function countStats(fields: string[], visitor?: { id: string; steps: VisitorStep[] }): void {
  const redis = redisFromEnv();
  if (!redis) return;
  after(async () => {
    const day = utcDay(Date.now());
    const pipeline = redis.pipeline();
    for (const field of fields) pipeline.hincrby(dayKey(day), field, 1);
    pipeline.expire(dayKey(day), KEEP_SECONDS);
    if (visitor) {
      for (const step of visitor.steps) {
        pipeline.pfadd(visitorsKey(step, day), visitor.id);
        pipeline.expire(visitorsKey(step, day), KEEP_SECONDS);
      }
    }
    try {
      await pipeline.exec();
    } catch (error) {
      console.error("Stats couldn't be counted.", error);
    }
  });
}

/**
 * The last `days` days of counters and measurements, oldest first and today last. Null without a
 * store.
 */
export async function readStats(days: number, now = Date.now()): Promise<DailyStats[] | null> {
  const redis = redisFromEnv();
  if (!redis) return null;
  const dayList = Array.from({ length: days }, (_, index) =>
    utcDay(now - (days - 1 - index) * DAY_MS),
  );
  const pipeline = redis.pipeline();
  for (const day of dayList) {
    pipeline.hgetall<Record<string, number>>(dayKey(day));
    pipeline.hgetall<Record<string, number>>(qualityKey(day));
    for (const step of VISITOR_STEPS) pipeline.pfcount(visitorsKey(step, day));
  }
  const results = await pipeline.exec<unknown[]>();
  const perDay = 2 + VISITOR_STEPS.length;
  return dayList.map((day, index) => {
    const [hash, quality, ...visitors] = results.slice(index * perDay, (index + 1) * perDay);
    const counts = {
      ...numbers(hash as Record<string, unknown> | null),
      ...numbers(quality as Record<string, unknown> | null),
    };
    VISITOR_STEPS.forEach((step, stepIndex) => {
      counts[visitorsField(step)] = Number(visitors[stepIndex]);
    });
    return { day, counts };
  });
}

function numbers(hash: Record<string, unknown> | null): Record<string, number> {
  return Object.fromEntries(
    Object.entries(hash ?? {}).map(([field, value]) => [field, Number(value) || 0]),
  );
}

export function sumStats(days: DailyStats[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const { counts } of days) {
    for (const [field, count] of Object.entries(counts)) {
      totals[field] = (totals[field] ?? 0) + count;
    }
  }
  return totals;
}
