import { afterEach, describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import { NextRequest } from "next/server";
import { bannerImageRoute } from "./bannerImageRoute";
import { verifyExportToken } from "./exportToken";

const { bannerImageLimit, captureBanner } = vi.hoisted(() => ({
  bannerImageLimit: vi.fn<(key: string) => Promise<Date | null>>(async () => null),
  captureBanner: vi.fn<
    (options: {
      url: string;
      pixelRatio?: number;
      format: string;
      transparent?: boolean;
    }) => Effect.Effect<Buffer>
  >(() => Effect.succeed(Buffer.from("image"))),
}));

vi.mock("@/src/lib/requestLimits", () => ({ bannerImageLimit }));
vi.mock("@/src/export/playwright", () => ({ captureBanner }));

function get(path: string) {
  const url = new URL(path, "http://localhost");
  return bannerImageRoute(new NextRequest(url), url.pathname.split("/").at(-1)!);
}

/** What the render page was asked to draw, from the token in its URL. */
function rendered() {
  const [{ url, pixelRatio, format, transparent }] = captureBanner.mock.lastCall!;
  const payload = verifyExportToken(new URL(url).searchParams.get("token")!)!;
  return { ...payload, pixelRatio, format, transparent };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("bannerImageRoute", () => {
  it("returns the image, cached by the CDN and shown inline", async () => {
    const response = await get("/banner/quote-banner.png");
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=86400, stale-while-revalidate=604800",
    );
    expect(response.headers.get("Content-Disposition")).toBeNull();
  });

  it("renders a studio link's settings, with the format from the extension", async () => {
    const response = await get(
      "/banner/github-banner.jpg?username=octocat&size=header&contentPosition=100,0&backgroundZoom=1.2&pixelRatio=1&uiTheme=light",
    );
    expect(response.headers.get("Content-Type")).toBe("image/jpeg");
    expect(rendered()).toMatchObject({
      templateId: "github-banner",
      size: "header",
      state: { username: "octocat", contentPosition: { x: 100, y: 0 }, backgroundZoom: 1.2 },
      pixelRatio: 1,
      format: "jpeg",
      uiTheme: "light",
    });
  });

  it("leaves out the background color for a PNG, and ignores it for a JPEG", async () => {
    await get("/banner/quote-banner.png?transparent=true");
    expect(rendered()).toMatchObject({ transparent: true });
    await get("/banner/quote-banner.jpg?transparent=true");
    expect(rendered()).toMatchObject({ format: "jpeg", transparent: false });
  });

  it("uses the defaults for values that aren't valid, and never an upload", async () => {
    await get(
      "/banner/quote-banner.png?size=huge&pixelRatio=4&uiTheme=blue&backgroundImage=data:image/png;base64,AAAA",
    );
    const { size, pixelRatio, uiTheme, state } = rendered();
    expect({ size, pixelRatio, uiTheme }).toEqual({
      size: "wide",
      pixelRatio: 2,
      uiTheme: undefined,
    });
    expect(state.backgroundImage).toBeUndefined();
  });

  it("stops at 2×", async () => {
    await get("/banner/quote-banner.png?pixelRatio=3");
    expect(rendered().pixelRatio).toBe(2);
  });

  it("lowers a pixel ratio the size can't take", async () => {
    await get("/banner/quote-banner.png?size=youtube&pixelRatio=3");
    expect(rendered().pixelRatio).toBe(1);
  });

  it.each(["/banner/nope.png", "/banner/quote-banner.webp", "/banner/quote-banner"])(
    "answers %s with a 404 for a short while",
    async (path) => {
      const response = await get(path);
      expect(response.status).toBe(404);
      expect(response.headers.get("Cache-Control")).toBe("public, s-maxage=300");
    },
  );

  it("refuses a GitHub banner without a username before counting it", async () => {
    const response = await get("/banner/github-banner.png?themeId=sunset");
    expect(response.status).toBe(400);
    expect((await response.json()).issues).toEqual([
      expect.objectContaining({ path: "state.username" }),
    ]);
    expect(response.headers.get("Cache-Control")).toBe("public, s-maxage=300");
    expect(bannerImageLimit).not.toHaveBeenCalled();
  });

  it("counts every image of a user together", async () => {
    await get("/banner/github-banner.png?username=OctoCat");
    await get("/banner/repos-banner.jpg?username=octocat&size=card");
    expect(bannerImageLimit.mock.calls).toEqual([["user:octocat"], ["user:octocat"]]);
  });

  it("counts a banner without a user by its settings, in any order", async () => {
    await get("/banner/quote-banner.png?quote=Hi&author=Me");
    await get("/banner/quote-banner.png?author=Me&quote=Hi&utm_source=x");
    await get("/banner/quote-banner.png?quote=Bye");
    const [[first], [reordered], [other]] = bannerImageLimit.mock.calls;
    expect(first).toMatch(/^banner:[0-9a-f]{64}$/);
    expect(reordered).toBe(first);
    expect(other).not.toBe(first);
  });

  it("refuses a render over the limit without caching the refusal", async () => {
    bannerImageLimit.mockResolvedValueOnce(new Date(Date.now() + 3_600_000));
    const response = await get("/banner/quote-banner.png");
    expect(response.status).toBe(429);
    expect((await response.json()).limit).toBe("banner-images");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Retry-After")).toBe("3600");
    expect(captureBanner).not.toHaveBeenCalled();
  });
});
