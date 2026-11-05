import { describe, expect, it } from "vitest";
import { formatNames, hasFormatExtension, linkImageTypes, uploadImageTypes } from "./imageSource";

describe("image formats", () => {
  it("names HEIC and HEIF once", () => {
    expect(formatNames(uploadImageTypes({ svg: false }))).toBe("PNG, JPEG, WebP, AVIF or HEIC");
  });

  it("leaves HEIC out of links, and SVG out unless allowed", () => {
    expect(formatNames(linkImageTypes({ svg: false }))).toBe("PNG, JPEG, WebP or AVIF");
    expect(formatNames(linkImageTypes({ svg: true }), "and")).toBe("PNG, JPEG, WebP, AVIF and SVG");
  });

  it("matches extensions in any case", () => {
    expect(hasFormatExtension("IMG.JPG", ["image/jpeg"])).toBe(true);
    expect(hasFormatExtension("photo.jpeg.gif", ["image/jpeg"])).toBe(false);
  });
});
