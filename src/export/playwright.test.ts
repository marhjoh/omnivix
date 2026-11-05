import { afterEach, describe, expect, it, vi } from "vitest";
import { Effect, Exit } from "effect";
import { captureBanner } from "./playwright";

const { browser, page } = vi.hoisted(() => {
  const page = {
    setDefaultTimeout: vi.fn(),
    route: vi.fn(async () => undefined),
    goto: vi.fn((): Promise<unknown> => new Promise(() => {})),
  };
  const browser = {
    newContext: vi.fn(async () => ({ newPage: async () => page })),
    close: vi.fn(async () => undefined),
  };
  return { browser, page };
});

vi.mock("playwright", () => ({ chromium: { launch: vi.fn(async () => browser) } }));
vi.mock("@sparticuz/chromium", () => ({ default: {} }));

const capture = captureBanner({
  url: "http://localhost/render/quote-banner?token=t",
  size: "wide",
  format: "png",
});

afterEach(() => vi.clearAllMocks());

describe("captureBanner", () => {
  it("closes Chromium when a deadline stops a render that hangs", async () => {
    const exit = await Effect.runPromiseExit(capture.pipe(Effect.timeout("20 millis")));
    expect(Exit.isFailure(exit)).toBe(true);
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it("closes Chromium after a failed render", async () => {
    page.goto.mockRejectedValueOnce(new Error("net::ERR_CONNECTION_REFUSED"));
    const exit = await Effect.runPromiseExit(capture);
    expect(exit).toMatchObject({ _tag: "Failure" });
    expect(String(Exit.isFailure(exit) && exit.cause)).toContain("RenderFailed");
    expect(browser.close).toHaveBeenCalledTimes(1);
  });
});
