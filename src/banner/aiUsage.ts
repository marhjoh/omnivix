import type { ContributionsNormalized, ContributionWeekNormalized } from "@/src/github/types";

/** The AI usage banner covers this many days, ending on the last day of the paste. */
export const USAGE_DAYS = 365;

/** Shares after this many are added up as "Other". */
export const MAX_SHARES = 5;

const NAME_MAX_LENGTH = 24;

const DAY_MS = 86_400_000;

export interface UsageShare {
  name: string;
  /** Whole percent of the tokens. */
  percent: number;
}

/** What the AI usage banner draws. The raw ccusage output isn't kept. */
export interface AiUsage {
  /** The last day (YYYY-MM-DD). */
  end: string;
  /** One digit per day from 0 (no usage) to 4, oldest first, like the contribution grid's levels. */
  levels: string;
  tokens: number;
  /** Whole US dollars. Null when the output has no cost (`ccusage --no-cost`). */
  cost: number | null;
  /** Largest first. */
  models: UsageShare[];
  /** Largest first. Empty when the output doesn't say which agent was used. */
  agents: UsageShare[];
}

/** Letters, digits, spaces, dots and dashes, so a name can't break the encoding. */
const NAME = new RegExp(`^[A-Za-z0-9][A-Za-z0-9 .-]{0,${NAME_MAX_LENGTH - 1}}$`);
const LEVELS = new RegExp(`^[0-4]{${USAGE_DAYS}}$`);
const WHOLE_NUMBER = /^(0|[1-9]\d{0,15})$/;

/** Makes a name safe for the encoding. Other characters become spaces, and long names are cut. */
export function cleanName(name: string): string {
  return name
    .replace(/[^A-Za-z0-9 .-]+/g, " ")
    .replace(/^[^A-Za-z0-9]+/, "")
    .replace(/\s+/g, " ")
    .slice(0, NAME_MAX_LENGTH)
    .trim();
}

export function isYmd(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && toYmd(utcMs(value)) === value;
}

function utcMs(ymd: string): number {
  const [year, month, day] = ymd.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function toYmd(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** The first day the banner covers. */
export function usageStart(end: string): string {
  return toYmd(utcMs(end) - (USAGE_DAYS - 1) * DAY_MS);
}

/**
 * The `usage` setting: fields joined by `/`, and shares as `name:percent` joined by `,`. It's short
 * and stays readable in a studio link, e.g. `2026-11-07/0012…/1284000000/2914/Opus 5.5:52,…/…`.
 */
export function encodeAiUsage(usage: AiUsage): string {
  const shares = (list: UsageShare[]) =>
    list.map(({ name, percent }) => `${name}:${percent}`).join(",");
  return [
    usage.end,
    usage.levels,
    usage.tokens,
    usage.cost ?? "-",
    shares(usage.models),
    shares(usage.agents),
  ].join("/");
}

function decodeShares(text: string): UsageShare[] | null {
  if (text === "") return [];
  const shares = text.split(",").map((part) => {
    const [name, percent, extra] = part.split(":");
    const valid = extra === undefined && NAME.test(name) && WHOLE_NUMBER.test(percent);
    return valid && Number(percent) <= 100 ? { name, percent: Number(percent) } : null;
  });
  if (shares.length > MAX_SHARES || shares.includes(null)) return null;
  return shares as UsageShare[];
}

/** Reads the `usage` setting. Null when it isn't one `encodeAiUsage` could have written. */
export function decodeAiUsage(text: string): AiUsage | null {
  const [end, levels, tokens, cost, models, agents, extra] = text.split("/");
  if (extra !== undefined || agents === undefined) return null;
  if (!isYmd(end) || !LEVELS.test(levels) || !WHOLE_NUMBER.test(tokens)) return null;
  if (cost !== "-" && !WHOLE_NUMBER.test(cost)) return null;
  const modelShares = decodeShares(models);
  const agentShares = decodeShares(agents);
  if (!modelShares || !agentShares) return null;
  return {
    end,
    levels,
    tokens: Number(tokens),
    cost: cost === "-" ? null : Number(cost),
    models: modelShares,
    agents: agentShares,
  };
}

export function isAiUsage(text: string): boolean {
  return decodeAiUsage(text) !== null;
}

export function activeDays({ levels }: AiUsage): number {
  return levels.replaceAll("0", "").length;
}

/**
 * The days as a contribution calendar, so the banner can use the contribution grid and streaks.
 * A day's count is its level.
 */
export function usageCalendar(usage: AiUsage): ContributionsNormalized {
  const startMs = utcMs(usageStart(usage.end));
  const weeks: ContributionWeekNormalized[] = [];
  for (let i = 0; i < USAGE_DAYS; i++) {
    const ms = startMs + i * DAY_MS;
    const date = toYmd(ms);
    const weekday = new Date(ms).getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    if (weekday === 0 || weeks.length === 0) weeks.push({ firstDay: date, days: [] });
    const level = Number(usage.levels[i]) as 0 | 1 | 2 | 3 | 4;
    weeks.at(-1)!.days.push({ date, count: level, level, weekday });
  }
  const months = [];
  const start = new Date(startMs);
  // Date.UTC rolls month 12 over into the next year.
  for (let i = 0; ; i++) {
    const month = Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1);
    if (month > utcMs(usage.end)) break;
    months.push({
      firstDay: toYmd(Math.max(month, startMs)),
      name: new Date(month).toLocaleString("en-US", { month: "long", timeZone: "UTC" }),
    });
  }
  return { total: activeDays(usage), weeks, months, rangeEndYmd: usage.end };
}
