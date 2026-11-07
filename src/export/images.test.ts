import { afterEach, describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import type { ExportRequest } from "@/src/export/request";
import { resolveExportImages as resolveImages, withImagePaths } from "./images";
import { BACKGROUND_UPLOAD, LOGO_UPLOAD } from "@/src/lib/imageUpload";
import { templateRegistry } from "@/src/templates/registry";

// The real download, unless a test replaces it.
const fetchImageLink = vi.hoisted(() => vi.fn());
vi.mock("./imageLink", async (importOriginal) => {
  const original = await importOriginal<typeof import("./imageLink")>();
  fetchImageLink.mockImplementation(original.fetchImageLink);
  return { ...original, fetchImageLink };
});

afterEach(() => vi.useRealTimers());

/** Returns the payload and images, or the error message shown to the user. */
const resolveExportImages = (request: ExportRequest) =>
  Effect.runPromise(
    resolveImages(request).pipe(
      Effect.match({
        onSuccess: (resolved) => ({ ok: true as const, ...resolved }),
        onFailure: (error) => ({ ok: false as const, error: error.message }),
      }),
    ),
  );

const MAX_UPLOADED_BACKGROUND_BYTES = BACKGROUND_UPLOAD.maxBytes;

const payload = (backgroundImage?: string): ExportRequest => ({
  templateId: "quote-banner",
  size: "wide",
  state: {
    ...templateRegistry["quote-banner"].initialState,
    ...(backgroundImage === undefined ? {} : { backgroundImage }),
  },
});

const dataUrl = (type: string, bytes: Buffer) => `data:${type};base64,${bytes.toString("base64")}`;

describe("resolveExportImages with a background", () => {
  it.each([
    ["no background", undefined],
    ["an empty background", ""],
    ["a preset", "/backgrounds/london.avif"],
    ["an abstract preset", "/backgrounds/aurora.svg"],
  ])("leaves %s unchanged", async (_, value) => {
    const input = payload(value);
    expect(await resolveExportImages(input)).toEqual({ ok: true, payload: input, images: [] });
  });

  it("moves an uploaded image out of the payload", async () => {
    const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
    const input = payload(dataUrl("image/jpeg", bytes));
    const result = await resolveExportImages(input);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.state).toMatchObject({
      backgroundImage: "/__export/background",
    });
    expect(result.images).toEqual([
      { path: "/__export/background", contentType: "image/jpeg", body: bytes },
    ]);
    expect(input.state.backgroundImage).toMatch(/^data:/);
  });

  it.each([
    ["an unsupported upload type", dataUrl("image/svg+xml", Buffer.from("<svg/>"))],
    ["a non-base64 data URL", "data:image/png,rawbytes"],
    ["malformed base64", "data:image/png;base64,not base64!"],
    [
      `an upload over ${MAX_UPLOADED_BACKGROUND_BYTES / (1024 * 1024)} MB`,
      dataUrl("image/png", Buffer.alloc(MAX_UPLOADED_BACKGROUND_BYTES + 1)),
    ],
    ["a protocol-relative link", "//example.com/a.jpg"],
    ["another app path", "/api/github/repos"],
    ["an old .jpg preset path", "/backgrounds/chicago.jpg"],
    ["a path escaping the presets", "/backgrounds/../api/github/repos"],
  ])("rejects %s", async (_, value) => {
    expect((await resolveExportImages(payload(value))).ok).toBe(false);
  });

  it.each([
    ["a loopback link", "https://127.0.0.1/a.jpg"],
    ["a link resolving to loopback", "https://localhost/a.jpg"],
    ["an IPv6 loopback link", "https://[::1]/a.jpg"],
    ["a cloud metadata link", "https://169.254.169.254/latest/meta-data"],
  ])("blocks %s before connecting", async (_, value) => {
    expect(await resolveExportImages(payload(value))).toEqual({
      ok: false,
      error: "That image link isn't allowed. Use a public https:// image.",
    });
  });
});

describe("resolveExportImages with a logo", () => {
  const withLogo = (logoImage: string, backgroundImage?: string): ExportRequest => ({
    ...payload(backgroundImage),
    state: { ...payload(backgroundImage).state, logoImage },
  });

  it("serves an uploaded logo next to an uploaded background", async () => {
    const logo = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    const photo = Buffer.from([0xff, 0xd8, 0xff]);
    const result = await resolveExportImages(
      withLogo(dataUrl("image/png", logo), dataUrl("image/webp", photo)),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.state).toMatchObject({
      backgroundImage: "/__export/background",
      logoImage: "/__export/logo",
    });
    expect(result.images.map((image) => image.path)).toEqual([
      "/__export/background",
      "/__export/logo",
    ]);
  });

  it.each([
    ["a background preset", "/backgrounds/london.avif"],
    [
      `an upload over ${LOGO_UPLOAD.maxBytes / 1024} KB`,
      dataUrl("image/png", Buffer.alloc(LOGO_UPLOAD.maxBytes + 1)),
    ],
    ["an SVG upload", dataUrl("image/svg+xml", Buffer.from("<svg/>"))],
  ])("rejects %s", async (_, value) => {
    expect((await resolveExportImages(withLogo(value))).ok).toBe(false);
  });

  it("names the logo in its problems", async () => {
    expect(await resolveExportImages(withLogo("ftp://example.com/logo.png"))).toEqual({
      ok: false,
      error: "Unsupported logo image.",
    });
  });
});

describe("resolveExportImages with a slow link", () => {
  it("gives up after 5 seconds", async () => {
    vi.useFakeTimers();
    fetchImageLink.mockImplementationOnce(() => new Promise(() => {}));
    const result = resolveExportImages(payload("https://example.com/slow.png"));
    await vi.advanceTimersByTimeAsync(5_000);
    expect(await result).toEqual({ ok: false, error: "The image link took too long to load." });
  });
});

describe("resolveExportImages with an http link", () => {
  it("says links must be https", async () => {
    expect(await resolveExportImages(payload("http://example.com/a.png"))).toEqual({
      ok: false,
      error: "Image links must start with https://.",
    });
  });
});

describe("withImagePaths", () => {
  it("puts each upload or link's path in its place, and keeps presets", () => {
    const request = {
      ...payload("https://example.com/a.png"),
      state: {
        ...payload().state,
        backgroundImage: "https://example.com/a.png",
        logoImage: "data:image/png;base64,AA",
      },
    };
    expect(withImagePaths(request).state).toMatchObject({
      backgroundImage: "/__export/background",
      logoImage: "/__export/logo",
    });
    expect(withImagePaths(payload("/backgrounds/london.avif")).state.backgroundImage).toBe(
      "/backgrounds/london.avif",
    );
  });
});
