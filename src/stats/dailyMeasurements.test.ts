import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import { NextRequest } from "next/server";
import { GithubRequestFailed } from "@/src/github/errors";

const { saveQuality, githubQuery } = vi.hoisted(() => ({
  saveQuality: vi.fn(),
  githubQuery: vi.fn(),
}));

vi.mock("@/src/stats/quality", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/src/stats/quality")>()),
  saveQuality,
}));

vi.mock("@/src/github/api", () => ({ githubQuery, QUOTA_FIELDS: "" }));

const { dailyMeasurementsRoute } = await import("./dailyMeasurements");

function cron(authorization?: string) {
  return new NextRequest("https://omnivix.app/api/cron/daily", {
    headers: authorization ? { authorization } : {},
  });
}

const scores = (performance: number | null) => ({
  lighthouseResult: {
    categories: {
      performance: { score: performance },
      accessibility: { score: 1 },
      "best-practices": { score: 0.96 },
      seo: { score: 0.9 },
    },
  },
});

const pageSpeed = vi.fn(async (url: string) =>
  Response.json(scores(url.includes("studio") ? 0.72 : null)),
);

beforeEach(() => {
  vi.stubEnv("CRON_SECRET", "s3cret");
  vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "omnivix.app");
  vi.stubGlobal("fetch", pageSpeed);
  saveQuality.mockResolvedValue(true);
  githubQuery.mockReturnValue(Effect.succeed({ repository: { stargazerCount: 2 } }));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  saveQuality.mockReset();
  githubQuery.mockReset();
  pageSpeed.mockClear();
});

describe("dailyMeasurementsRoute", () => {
  it.each([
    ["no secret", undefined],
    ["the wrong secret", "Bearer guess"],
  ])("refuses a request with %s", async (_, authorization) => {
    expect((await dailyMeasurementsRoute(cron(authorization))).status).toBe(401);
    expect(saveQuality).not.toHaveBeenCalled();
  });

  it("saves the Lighthouse scores out of 100 and the star total", async () => {
    const response = await dailyMeasurementsRoute(cron("Bearer s3cret"));
    expect(response.status).toBe(200);
    const pages = pageSpeed.mock.calls.map(([url]) => new URL(url).searchParams.get("url"));
    expect(pages).toEqual(["https://omnivix.app/", "https://omnivix.app/studio/quote-banner"]);
    expect(saveQuality).toHaveBeenCalledWith({
      "quality:lighthouse:landing:accessibility": 100,
      "quality:lighthouse:landing:best-practices": 96,
      "quality:lighthouse:landing:seo": 90,
      "quality:lighthouse:studio:performance": 72,
      "quality:lighthouse:studio:accessibility": 100,
      "quality:lighthouse:studio:best-practices": 96,
      "quality:lighthouse:studio:seo": 90,
      "quality:stars": 2,
    });
  });

  it("still saves the stars when PageSpeed fails, and answers 502", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    pageSpeed.mockImplementation(async () => new Response("quota", { status: 429 }));
    expect((await dailyMeasurementsRoute(cron("Bearer s3cret"))).status).toBe(502);
    expect(saveQuality).toHaveBeenCalledWith({ "quality:stars": 2 });
  });

  it("still saves the scores when GitHub fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    githubQuery.mockReturnValue(
      Effect.fail(new GithubRequestFailed({ cause: new Error("down"), transient: false })),
    );
    expect((await dailyMeasurementsRoute(cron("Bearer s3cret"))).status).toBe(502);
    expect(saveQuality.mock.calls[0][0]).not.toHaveProperty("quality:stars");
  });
});
