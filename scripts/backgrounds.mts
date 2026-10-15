// Downloads the photo backgrounds from the Unsplash CDN and writes them to public/backgrounds/
// as AVIF. The widest export is 1584px at 3× (4752px), so photos are stored 4800px wide.
// Run with `pnpm backgrounds`, or `pnpm backgrounds <id> ...` for some of them.
import { stat } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { BACKGROUND_PRESETS } from "@/src/backgrounds/presets";

const WIDTH = 4800;
/**
 * Taller photos are cropped to 3:2. That keeps room above and below the banner's crop, so the
 * background can be moved and zoomed in the studio.
 */
const MAX_HEIGHT = WIDTH / 1.5;
/** Shown at 28% opacity, where compression artifacts don't show. */
const QUALITY = 40;

interface Source {
  /** images.unsplash.com URL, without a query string. */
  url: string;
  /** Where to crop vertically: 0 keeps the top, 1 the bottom. Defaults to the center. */
  focusY?: number;
}

const SOURCES: Record<string, Source> = {
  london: { url: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad" },
  "new-york": { url: "https://images.unsplash.com/photo-1518235506717-e1ed3306a89b" },
  chicago: { url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390" },
  toronto: { url: "https://images.unsplash.com/photo-1517090504586-fde19ea6066f" },
  lisbon: { url: "https://images.unsplash.com/photo-1748279944004-f1d733dc711b" },
  seoul: { url: "https://images.unsplash.com/photo-1532649097480-b67d52743b69" },
  sydney: { url: "https://images.unsplash.com/photo-1667992501579-b6d13aedca18" },
  "swiss-alps": { url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4" },
  "norwegian-fjord": { url: "https://images.unsplash.com/photo-1505731324189-3d0afbeafcbf" },
  sahara: { url: "https://images.unsplash.com/photo-1617374128851-c84e37dc9f37" },
};

const requested = process.argv.slice(2);
const ids = requested.length > 0 ? requested : Object.keys(SOURCES);

for (const id of ids) {
  const source = SOURCES[id];
  const preset = BACKGROUND_PRESETS.find((p) => p.id === id);
  if (!source || !preset) throw new Error(`No preset with a source for "${id}"`);

  const response = await fetch(`${source.url}?fm=jpg&q=95&fit=max&w=${WIDTH}`);
  if (!response.ok) throw new Error(`${id}: ${response.status} ${response.statusText}`);
  const original = Buffer.from(await response.arrayBuffer());

  const { width = 0, height = 0 } = await sharp(original).metadata();
  if (width < WIDTH) throw new Error(`${id}: source is only ${width}px wide`);

  const outPath = join(process.cwd(), "public", preset.src);
  const scaledHeight = Math.round((height * WIDTH) / width);
  const cropHeight = Math.min(scaledHeight, MAX_HEIGHT);
  const top = Math.round((scaledHeight - cropHeight) * (source.focusY ?? 0.5));
  await sharp(original)
    .resize(WIDTH)
    .extract({ left: 0, top, width: WIDTH, height: cropHeight })
    .avif({ quality: QUALITY })
    .toFile(outPath);

  const { size } = await stat(outPath);
  console.log(`Wrote ${outPath} (${Math.round(size / 1024)} KB)`);
}
