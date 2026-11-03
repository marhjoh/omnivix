import { PassThrough } from "node:stream";
import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";

type FakeResponse = {
  status: number;
  headers?: Record<string, string>;
  chunks?: Buffer[];
  /** Fails mid-body instead of ending, like a connection reset. */
  reset?: boolean;
};

/** Responses by URL, served by the mocked `https.request` below. */
const responses = vi.hoisted(() => new Map<string, FakeResponse>());

vi.mock("node:https", () => ({
  request: (url: URL, _options: unknown, onResponse: (res: unknown) => void) => {
    const req = Object.assign(new EventEmitter(), {
      end() {
        const fake = responses.get(url.href);
        if (!fake) {
          req.emit("error", Object.assign(new Error("not found"), { code: "ENOTFOUND" }));
          return;
        }
        const res = Object.assign(new PassThrough(), {
          statusCode: fake.status,
          headers: fake.headers ?? {},
        });
        onResponse(res);
        for (const chunk of fake.chunks ?? []) res.write(chunk);
        if (fake.reset) {
          setImmediate(() =>
            res.destroy(Object.assign(new Error("aborted"), { code: "ECONNRESET" })),
          );
        } else {
          res.end();
        }
      },
    });
    return req;
  },
}));

const { fetchImageLink } = await import("./imageLink");

const PNG = ["image/png"] as const;
const png = (body = Buffer.from("png")) => ({
  status: 200,
  headers: { "content-type": "image/png" },
  chunks: [body],
});

afterEach(() => responses.clear());

describe("fetchImageLink", () => {
  it("downloads an image", async () => {
    responses.set("https://example.com/a.png", png());
    await expect(fetchImageLink("https://example.com/a.png", PNG)).resolves.toEqual({
      contentType: "image/png",
      body: Buffer.from("png"),
    });
  });

  it("follows https redirects", async () => {
    responses.set("https://example.com/old", { status: 301, headers: { location: "/a.png" } });
    responses.set("https://example.com/a.png", png());
    await expect(fetchImageLink("https://example.com/old", PNG)).resolves.toMatchObject({
      contentType: "image/png",
    });
  });

  it.each([
    ["an invalid URL", "not a url", "isn't a valid URL"],
    ["http", "http://example.com/a.png", "must start with https://"],
    ["a private address", "https://127.0.0.1/a.png", "isn't allowed"],
  ])("rejects %s", async (_, link, message) => {
    await expect(fetchImageLink(link, PNG)).rejects.toThrow(message);
  });

  it("rejects a redirect to http", async () => {
    responses.set("https://example.com/old", {
      status: 302,
      headers: { location: "http://example.com/a.png" },
    });
    await expect(fetchImageLink("https://example.com/old", PNG)).rejects.toThrow("insecure");
  });

  it("rejects too many redirects", async () => {
    responses.set("https://example.com/loop", { status: 302, headers: { location: "/loop" } });
    await expect(fetchImageLink("https://example.com/loop", PNG)).rejects.toThrow("too many");
  });

  it("rejects a missing image", async () => {
    responses.set("https://example.com/a.png", { status: 404 });
    await expect(fetchImageLink("https://example.com/a.png", PNG)).rejects.toThrow("moved");
  });

  it("rejects another content type", async () => {
    responses.set("https://example.com/a.gif", {
      status: 200,
      headers: { "content-type": "image/gif" },
    });
    await expect(fetchImageLink("https://example.com/a.gif", PNG)).rejects.toThrow("PNG image");
  });

  it("rejects an image declared too large", async () => {
    responses.set("https://example.com/a.png", {
      status: 200,
      headers: { "content-type": "image/png", "content-length": String(11 * 1024 * 1024) },
    });
    await expect(fetchImageLink("https://example.com/a.png", PNG)).rejects.toThrow("larger");
  });

  it("rejects an image that turns out too large", async () => {
    responses.set("https://example.com/a.png", png(Buffer.alloc(11 * 1024 * 1024)));
    await expect(fetchImageLink("https://example.com/a.png", PNG)).rejects.toThrow("larger");
  });

  it("reports a timeout while the body downloads as a timeout", async () => {
    responses.set("https://example.com/slow.png", { ...png(), reset: true });
    const timedOut = AbortSignal.abort(new DOMException("timed out", "TimeoutError"));
    await expect(fetchImageLink("https://example.com/slow.png", PNG, 3, timedOut)).rejects.toThrow(
      "took too long",
    );
  });

  it("reports a connection reset mid-body as a failed load", async () => {
    responses.set("https://example.com/reset.png", { ...png(), reset: true });
    await expect(fetchImageLink("https://example.com/reset.png", PNG)).rejects.toThrow(
      "Couldn't load the image link",
    );
  });

  it("rejects a redirect to an invalid address", async () => {
    responses.set("https://example.com/bad", { status: 302, headers: { location: "https://" } });
    await expect(fetchImageLink("https://example.com/bad", PNG)).rejects.toThrow("invalid address");
  });

  it("reports a host that doesn't exist", async () => {
    await expect(fetchImageLink("https://nowhere.example/a.png", PNG)).rejects.toThrow(
      "Couldn't find",
    );
  });
});
