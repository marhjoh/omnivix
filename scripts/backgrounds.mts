// Downloads the photo backgrounds from the Unsplash CDN and writes them to public/backgrounds/
// as AVIF. The widest export is 1584px at 3× (4752px), so photos are stored 4800px wide, plus
// smaller copies for the studio preview (PREVIEW_PHOTO_WIDTHS).
// Run with `pnpm backgrounds`, or `pnpm backgrounds <id> ...` for some of them.
import { stat } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import {
  BACKGROUND_PRESETS,
  PREVIEW_PHOTO_WIDTHS,
  previewPhotoPath,
} from "@/src/backgrounds/presets";

const WIDTH = 4800;
/**
 * Taller photos are cropped to 3:2. That keeps room above and below the banner's crop, so the
 * background can be moved and zoomed in the studio.
 */
const MAX_HEIGHT = WIDTH / 1.5;
/** Shown at 28% opacity, where compression artifacts don't show. */
const QUALITY = 40;

const photos = BACKGROUND_PRESETS.filter((preset) => preset.credit);
const requested = process.argv.slice(2);
for (const id of requested) {
  if (!photos.some((preset) => preset.id === id)) throw new Error(`No photo preset "${id}"`);
}

for (const preset of photos) {
  if (requested.length > 0 && !requested.includes(preset.id)) continue;
  const { id } = preset;
  const response = await fetch(`${preset.credit!.image}?fm=jpg&q=95&fit=max&w=${WIDTH}`);
  if (!response.ok) throw new Error(`${id}: ${response.status} ${response.statusText}`);
  const original = Buffer.from(await response.arrayBuffer());

  const { width = 0, height = 0 } = await sharp(original).metadata();
  if (width < WIDTH) throw new Error(`${id}: source is only ${width}px wide`);

  const outPath = join(process.cwd(), "public", preset.src);
  const scaledHeight = Math.round((height * WIDTH) / width);
  const cropHeight = Math.min(scaledHeight, MAX_HEIGHT);
  const top = Math.round((scaledHeight - cropHeight) / 2);
  await sharp(original)
    .resize(WIDTH)
    .extract({ left: 0, top, width: WIDTH, height: cropHeight })
    .avif({ quality: QUALITY })
    .toFile(outPath);

  const { size } = await stat(outPath);
  console.log(`Wrote ${outPath} (${Math.round(size / 1024)} KB)`);

  // Smaller copies for the studio preview, from the full-size photo.
  for (const previewWidth of PREVIEW_PHOTO_WIDTHS) {
    const previewPath = join(process.cwd(), "public", previewPhotoPath(preset.src, previewWidth));
    await sharp(outPath).resize(previewWidth).avif({ quality: QUALITY }).toFile(previewPath);
    const { size: previewSize } = await stat(previewPath);
    console.log(`Wrote ${previewPath} (${Math.round(previewSize / 1024)} KB)`);
  }
}
