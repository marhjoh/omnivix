import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { toJpeg } from "./jpeg";

/** Random pixels: the worst case for JPEG, so the file is large at any quality. */
async function noisePng(width: number, height: number): Promise<Buffer> {
  const pixels = Buffer.alloc(width * height * 3);
  for (let i = 0; i < pixels.length; i++) pixels[i] = Math.floor(Math.random() * 256);
  return sharp(pixels, { raw: { width, height, channels: 3 } })
    .png()
    .toBuffer();
}

describe("toJpeg", () => {
  it("keeps the full color resolution", async () => {
    const jpeg = await toJpeg(await noisePng(64, 64));
    expect((await sharp(jpeg).metadata()).chromaSubsampling).toBe("4:4:4");
  });

  it("lowers the quality until the file is under the upload limit", async () => {
    const png = await noisePng(400, 200);
    const full = await toJpeg(png);
    const limit = full.length * 0.8;
    expect((await toJpeg(png, limit)).length).toBeLessThan(limit);
  });

  it("stops at the lowest quality when the limit can't be met", async () => {
    const png = await noisePng(400, 200);
    const lowest = await toJpeg(png, 1);
    expect(lowest.length).toBeGreaterThan(1);
    expect(lowest.length).toBeLessThan((await toJpeg(png)).length);
  });
});
