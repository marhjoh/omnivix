import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { exportRoute } from "./route";

const { dailyExportLimit, captureBanner } = vi.hoisted(() => ({
  dailyExportLimit: vi.fn(async (): Promise<Date | null> => null),
  captureBanner: vi.fn(async () => Buffer.from("png")),
}));

vi.mock("@/src/lib/requestLimits", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/src/lib/requestLimits")>()),
  dailyExportLimit,
}));
vi.mock("@/src/export/playwright", () => ({ captureBanner }));

const post = (body: unknown) =>
  exportRoute(
    new NextRequest("http://localhost/api/export", { method: "POST", body: JSON.stringify(body) }),
  );

const banner = { templateId: "quote-banner", size: "wide", state: {} };

afterEach(() => vi.clearAllMocks());

describe("exportRoute", () => {
  it("returns the image", async () => {
    const response = await post(banner);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
  });

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
});
