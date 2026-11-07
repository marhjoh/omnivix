import { describe, expect, it } from "vitest";
import { BACKGROUND_UPLOAD, LOGO_UPLOAD, MAX_IMAGE_FILE_BYTES } from "@/src/lib/imageUpload";
import {
  shouldDecodeHeicWithHeic2any,
  supportedFormatsMessage,
  validateImageUploadMeta,
} from "./imageUpload";

const SUPPORTED_BACKGROUND_FORMATS_MESSAGE = supportedFormatsMessage(BACKGROUND_UPLOAD);
const validateBackgroundUploadMeta = (file: File) =>
  validateImageUploadMeta(file, BACKGROUND_UPLOAD);

describe("validateImageUploadMeta for backgrounds", () => {
  it.each([
    ["photo.png", "image/png"],
    ["x.webp", ""],
    ["IMG.HEIC", "image/heic"],
    ["photo.heic", "application/octet-stream"],
  ])("accepts %s as %j", (name, type) => {
    expect(validateBackgroundUploadMeta(new File([], name, { type }))).toBeNull();
  });

  it.each([
    ["x.gif", "image/gif"],
    ["x.bin", ""],
  ])("rejects %s as %j, naming the formats", (name, type) => {
    expect(validateBackgroundUploadMeta(new File([], name, { type }))).toBe(
      SUPPORTED_BACKGROUND_FORMATS_MESSAGE,
    );
  });

  it("rejects oversize files", () => {
    const f = new File([], "big.png", { type: "image/png" });
    Object.defineProperty(f, "size", { value: MAX_IMAGE_FILE_BYTES + 1 });
    expect(validateBackgroundUploadMeta(f)).toMatch(/MB or smaller/);
  });
});

describe("validateImageUploadMeta for logos", () => {
  it.each([
    ["by mime", new File([], "logo.svg", { type: "image/svg+xml" })],
    ["by extension", new File([], "logo.svg", { type: "" })],
  ])("accepts SVG %s", (_, file) => {
    expect(validateImageUploadMeta(file, LOGO_UPLOAD)).toBeNull();
  });

  it("rejects SVG for backgrounds, naming the formats", () => {
    const f = new File([], "logo.svg", { type: "image/svg+xml" });
    expect(validateBackgroundUploadMeta(f)).toBe(SUPPORTED_BACKGROUND_FORMATS_MESSAGE);
    expect(validateImageUploadMeta(new File([], "x.gif", { type: "image/gif" }), LOGO_UPLOAD)).toBe(
      "Only PNG, JPEG, WebP, AVIF, HEIC and SVG are supported.",
    );
  });
});

describe("shouldDecodeHeicWithHeic2any", () => {
  it.each([
    ["x.bin", "image/heic", true],
    ["p.heic", "application/octet-stream", true],
    ["wrong.heic", "image/png", false],
    ["x.jpg", "image/jpeg", false],
  ])("is %s as %j: %s", (name, type, expected) => {
    expect(shouldDecodeHeicWithHeic2any(new File([], name, { type }))).toBe(expected);
  });
});
