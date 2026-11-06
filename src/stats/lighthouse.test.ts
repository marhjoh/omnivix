import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { saveQuality } = vi.hoisted(() => ({ saveQuality: vi.fn() }));

vi.mock("@/src/stats/quality", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/src/stats/quality")>()),
  saveQuality,
}));

const { lighthouseCronRoute } = await import("./lighthouse");

function cron(authorization?: string) {
  return new NextRequest("https://omnivix.app/api/cron/lighthouse", {
    headers: authorization ? { authorization } : {},
  });
}

const scores = (score: number | null) => ({
  lighthouseResult: {
    categories: {
      performance: { score },
      accessibility: { score: 1 },
      "best-practices": { score: 0.96 },
      seo: { score: 0.9 },
    },
  },
});

beforeEach(() => {
  vi.stubEnv("CRON_SECRET", "s3cret");
  vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "omnivix.app");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  saveQuality.mockReset();
});

describe("lighthouseCronRoute", () => {
  it.each([
    ["no secret", undefined],
    ["the wrong secret", "Bearer guess"],
  ])("refuses a request with %s", async (_, authorization) => {
    expect((await lighthouseCronRoute(cron(authorization))).status).toBe(401);
  });

  it("saves every page's scores out of 100", async () => {
    const fetch = vi.fn(async (url: string) =>
      Response.json(scores(url.includes("studio") ? 0.72 : null)),
    );
    vi.stubGlobal("fetch", fetch);
    saveQuality.mockResolvedValue(true);
    const response = await lighthouseCronRoute(cron("Bearer s3cret"));
    expect(response.status).toBe(200);
    const pages = fetch.mock.calls.map(([url]) => new URL(url).searchParams.get("url"));
    expect(pages).toEqual(["https://omnivix.app/", "https://omnivix.app/studio/quote-banner"]);
    expect(saveQuality).toHaveBeenCalledWith({
      "quality:lighthouse:landing:accessibility": 100,
      "quality:lighthouse:landing:best-practices": 96,
      "quality:lighthouse:landing:seo": 90,
      "quality:lighthouse:studio:performance": 72,
      "quality:lighthouse:studio:accessibility": 100,
      "quality:lighthouse:studio:best-practices": 96,
      "quality:lighthouse:studio:seo": 90,
    });
  });

  it("answers 502 without saving when PageSpeed fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("quota", { status: 429 })),
    );
    expect((await lighthouseCronRoute(cron("Bearer s3cret"))).status).toBe(502);
    expect(saveQuality).not.toHaveBeenCalled();
  });
});
