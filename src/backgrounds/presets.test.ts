import { stat } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { BANNER_SIZES } from "@/src/lib/sizes";
import { BACKGROUND_PRESETS } from "./presets";

/** Widest export: the widest banner at the 3× export pixel ratio. */
const MIN_PHOTO_WIDTH = Math.max(...Object.values(BANNER_SIZES).map((s) => s.width)) * 3;
const MAX_BYTES = 1024 * 1024;

const filePath = (src: string) => join(process.cwd(), "public", src);

describe("BACKGROUND_PRESETS", () => {
  it("has unique ids and srcs", () => {
    const ids = BACKGROUND_PRESETS.map((p) => p.id);
    const srcs = BACKGROUND_PRESETS.map((p) => p.src);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(srcs).size).toBe(srcs.length);
  });

  describe.each(BACKGROUND_PRESETS)("$id", (preset) => {
    it("is an AVIF photo with a credit, or an SVG", () => {
      expect(preset.src).toMatch(/^\/backgrounds\/[a-z0-9-]+\.(avif|svg)$/);
      if (preset.src.endsWith(".avif")) expect(preset.credit).toBeDefined();
    });

    it(`stays under ${MAX_BYTES / 1024} KB`, async () => {
      const { size } = await stat(filePath(preset.src));
      expect(size).toBeLessThanOrEqual(MAX_BYTES);
    });

    it.runIf(preset.src.endsWith(".avif"))(
      `is at least ${MIN_PHOTO_WIDTH}px wide, so exports aren't upscaled`,
      async () => {
        const { width = 0, height = 0 } = await sharp(filePath(preset.src)).metadata();
        expect(width).toBeGreaterThanOrEqual(MIN_PHOTO_WIDTH);
        expect(width).toBeGreaterThan(height);
      },
    );
  });
});
