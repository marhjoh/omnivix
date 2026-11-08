import { describe, expect, it } from "vitest";
import { USAGE_DAYS } from "./aiUsage";
import { agentName, modelName, readCcusage } from "./ccusage";

function breakdown(modelName: string, inputTokens: number, outputTokens: number) {
  return { modelName, inputTokens, outputTokens, cacheCreationTokens: 0, cacheReadTokens: 0 };
}

/** A row like `ccusage daily --json --by-agent` writes. */
function row(period: string, claudeTokens: number, codexTokens: number, cost?: number) {
  return {
    period,
    agent: "all",
    agents: [
      { agent: "claude", totalTokens: claudeTokens },
      { agent: "codex", totalTokens: codexTokens },
    ],
    modelBreakdowns: [
      breakdown("claude-sonnet-4-5-20250929", claudeTokens / 2, claudeTokens / 2),
      breakdown("gpt-5", codexTokens, 0),
    ],
    totalTokens: claudeTokens + codexTokens,
    ...(cost !== undefined && { totalCost: cost }),
  };
}

function read(json: unknown) {
  const result = readCcusage(JSON.stringify(json));
  if (!result.ok) throw new Error(result.message);
  return result.usage;
}

describe("readCcusage", () => {
  it("reads daily rows with agents", () => {
    const usage = read({
      daily: [row("2026-11-05", 600, 200, 1.4), row("2026-11-07", 150, 50, 0.8)],
      totals: {},
    });
    expect(usage).toMatchObject({
      end: "2026-11-07",
      tokens: 1000,
      cost: 2,
      models: [
        { name: "Sonnet 4.5", percent: 75 },
        { name: "GPT-5", percent: 25 },
      ],
      agents: [
        { name: "Claude Code", percent: 75 },
        { name: "Codex", percent: 25 },
      ],
    });
    expect(usage.levels).toHaveLength(USAGE_DAYS);
    // The busier of two days is in the top quarter.
    expect(usage.levels.slice(-3)).toBe("401");
  });

  it("reads the JSON after npx's install prompt", () => {
    const output = JSON.stringify({ daily: [row("2026-11-07", 10, 0, 1)] }, null, 2);
    const prompt = "Need to install the following packages:\nccusage@20.0.48\nOk to proceed? (y) ";
    const result = readCcusage(prompt + output);
    expect(result.ok && result.usage.tokens).toBe(10);
  });

  it("has no cost for output made with --no-cost", () => {
    expect(read({ daily: [row("2026-11-07", 10, 0)] }).cost).toBeNull();
  });

  it("keeps only the last 365 days", () => {
    const usage = read({ daily: [row("2025-11-07", 500, 0, 9), row("2026-11-07", 10, 0, 1)] });
    expect(usage).toMatchObject({ tokens: 10, cost: 1 });
    expect(usage.levels.replaceAll("0", "")).toBe("1");
  });

  it("reads older output with dates, costUSD and a breakdown map", () => {
    const usage = read({
      type: "daily",
      data: [
        {
          date: "2026-05-16",
          totalTokens: 300,
          costUSD: 17.58,
          breakdown: { "claude-opus-4-1-20250805": { totalTokens: 300 } },
        },
      ],
    });
    expect(usage).toMatchObject({
      end: "2026-05-16",
      tokens: 300,
      cost: 18,
      models: [{ name: "Opus 4.1", percent: 100 }],
      agents: [],
    });
  });

  it("adds up the projects of --instances output", () => {
    const usage = read({
      projects: { web: [row("2026-11-07", 100, 0, 1)], api: [row("2026-11-07", 300, 0, 2)] },
    });
    expect(usage).toMatchObject({ tokens: 400, cost: 3 });
  });

  it("adds models past the fifth to Other", () => {
    const models = ["a", "b", "c", "d", "e", "f"].map((name, i) =>
      breakdown(`model-${name}`, 60 - i * 10, 0),
    );
    const usage = read({
      daily: [{ date: "2026-11-07", totalTokens: 210, modelBreakdowns: models }],
    });
    expect(usage.models.map(({ name }) => name)).toEqual([
      "Model A",
      "Model B",
      "Model C",
      "Model D",
      "Other",
    ]);
  });

  it.each([
    ["text that isn't JSON", "ccusage v18", "This isn't JSON."],
    ["a monthly report", JSON.stringify({ monthly: [{ period: "2026-11" }] }), "No daily usage"],
    [
      "output without tokens",
      JSON.stringify({ daily: [{ date: "2026-11-07", totalTokens: 0 }] }),
      "no token usage",
    ],
  ])("explains %s", (_, text, message) => {
    const result = readCcusage(text);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.message).toContain(message);
  });
});

describe("modelName", () => {
  it.each([
    ["claude-sonnet-4-5-20250929", "Sonnet 4.5"],
    ["claude-3-5-haiku-20241022", "Haiku 3.5"],
    ["claude-opus-4-1", "Opus 4.1"],
    ["gpt-5", "GPT-5"],
    ["gpt-5-codex", "GPT-5 Codex"],
    ["gpt-4.1-mini", "GPT-4.1 Mini"],
    ["openrouter/google/gemini-2.5-pro", "Gemini 2.5 Pro"],
    ["o3", "o3"],
    ["<synthetic>", "synthetic"],
  ])("names %s %s", (id, name) => {
    expect(modelName(id)).toBe(name);
  });
});

describe("agentName", () => {
  it("names known agents and capitalizes others", () => {
    expect(agentName("copilot")).toBe("Copilot CLI");
    expect(agentName("newagent")).toBe("Newagent");
  });
});
