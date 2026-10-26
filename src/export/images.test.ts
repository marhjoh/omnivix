import { describe, expect, it } from "vitest";
import type { ExportRequest } from "@/src/types/template";
import { resolveExportImages } from "./images";
import { BACKGROUND_UPLOAD } from "@/src/lib/imageUpload";

const MAX_UPLOADED_BACKGROUND_BYTES = BACKGROUND_UPLOAD.maxBytes;

const payload = (backgroundImage?: unknown): ExportRequest => ({
  templateId: "quote-banner",
  size: "wide",
  state: { quote: "hello", ...(backgroundImage === undefined ? {} : { backgroundImage }) },
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
    expect(result.payload.state).toEqual({
      quote: "hello",
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
    ["an http link", "http://example.com/a.jpg"],
    ["a protocol-relative link", "//example.com/a.jpg"],
    ["another app path", "/api/github/repos"],
    ["an old .jpg preset path", "/backgrounds/chicago.jpg"],
    ["a path escaping the presets", "/backgrounds/../api/github/repos"],
    ["a non-string value", 42],
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
