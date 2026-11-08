import {
  cleanName,
  isYmd,
  MAX_SHARES,
  USAGE_DAYS,
  usageStart,
  type AiUsage,
  type UsageShare,
} from "@/src/banner/aiUsage";

// Reads pasted `ccusage daily --json` output. This runs in the browser, where Effect is off limits,
// so the JSON is checked by hand. Field names differ between ccusage versions, and each reader
// accepts the ones in https://github.com/ryoppippi/ccusage/blob/main/docs/guide/json-output.md.

/** `-y` stops npx from asking to install ccusage, which would land in the copied output. */
export const CCUSAGE_COMMAND = "npx -y ccusage@latest daily --json --by-agent";

const NOT_DAILY = "Paste the output of ccusage daily --json.";

/** Agent ids from ccusage's README. Others get a capital letter. */
const AGENT_NAMES: Record<string, string> = {
  claude: "Claude Code",
  codex: "Codex",
  opencode: "OpenCode",
  amp: "Amp",
  droid: "Droid",
  codebuff: "Codebuff",
  hermes: "Hermes Agent",
  pi: "pi-agent",
  goose: "Goose",
  openclaw: "OpenClaw",
  kilo: "Kilo",
  kimi: "Kimi",
  qwen: "Qwen",
  copilot: "Copilot CLI",
  gemini: "Gemini CLI",
  antigravity: "Antigravity",
  grok: "Grok Build CLI",
  zcode: "ZCode",
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A count ccusage wrote, or undefined when it's missing or not a count. */
function count(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function tokensOf(entry: JsonRecord): number {
  return (
    count(entry.totalTokens) ??
    ["inputTokens", "outputTokens", "cacheCreationTokens", "cacheReadTokens"].reduce(
      (sum, key) => sum + (count(entry[key]) ?? 0),
      0,
    )
  );
}

function capitalize(word: string): string {
  return /^[a-z]+$/.test(word) ? word[0].toUpperCase() + word.slice(1) : word;
}

/**
 * A short model name: "claude-sonnet-4-5-20250929" is "Sonnet 4.5", "gpt-5-codex" is
 * "GPT-5 Codex" and "gemini-2.5-pro" is "Gemini 2.5 Pro".
 */
export function modelName(id: string): string {
  const base = (id.split("/").pop() ?? id).replace(/-(\d{8}|\d{4}-\d{2}-\d{2})$/, "");
  const [first = "", ...rest] = base.split("-").filter(Boolean);
  if (first.toLowerCase() === "claude") {
    const words = rest.filter((part) => !/^\d+$/.test(part)).map(capitalize);
    const version = rest.filter((part) => /^\d+$/.test(part)).join(".");
    return cleanName([...words, version].join(" "));
  }
  if (first.toLowerCase() === "gpt" && rest.length > 0) {
    return cleanName([`GPT-${rest[0]}`, ...rest.slice(1).map(capitalize)].join(" "));
  }
  return cleanName([first, ...rest].map(capitalize).join(" "));
}

export function agentName(id: string): string {
  return AGENT_NAMES[id] ?? cleanName(capitalize(id));
}

interface Day {
  date: string;
  tokens: number;
  cost: number | undefined;
  models: Map<string, number>;
  agents: Map<string, number>;
}

function add(totals: Map<string, number>, name: string, tokens: number) {
  if (name && tokens > 0) totals.set(name, (totals.get(name) ?? 0) + tokens);
}

/** The daily rows: `daily` in current versions, `data` in older ones, per project with --instances. */
function dailyRows(json: JsonRecord): unknown[] {
  if (Array.isArray(json.daily)) return json.daily;
  if (Array.isArray(json.data)) return json.data;
  if (isRecord(json.projects)) {
    return Object.values(json.projects).flatMap((rows) => (Array.isArray(rows) ? rows : []));
  }
  return [];
}

function readDay(row: unknown): Day | null {
  if (!isRecord(row)) return null;
  const date = typeof row.date === "string" ? row.date : row.period;
  if (typeof date !== "string" || !isYmd(date)) return null;

  const models = new Map<string, number>();
  if (Array.isArray(row.modelBreakdowns)) {
    for (const entry of row.modelBreakdowns) {
      if (isRecord(entry) && typeof entry.modelName === "string") {
        add(models, modelName(entry.modelName), tokensOf(entry));
      }
    }
  } else if (isRecord(row.breakdown)) {
    for (const [id, entry] of Object.entries(row.breakdown)) {
      if (isRecord(entry)) add(models, modelName(id), tokensOf(entry));
    }
  }

  const agents = new Map<string, number>();
  if (Array.isArray(row.agents)) {
    for (const entry of row.agents) {
      if (isRecord(entry) && typeof entry.agent === "string") {
        add(agents, agentName(entry.agent), tokensOf(entry));
      }
    }
  } else if (typeof row.agent === "string" && row.agent !== "all") {
    add(agents, agentName(row.agent), tokensOf(row));
  }

  return {
    date,
    tokens: tokensOf(row),
    cost: count(row.totalCost) ?? count(row.costUSD),
    models,
    agents,
  };
}

/** Largest first, in whole percent. Past MAX_SHARES the rest are "Other", and 0% shares are left out. */
function shares(totals: Map<string, number>): UsageShare[] {
  const sum = [...totals.values()].reduce((a, b) => a + b, 0);
  const sorted = [...totals].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const top =
    sorted.length <= MAX_SHARES
      ? sorted
      : [
          ...sorted.slice(0, MAX_SHARES - 1),
          ["Other", sorted.slice(MAX_SHARES - 1).reduce((a, [, tokens]) => a + tokens, 0)] as const,
        ];
  return top
    .map(([name, tokens]) => ({ name, percent: Math.round((tokens / sum) * 100) }))
    .filter(({ percent }) => percent > 0);
}

/** Levels 1–4 split the days with usage into quarters, like GitHub's contribution levels. */
function levels(tokensByDay: number[]): string {
  const active = tokensByDay.filter((tokens) => tokens > 0).sort((a, b) => a - b);
  const quartiles = [0.25, 0.5, 0.75].map((q) => active[Math.floor((active.length - 1) * q)]);
  return tokensByDay
    .map((tokens) => (tokens > 0 ? 1 + quartiles.filter((q) => tokens > q).length : 0))
    .join("");
}

export type CcusageResult = { ok: true; usage: AiUsage } | { ok: false; message: string };

/**
 * Reads ccusage's daily JSON into what the banner draws. It keeps the last 365 days, up to the
 * last day in the output.
 */
export function readCcusage(text: string): CcusageResult {
  let json: JsonRecord;
  try {
    // Text around the JSON, such as npx's install prompt, is left out.
    json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  } catch {
    return { ok: false, message: `This isn't JSON. ${NOT_DAILY}` };
  }
  const days = dailyRows(json).flatMap((row) => readDay(row) ?? []);
  if (days.length === 0) return { ok: false, message: `No daily usage found. ${NOT_DAILY}` };

  const end = days
    .map((day) => day.date)
    .sort()
    .at(-1)!;
  const start = usageStart(end);
  const shown = days.filter((day) => day.date >= start);
  const tokens = shown.reduce((sum, day) => sum + day.tokens, 0);
  if (tokens === 0) return { ok: false, message: "This output has no token usage." };

  const tokensByDay = Array<number>(USAGE_DAYS).fill(0);
  const models = new Map<string, number>();
  const agents = new Map<string, number>();
  for (const day of shown) {
    tokensByDay[(Date.parse(day.date) - Date.parse(start)) / 86_400_000] += day.tokens;
    for (const [name, value] of day.models) add(models, name, value);
    for (const [name, value] of day.agents) add(agents, name, value);
  }
  // --no-cost leaves out every cost. If only some days have one, the total would be wrong.
  const hasCost = shown.every((day) => day.cost !== undefined);

  return {
    ok: true,
    usage: {
      end,
      levels: levels(tokensByDay),
      tokens: Math.round(tokens),
      cost: hasCost ? Math.round(shown.reduce((sum, day) => sum + (day.cost ?? 0), 0)) : null,
      models: shares(models),
      agents: shares(agents),
    },
  };
}
