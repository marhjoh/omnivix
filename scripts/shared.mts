// Settings the scripts share.
import { SITE_LINKS } from "@/src/lib/site";
import { encodeAiUsage, USAGE_DAYS, usageStart } from "@/src/banner/aiUsage";

/** The running app. Defaults to `pnpm dev` unless BASE_URL is set. */
export const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

/** The GitHub user whose banners the scripts render. */
export const USERNAME = SITE_LINKS.maintainerHandle;

/** A laptop screen, for full-page captures. */
export const DESKTOP_VIEWPORT = { width: 1440, height: 900 } as const;

/** "123 KB", for the sizes the scripts log. */
export function kb(bytes: number): string {
  return `${Math.round(bytes / 1024)} KB`;
}

/**
 * Made-up usage for the AI usage banner's screenshots, because ccusage only reads the logs on the
 * machine it runs on. It's busier toward the end and quieter on weekends.
 */
export function demoAiUsage(): string {
  const end = "2026-11-07";
  let seed = 42;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const startWeekday = new Date(`${usageStart(end)}T00:00:00Z`).getUTCDay();
  const levels = Array.from({ length: USAGE_DAYS }, (_, day) => {
    const progress = day / USAGE_DAYS;
    const weekend = [0, 6].includes((startWeekday + day) % 7);
    if (random() > (0.2 + 0.75 * progress) * (weekend ? 0.4 : 1)) return 0;
    return Math.min(4, 1 + Math.floor(random() * 4 * (0.4 + progress)));
  }).join("");
  return encodeAiUsage({
    end,
    levels,
    tokens: 1_284_000_000,
    cost: 2914,
    models: [
      { name: "Opus 5.5", percent: 52 },
      { name: "Sonnet 5.5", percent: 30 },
      { name: "GPT-5", percent: 14 },
      { name: "Other", percent: 4 },
    ],
    agents: [
      { name: "Claude Code", percent: 82 },
      { name: "Codex", percent: 18 },
    ],
  });
}
