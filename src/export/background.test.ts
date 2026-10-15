import { describe, expect, it } from "vitest";
import type { ExportRequest } from "@/src/types/template";
import {
  EXPORT_BACKGROUND_PATH,
  MAX_EXPORT_BACKGROUND_BYTES,
  splitUploadedBackground,
} from "./background";

const payload = (backgroundImage?: string): ExportRequest => ({
  templateId: "quote-banner",
  format: "png",
  size: "wide",
  scale: 2,
  state: { quote: "hello", ...(backgroundImage === undefined ? {} : { backgroundImage }) },
});

const dataUrl = (type: string, bytes: Buffer) => `data:${type};base64,${bytes.toString("base64")}`;

describe("splitUploadedBackground", () => {
  it("leaves payloads without an uploaded background unchanged", () => {
    for (const input of [
      payload(),
      payload("/backgrounds/london.avif"),
      payload("https://example.com/a.jpg"),
    ]) {
      expect(splitUploadedBackground(input)).toEqual({ ok: true, payload: input });
    }
  });

  it("moves an uploaded image out of the payload", () => {
    const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
    const input = payload(dataUrl("image/jpeg", bytes));
    const result = splitUploadedBackground(input);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.state).toEqual({
      quote: "hello",
      backgroundImage: EXPORT_BACKGROUND_PATH,
    });
    expect(result.background).toEqual({ contentType: "image/jpeg", body: bytes });
    expect(input.state.backgroundImage).toMatch(/^data:/);
  });

  it.each([
    ["an unsupported type", dataUrl("image/svg+xml", Buffer.from("<svg/>"))],
    ["a non-base64 data URL", "data:image/png,rawbytes"],
    ["malformed base64", "data:image/png;base64,not base64!"],
  ])("rejects %s", (_, value) => {
    expect(splitUploadedBackground(payload(value)).ok).toBe(false);
  });

  it(`rejects images over ${MAX_EXPORT_BACKGROUND_BYTES / (1024 * 1024)} MB`, () => {
    const tooBig = Buffer.alloc(MAX_EXPORT_BACKGROUND_BYTES + 1);
    expect(splitUploadedBackground(payload(dataUrl("image/png", tooBig))).ok).toBe(false);
  });
});
