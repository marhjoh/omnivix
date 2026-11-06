import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { countStats } = vi.hoisted(() => ({ countStats: vi.fn() }));

vi.mock("@/src/stats/stats", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/src/stats/stats")>()),
  countStats,
}));

const { countPageView } = await import("./pageView");

const BROWSER =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";
const PHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

function visit(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, {
    headers: {
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "user-agent": BROWSER,
      "x-real-ip": "203.0.113.7",
      ...headers,
    },
  });
}

afterEach(() => countStats.mockReset());

describe("countPageView", () => {
  it("counts the page, source, country and device", () => {
    countPageView(
      visit("https://omnivix.app/studio/github-banner", {
        referer: "https://www.reddit.com/r/github/comments/123",
        "x-vercel-ip-country": "NO",
        "user-agent": PHONE,
      }),
    );
    expect(countStats).toHaveBeenCalledWith(
      [
        "views",
        "views:page:/studio/github-banner",
        "views:source:reddit.com",
        "views:country:NO",
        "views:device:mobile",
        "views:browser:Mobile Safari",
      ],
      { id: expect.any(String), steps: ["site", "studio"] },
    );
  });

  it("prefers a ref in the link, cleaned, over the referrer", () => {
    countPageView(
      visit("https://omnivix.app/?utm_source=News=letter!", {
        referer: "https://x.com/",
      }),
    );
    expect(countStats.mock.calls[0][0]).toContain("views:source:newsletter");
    expect(countStats.mock.calls[0][1].steps).toEqual(["site"]);
  });

  it("counts links from Omnivix itself and no referrer as direct", () => {
    countPageView(
      visit("https://omnivix.app/", { referer: "https://omnivix.app/studio/quote-banner" }),
    );
    countPageView(visit("https://omnivix.app/"));
    for (const [fields] of countStats.mock.calls) {
      expect(fields).toContain("views:source:direct");
      expect(fields).toContain("views:country:unknown");
      expect(fields).toContain("views:device:desktop");
    }
  });

  it("gives a visitor the same id all day without storing the IP", () => {
    countPageView(visit("https://omnivix.app/"));
    countPageView(visit("https://omnivix.app/studio/quote-banner"));
    countPageView(visit("https://omnivix.app/", { "x-real-ip": "198.51.100.1" }));
    const [first, second, other] = countStats.mock.calls.map(([, visitor]) => visitor.id);
    expect(first).toBe(second);
    expect(other).not.toBe(first);
    expect(first).not.toContain("203.0.113.7");
  });

  it.each([
    ["an unknown template", visit("https://omnivix.app/studio/nope")],
    ["another page", visit("https://omnivix.app/studio/github-banner/opengraph-image")],
    [
      "a prefetch",
      visit("https://omnivix.app/", { "sec-fetch-dest": "empty", "sec-fetch-mode": "cors" }),
    ],
    [
      "a bot",
      visit("https://omnivix.app/", {
        "user-agent": "Googlebot/2.1 (+http://www.google.com/bot.html)",
      }),
    ],
    [
      "a headless browser",
      visit("https://omnivix.app/", {
        "user-agent": BROWSER.replace("Chrome/", "HeadlessChrome/"),
      }),
    ],
    [
      "an AI agent that signs its requests",
      visit("https://omnivix.app/", { "signature-agent": '"https://chatgpt.com"' }),
    ],
  ])("skips %s", (_, request) => {
    countPageView(request);
    expect(countStats).not.toHaveBeenCalled();
  });
});
