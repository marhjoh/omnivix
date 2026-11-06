import { afterEach, describe, expect, it, vi } from "vitest";

const { commands, results, after } = vi.hoisted(() => ({
  commands: [] as unknown[][],
  results: { value: [] as unknown[] },
  after: vi.fn(),
}));

vi.mock("next/server", () => ({ after }));

vi.mock("@upstash/redis", () => ({
  Redis: class {
    pipeline() {
      const pipeline = {
        hincrby: (...args: unknown[]) => (commands.push(["hincrby", ...args]), pipeline),
        expire: (...args: unknown[]) => (commands.push(["expire", ...args]), pipeline),
        pfadd: (...args: unknown[]) => (commands.push(["pfadd", ...args]), pipeline),
        hgetall: (...args: unknown[]) => (commands.push(["hgetall", ...args]), pipeline),
        pfcount: (...args: unknown[]) => (commands.push(["pfcount", ...args]), pipeline),
        exec: async () => results.value,
      };
      return pipeline;
    }
  },
}));

const { countStats, readStats, sumStats } = await import("./stats");

function connectStore() {
  vi.stubEnv("KV_REST_API_URL", "https://example.upstash.io");
  vi.stubEnv("KV_REST_API_TOKEN", "token");
  vi.stubEnv("VERCEL_ENV", "production");
}

afterEach(() => {
  vi.unstubAllEnvs();
  commands.length = 0;
  after.mockReset();
});

describe("countStats", () => {
  it("counts nothing without a store", () => {
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    countStats(["exports"]);
    expect(after).not.toHaveBeenCalled();
  });

  it("adds one to each field in today's hash after the response", async () => {
    connectStore();
    vi.useFakeTimers({ now: new Date("2026-11-05T23:59:00Z") });
    countStats(["exports", "exports:size:wide"]);
    expect(commands).toEqual([]);
    await after.mock.calls[0][0]();
    vi.useRealTimers();
    const key = "omnivix:production:stats:2026-11-05";
    expect(commands).toEqual([
      ["hincrby", key, "exports", 1],
      ["hincrby", key, "exports:size:wide", 1],
      ["expire", key, 800 * 24 * 60 * 60],
    ]);
  });

  it("adds a visitor to today's unique visitors", async () => {
    connectStore();
    vi.useFakeTimers({ now: new Date("2026-11-05T12:00:00Z") });
    countStats(["views"], { id: "visitor-id", steps: ["site", "studio"] });
    await after.mock.calls[0][0]();
    vi.useRealTimers();
    expect(commands.filter(([command]) => command === "pfadd")).toEqual([
      ["pfadd", "omnivix:production:visitors:site:2026-11-05", "visitor-id"],
      ["pfadd", "omnivix:production:visitors:studio:2026-11-05", "visitor-id"],
    ]);
  });
});

describe("readStats", () => {
  it("reads each day, oldest first, with its measurements and unique visitors", async () => {
    connectStore();
    results.value = [
      ...[{ exports: 2 }, null, 4, 2, 1],
      ...[null, null, 0, 0, 0],
      ...[{ exports: "3", limits: 1 }, { "quality:coverage": "87.5" }, 1, 0, 0],
    ];
    const days = await readStats(3, Date.parse("2026-11-05T08:00:00Z"));
    expect(commands.filter(([command]) => command === "hgetall").map(([, key]) => key)).toEqual([
      "omnivix:production:stats:2026-11-03",
      "omnivix:production:quality:2026-11-03",
      "omnivix:production:stats:2026-11-04",
      "omnivix:production:quality:2026-11-04",
      "omnivix:production:stats:2026-11-05",
      "omnivix:production:quality:2026-11-05",
    ]);
    expect(days).toEqual([
      {
        day: "2026-11-03",
        counts: { exports: 2, "visitors:site": 4, "visitors:studio": 2, "visitors:export": 1 },
      },
      {
        day: "2026-11-04",
        counts: { "visitors:site": 0, "visitors:studio": 0, "visitors:export": 0 },
      },
      {
        day: "2026-11-05",
        counts: {
          exports: 3,
          limits: 1,
          "quality:coverage": 87.5,
          "visitors:site": 1,
          "visitors:studio": 0,
          "visitors:export": 0,
        },
      },
    ]);
    expect(sumStats(days!)).toMatchObject({
      exports: 5,
      limits: 1,
      "visitors:site": 5,
      "visitors:studio": 2,
      "visitors:export": 1,
    });
  });
});
