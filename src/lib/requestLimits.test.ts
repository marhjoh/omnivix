import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { limit, fixedWindow, configure } = vi.hoisted(() => ({
  limit: vi.fn(),
  fixedWindow: vi.fn(),
  configure: vi.fn(),
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: Object.assign(
    class {
      constructor(options: unknown) {
        configure(options);
      }
      limit = limit;
    },
    { slidingWindow: vi.fn(), fixedWindow },
  ),
}));

const request = new Request("http://localhost/api/github/repos", {
  headers: { "x-real-ip": "203.0.113.7" },
});

/** A fresh module, since the limits read their settings and store once. */
async function load({ store = true, dailyLimit }: { store?: boolean; dailyLimit?: string } = {}) {
  vi.resetModules();
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("KV_REST_API_URL", store ? "https://example.upstash.io" : "");
  vi.stubEnv("KV_REST_API_TOKEN", store ? "token" : "");
  if (dailyLimit !== undefined) vi.stubEnv("EXPORT_DAILY_LIMIT", dailyLimit);
  return import("./requestLimits");
}

beforeEach(() => {
  vi.stubEnv("EXPORT_DAILY_LIMIT", "");
  vi.stubEnv("VERCEL_ENV", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  limit.mockReset();
  fixedWindow.mockReset();
  configure.mockReset();
});

describe("request limits", () => {
  it.each([
    ["production", "omnivix:production"],
    ["preview", "omnivix:preview"],
    ["development", "omnivix:development"],
    ["", "omnivix:development"],
  ])(
    "isolate both limits for environment '%s' with namespace '%s'",
    async (environment, namespace) => {
      vi.stubEnv("VERCEL_ENV", environment);
      limit.mockResolvedValue({ success: true, reset: 0 });
      const { githubDataLimit, dailyExportLimit } = await load();
      await githubDataLimit(request);
      await dailyExportLimit(request);
      expect(configure.mock.calls.map(([options]) => options.prefix)).toEqual([
        `${namespace}:github-data`,
        `${namespace}:daily-exports`,
      ]);
    },
  );

  it("have no limit without a store", async () => {
    const { githubDataLimit } = await load({ store: false });
    expect(await githubDataLimit(request)).toBeNull();
    expect(limit).not.toHaveBeenCalled();
  });

  it("count a hash of the IP, never the IP itself", async () => {
    limit.mockResolvedValue({ success: true, reset: 0 });
    const { githubDataLimit } = await load();
    await githubDataLimit(request);
    const [key] = limit.mock.calls[0];
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).not.toContain("203.0.113.7");
  });

  it("count image URL renders by the caller's key, 30 a day", async () => {
    limit.mockResolvedValue({ success: true, reset: 0 });
    const { bannerImageLimit } = await load();
    expect(await bannerImageLimit("user:octocat")).toBeNull();
    expect(limit).toHaveBeenCalledWith("user:octocat");
    expect(fixedWindow).toHaveBeenCalledWith(30, "1 d");
    expect(configure.mock.lastCall?.[0].prefix).toBe("omnivix:development:banner-images");
  });

  it("say when a refused request may try again", async () => {
    const reset = Date.UTC(2026, 9, 19);
    limit.mockResolvedValue({ success: false, reset });
    const { dailyExportLimit } = await load();
    expect(await dailyExportLimit(request)).toEqual(new Date(reset));
  });

  it("let requests through when the store fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    limit.mockRejectedValue(new Error("down"));
    const { githubDataLimit } = await load();
    expect(await githubDataLimit(request)).toBeNull();
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it.each([
    [undefined, 25],
    ["40", 40],
    ["0", 25],
    ["many", 25],
  ])("allow EXPORT_DAILY_LIMIT=%s exports a day as %i", async (dailyLimit, expected) => {
    await load({ dailyLimit });
    expect(fixedWindow).toHaveBeenCalledWith(expected, "1 d");
  });
});
