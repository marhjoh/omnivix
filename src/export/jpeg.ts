import sharp from "sharp";

/**
 * A 3:1 photo banner at 3× is at most about 1.2 MB as JPEG instead of 6 MB as PNG, without visible
 * artifacts.
 */
const JPEG_QUALITY = 90;

/** The lowest quality tried when a file has to fit an upload limit. */
const MIN_JPEG_QUALITY = 60;
const QUALITY_STEP = 5;

/**
 * Converts a PNG screenshot to JPEG. Chromium's own JPEG halves the color resolution (4:2:0), which
 * blurs colored text and the edges of the contribution grid. sharp keeps full color (4:4:4) for
 * about 20% more bytes. With `uploadLimit`, the quality steps down until the file fits or reaches
 * MIN_JPEG_QUALITY.
 */
export async function toJpeg(png: Buffer, uploadLimit?: number): Promise<Buffer> {
  for (let quality = JPEG_QUALITY; ; quality -= QUALITY_STEP) {
    const jpeg = await sharp(png).jpeg({ quality, chromaSubsampling: "4:4:4" }).toBuffer();
    const fits = uploadLimit === undefined || jpeg.length < uploadLimit;
    if (fits || quality - QUALITY_STEP < MIN_JPEG_QUALITY) return jpeg;
  }
}
