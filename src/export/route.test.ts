import { afterEach, describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import { NextRequest } from "next/server";
import { exportRoute } from "./route";
import { createExportToken } from "./exportToken";

const { dailyExportLimit, captureBanner } = vi.hoisted(() => ({
  dailyExportLimit: vi.fn(async (): Promise<Date | null> => null),
  captureBanner: vi.fn((): Effect.Effect<Buffer> => Effect.succeed(Buffer.from("png"))),
}));

vi.mock("@/src/lib/requestLimits", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/src/lib/requestLimits")>()),
  dailyExportLimit,
}));
vi.mock("@/src/export/playwright", () => ({ captureBanner }));
vi.mock("@/src/export/exportToken", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/src/export/exportToken")>();
  return { ...original, createExportToken: vi.fn(original.createExportToken) };
});

const post = (body: unknown) =>
  exportRoute(
    new NextRequest("http://localhost/api/export", { method: "POST", body: JSON.stringify(body) }),
  );

const banner = { templateId: "quote-banner", size: "wide", state: {} };

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("exportRoute", () => {
  it("refuses an export over the daily quota without rendering it", async () => {
    const resetAt = new Date(Date.now() + 3_600_000);
    dailyExportLimit.mockResolvedValueOnce(resetAt);
    const response = await post(banner);
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: "Daily export limit reached.",
      limit: "daily-exports",
      resetAt: resetAt.toISOString(),
    });
    expect(captureBanner).not.toHaveBeenCalled();
  });

  it("doesn't count an invalid request against the quota", async () => {
    const response = await post({ ...banner, size: "nope" });
    expect(response.status).toBe(400);
    expect(dailyExportLimit).not.toHaveBeenCalled();
  });

  it("gives up on an export that takes longer than its deadline", async () => {
    vi.useFakeTimers();
    captureBanner.mockReturnValueOnce(Effect.never);
    const response = post(banner);
    await vi.advanceTimersByTimeAsync(45_000);
    expect((await response).status).toBe(500);
    expect(await (await response).json()).toEqual({
      error: "Couldn't export the banner. Try again.",
    });
  });

  it("refuses settings too long to export before counting them against the quota", async () => {
    // Each setting has a length limit, so only a token this long gets past them.
    vi.mocked(createExportToken).mockReturnValueOnce("x".repeat(8000));
    const response = await post(banner);
    expect(response.status).toBe(413);
    expect(dailyExportLimit).not.toHaveBeenCalled();
    expect(captureBanner).not.toHaveBeenCalled();
  });
});
