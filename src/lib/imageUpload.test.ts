import { describe, expect, it } from "vitest";
import {
  BACKGROUND_UPLOAD,
  dataUrlByteLength,
  isGifMagicBytes,
  LOGO_UPLOAD,
  MAX_IMAGE_FILE_BYTES,
  readFileHead,
  shouldDecodeHeicWithHeic2any,
  supportedFormatsMessage,
  truncateMiddle,
  validateImageUploadMeta,
} from "./imageUpload";

const SUPPORTED_BACKGROUND_FORMATS_MESSAGE = supportedFormatsMessage(BACKGROUND_UPLOAD);
const validateBackgroundUploadMeta = (file: File) =>
  validateImageUploadMeta(file, BACKGROUND_UPLOAD);

describe("validateImageUploadMeta for backgrounds", () => {
  it("accepts png under size limit", () => {
    const f = new File([], "photo.png", { type: "image/png" });
    expect(validateBackgroundUploadMeta(f)).toBeNull();
  });

  it("rejects oversize files", () => {
    const f = new File([], "big.png", { type: "image/png" });
    Object.defineProperty(f, "size", { value: MAX_IMAGE_FILE_BYTES + 1 });
    expect(validateBackgroundUploadMeta(f)).toMatch(/MB or smaller/);
  });

  it("rejects gif by mime", () => {
    const f = new File([], "x.gif", { type: "image/gif" });
    expect(validateBackgroundUploadMeta(f)).toBe(SUPPORTED_BACKGROUND_FORMATS_MESSAGE);
  });

  it("rejects gif by extension", () => {
    const f = new File([], "x.gif", { type: "" });
    expect(validateBackgroundUploadMeta(f)).toBe(SUPPORTED_BACKGROUND_FORMATS_MESSAGE);
  });

  it("rejects unsupported mime", () => {
    const f = new File([], "x.bmp", { type: "image/bmp" });
    expect(validateBackgroundUploadMeta(f)).toBe(SUPPORTED_BACKGROUND_FORMATS_MESSAGE);
  });

  it("allows empty mime with valid extension", () => {
    const f = new File([], "x.webp", { type: "" });
    expect(validateBackgroundUploadMeta(f)).toBeNull();
  });

  it("rejects empty mime with bad extension", () => {
    const f = new File([], "x.bin", { type: "" });
    expect(validateBackgroundUploadMeta(f)).toBe(SUPPORTED_BACKGROUND_FORMATS_MESSAGE);
  });

  it("accepts avif by mime", () => {
    const f = new File([], "photo.avif", { type: "image/avif" });
    expect(validateBackgroundUploadMeta(f)).toBeNull();
  });

  it("allows empty mime with .avif extension", () => {
    const f = new File([], "photo.avif", { type: "" });
    expect(validateBackgroundUploadMeta(f)).toBeNull();
  });

  it("accepts heic by mime", () => {
    const f = new File([], "IMG.HEIC", { type: "image/heic" });
    expect(validateBackgroundUploadMeta(f)).toBeNull();
  });

  it("accepts heif by mime", () => {
    const f = new File([], "x.heif", { type: "image/heif" });
    expect(validateBackgroundUploadMeta(f)).toBeNull();
  });

  it("accepts empty mime with .heic extension", () => {
    const f = new File([], "photo.heic", { type: "" });
    expect(validateBackgroundUploadMeta(f)).toBeNull();
  });

  it("allows application/octet-stream when name is .heic", () => {
    const f = new File([], "photo.heic", { type: "application/octet-stream" });
    expect(validateBackgroundUploadMeta(f)).toBeNull();
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
  it("is true for image/heic", () => {
    const f = new File([], "x.bin", { type: "image/heic" });
    expect(shouldDecodeHeicWithHeic2any(f)).toBe(true);
  });

  it("is true for octet-stream and .heic name", () => {
    const f = new File([], "p.heic", { type: "application/octet-stream" });
    expect(shouldDecodeHeicWithHeic2any(f)).toBe(true);
  });

  it("is false when MIME is PNG even if name ends with .heic", () => {
    const f = new File([], "wrong.heic", { type: "image/png" });
    expect(shouldDecodeHeicWithHeic2any(f)).toBe(false);
  });

  it("is false for JPEG mime", () => {
    const f = new File([], "x.jpg", { type: "image/jpeg" });
    expect(shouldDecodeHeicWithHeic2any(f)).toBe(false);
  });
});

describe("GIF magic", () => {
  it("detects GIF signature", () => {
    expect(isGifMagicBytes(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))).toBe(true);
  });

  it("does not flag PNG", () => {
    expect(isGifMagicBytes(new Uint8Array([0x89, 0x50, 0x4e]))).toBe(false);
  });
});

describe("readFileHead", () => {
  it("reads leading bytes", async () => {
    const buf = new Uint8Array([1, 2, 3, 4, 5]);
    const f = new File([buf], "t.bin");
    const head = await readFileHead(f, 3);
    expect(Array.from(head)).toEqual([1, 2, 3]);
  });
});

describe("truncateMiddle", () => {
  it("leaves short strings", () => {
    expect(truncateMiddle("abc", 10)).toBe("abc");
  });

  it("truncates long strings", () => {
    const s = "https://example.com/very/long/path/to/file.jpg";
    const out = truncateMiddle(s, 20);
    expect(out.length).toBeLessThanOrEqual(20);
    expect(out).toContain("…");
  });
});

describe("dataUrlByteLength", () => {
  it.each([0, 1, 2, 3, 1000])("matches the decoded size of %i bytes", (size) => {
    const dataUrl = `data:image/webp;base64,${Buffer.alloc(size, 7).toString("base64")}`;
    expect(dataUrlByteLength(dataUrl)).toBe(size);
  });
});
