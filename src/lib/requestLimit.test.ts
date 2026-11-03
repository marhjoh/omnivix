import { afterEach, describe, expect, it, vi } from "vitest";
import { requestLimit } from "./requestLimit";

const limit = vi.hoisted(() => vi.fn());

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: Object.assign(
    class {
      limit = limit;
    },
    { slidingWindow: () => ({}) },
  ),
}));

const request = new Request("http://localhost/api/github/repos", {
  headers: { "x-real-ip": "203.0.113.7" },
});

describe("requestLimit", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    limit.mockReset();
  });

  function withStore() {
    vi.stubEnv("KV_REST_API_URL", "https://example.upstash.io");
    vi.stubEnv("KV_REST_API_TOKEN", "token");
    return requestLimit("test", 60, "10 m");
  }

  it("has no limit without a store", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("KV_REST_API_URL", "");
    expect(await requestLimit("test", 60, "10 m")(request)).toBeNull();
    expect(limit).not.toHaveBeenCalled();
  });

  it("counts a hash of the IP, never the IP itself", async () => {
    limit.mockResolvedValue({ success: true, reset: 0 });
    await withStore()(request);
    const [key] = limit.mock.calls[0];
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).not.toContain("203.0.113.7");
  });

  it("says when a refused request may try again", async () => {
    const reset = Date.UTC(2026, 9, 18, 12, 10);
    limit.mockResolvedValue({ success: false, reset });
    expect(await withStore()(request)).toEqual(new Date(reset));
  });

  it("lets requests through when the store fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    limit.mockRejectedValue(new Error("down"));
    expect(await withStore()(request)).toBeNull();
    expect(console.error).toHaveBeenCalledTimes(1);
  });
});
