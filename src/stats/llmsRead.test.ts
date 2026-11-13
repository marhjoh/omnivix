import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { countStats } = vi.hoisted(() => ({ countStats: vi.fn() }));

vi.mock("@/src/stats/stats", () => ({ countStats }));

const { countLlmsRead } = await import("./llmsRead");

function read(userAgent?: string) {
  countLlmsRead(
    new NextRequest("https://omnivix.app/llms.txt", {
      headers: userAgent === undefined ? {} : { "user-agent": userAgent },
    }),
  );
  return countStats.mock.calls.at(-1)?.[0];
}

afterEach(() => countStats.mockReset());

describe("countLlmsRead", () => {
  it("names a known agent, even inside a browser's User-Agent", () => {
    expect(
      read(
        "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
      ),
    ).toEqual(["llms:reader:ClaudeBot"]);
    expect(read("Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)")).toContain(
      "llms:reader:ChatGPT-User",
    );
  });

  it("counts a browser as Browser", () => {
    expect(
      read(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
      ),
    ).toContain("llms:reader:Browser");
  });

  it("uses the first word for other clients", () => {
    expect(read("curl/8.7.1")).toContain("llms:reader:curl");
    expect(read("python-httpx/0.28.1")).toContain("llms:reader:python-httpx");
    expect(read("x".repeat(100))).toContain(`llms:reader:${"x".repeat(30)}`);
  });

  it("counts a missing User-Agent as unknown", () => {
    expect(read()).toContain("llms:reader:unknown");
    expect(read("(nothing)")).toContain("llms:reader:unknown");
  });
});
