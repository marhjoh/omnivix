import { describe, expect, it } from "vitest";
import { readApiError } from "./apiError";

const json = (body: unknown, status = 400) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("readApiError", () => {
  it("reads our message", async () => {
    expect(await readApiError(json({ error: "No GitHub user named @x" }, 404))).toEqual({
      message: "No GitHub user named @x",
      limit: null,
    });
  });

  it.each(["github", "requests"] as const)(
    "reads the %s limit and its reset time",
    async (limit) => {
      const resetAt = "2026-10-18T14:05:00.000Z";
      expect(await readApiError(json({ error: "Limited.", limit, resetAt }, 429))).toEqual({
        message: "Limited.",
        limit: { kind: limit, resetAt: new Date(resetAt) },
      });
    },
  );

  it("reads a bare 429 as the firewall's, ignoring Vercel's error object", async () => {
    const vercel = { error: { code: "429", message: "Too Many Requests", id: "arn1::x" } };
    expect(await readApiError(json(vercel, 429))).toEqual({
      message: null,
      limit: { kind: "firewall" },
    });
  });

  it("ignores a body that isn't JSON", async () => {
    expect(await readApiError(new Response("<h1>502</h1>", { status: 502 }))).toEqual({
      message: null,
      limit: null,
    });
  });
});
