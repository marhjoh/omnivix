// Compares exported JPEGs with PNGs of the same render (see #185). Needs a running app
// (`pnpm dev`, or set BASE_URL). For every template and pixel ratio it reports PSNR for
// brightness (Y) and color (Cb, Cr), and saves a zoomed crop of the worst block, PNG left and
// JPEG right. It also checks how large the avatar is drawn at XL compared with the 460px that
// GitHub serves.
// Output goes to a temp folder named after the first argument, so you can compare runs before and
// after a change. Run with `pnpm export-quality before`.
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import sharp, { type Region } from "sharp";
import { presetSrcById } from "@/src/backgrounds/presets";
import { EXPORT_FORMAT_DETAILS, EXPORT_FORMATS } from "@/src/export/format";
import { BANNER_SIZES, exportPixelRatios, type BannerSize } from "@/src/lib/sizes";
import { TEMPLATE_IDS, type TemplateId } from "@/src/templates/types";
import { FIT_STATUS_ATTRIBUTE } from "@/src/banner/fit";
import { BANNER_ROOT_CLASS } from "@/src/banner/placement";
import { studioPath } from "@/src/lib/site";
import { BASE_URL, DESKTOP_VIEWPORT, kb, USERNAME } from "./shared.mjs";

const LABEL = process.argv[2] ?? "latest";
const OUT_DIR = join(tmpdir(), "omnivix-export-quality", LABEL);
const BACKGROUND = "sydney";
/** LinkedIn and X, where the issue tested uploads. */
const SIZES: BannerSize[] = ["wide", "header"];
/** The templates that show the GitHub profile photo. */
const AVATAR_TEMPLATES: TemplateId[] = ["github-banner", "repos-banner", "stats-banner"];
/** The largest avatar GitHub serves, whatever size is asked for. */
const AVATAR_SOURCE_PX = 460;
/** Block size in banner pixels. In the image it's multiplied by the pixel ratio. */
const BLOCK = 48;
const CROP_WIDTH = 480;

async function exportBanner(body: object): Promise<Buffer> {
  const response = await fetch(`${BASE_URL}/api/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Export failed: ${response.status} ${await response.text()}`);
  return Buffer.from(await response.arrayBuffer());
}

/** Splits an image into BT.601 YCbCr planes, the color space JPEG uses. */
async function ycbcr(image: Buffer) {
  const { data, info } = await sharp(image)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixels = info.width * info.height;
  const y = new Float32Array(pixels);
  const cb = new Float32Array(pixels);
  const cr = new Float32Array(pixels);
  for (let i = 0; i < pixels; i++) {
    const [r, g, b] = [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
    y[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    cb[i] = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    cr[i] = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  }
  return { width: info.width, height: info.height, y, cb, cr };
}

const psnr = (squaredError: number, count: number) =>
  squaredError === 0 ? Infinity : 10 * Math.log10((255 * 255 * count) / squaredError);

/** How far `jpeg` is from `png`, and where it's furthest, in blocks of `block` pixels. */
async function compare(png: Buffer, jpeg: Buffer, block: number) {
  const [a, b] = await Promise.all([ycbcr(png), ycbcr(jpeg)]);
  const columns = Math.ceil(a.width / block);
  const blockError = new Float64Array(columns * Math.ceil(a.height / block));
  let lumaError = 0;
  let chromaError = 0;
  for (let i = 0; i < a.y.length; i++) {
    const luma = (a.y[i] - b.y[i]) ** 2;
    const chroma = (a.cb[i] - b.cb[i]) ** 2 + (a.cr[i] - b.cr[i]) ** 2;
    lumaError += luma;
    chromaError += chroma;
    const x = i % a.width;
    const y = Math.floor(i / a.width);
    blockError[Math.floor(y / block) * columns + Math.floor(x / block)] += luma + chroma;
  }
  const worst = blockError.indexOf(Math.max(...blockError));
  return {
    luma: psnr(lumaError, a.y.length),
    chroma: psnr(chromaError, a.y.length * 2),
    worst: {
      left: Math.min((worst % columns) * block, a.width - block),
      top: Math.min(Math.floor(worst / columns) * block, a.height - block),
      width: block,
      height: block,
    },
  };
}

/** The same region of both images side by side, enlarged without smoothing. */
async function sideBySide(png: Buffer, jpeg: Buffer, region: Region): Promise<Buffer> {
  const crop = (image: Buffer) =>
    sharp(image)
      .extract(region)
      .resize(CROP_WIDTH, CROP_WIDTH, { kernel: "nearest" })
      .png()
      .toBuffer();
  const gap = 8;
  return sharp({
    create: { width: CROP_WIDTH * 2 + gap, height: CROP_WIDTH, channels: 3, background: "#888" },
  })
    .composite([
      { input: await crop(png), left: 0, top: 0 },
      { input: await crop(jpeg), left: CROP_WIDTH + gap, top: 0 },
    ])
    .png()
    .toBuffer();
}

const db = (value: number) => (value === Infinity ? "∞" : `${value.toFixed(1)} dB`);

async function measureExports(): Promise<string[]> {
  const rows = [
    "| Template | Size | Ratio | PNG | JPEG | JPEG time | Y PSNR | Cb/Cr PSNR |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const templateId of TEMPLATE_IDS) {
    for (const size of SIZES) {
      const ratios = exportPixelRatios(BANNER_SIZES[size], "png").filter((ratio) =>
        exportPixelRatios(BANNER_SIZES[size], "jpeg").includes(ratio),
      );
      for (const pixelRatio of ratios) {
        const name = `${templateId}-${size}-${pixelRatio}x`;
        const files: Partial<Record<(typeof EXPORT_FORMATS)[number], Buffer>> = {};
        let jpegMs = 0;
        for (const format of EXPORT_FORMATS) {
          const started = performance.now();
          files[format] = await exportBanner({
            templateId,
            size,
            pixelRatio,
            format,
            state: { username: USERNAME, backgroundImage: presetSrcById(BACKGROUND) },
          });
          if (format === "jpeg") jpegMs = performance.now() - started;
          await writeFile(
            join(OUT_DIR, `${name}.${EXPORT_FORMAT_DETAILS[format].extension}`),
            files[format],
          );
        }
        const { png, jpeg } = files as Record<(typeof EXPORT_FORMATS)[number], Buffer>;
        const { luma, chroma, worst } = await compare(png, jpeg, BLOCK * pixelRatio);
        await writeFile(join(OUT_DIR, "crops", `${name}.png`), await sideBySide(png, jpeg, worst));
        const row = `| ${templateId} | ${size} | ${pixelRatio}× | ${kb(png.length)} | ${kb(jpeg.length)} | ${(jpegMs / 1000).toFixed(1)} s | ${db(luma)} | ${db(chroma)} |`;
        console.log(row);
        rows.push(row);
      }
    }
  }
  return rows;
}

/** How large the avatar is drawn at XL in each banner size, as a Markdown table. */
async function measureAvatars(): Promise<string[]> {
  const rows = [
    "| Template | Size | Avatar (CSS px) | Largest ratio | Avatar (image px) | Sharp |",
    "| --- | --- | --- | --- | --- | --- |",
  ];
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: DESKTOP_VIEWPORT });
    for (const templateId of AVATAR_TEMPLATES) {
      for (const size of Object.keys(BANNER_SIZES) as BannerSize[]) {
        const query = new URLSearchParams({ username: USERNAME, size, contentSize: "xl" });
        await page.goto(`${BASE_URL}${studioPath(templateId)}?${query}`);
        const avatar = page.locator('.omnivix-artboard img[src*="avatars.githubusercontent.com"]');
        await avatar.waitFor({ state: "visible", timeout: 60_000 });
        await page.waitForFunction(
          (attribute) => !document.querySelector(`.omnivix-artboard [${attribute}="pending"]`),
          FIT_STATUS_ATTRIBUTE,
        );
        const [avatarBox, bannerBox] = await Promise.all([
          avatar.boundingBox(),
          page.locator(`.omnivix-artboard .${BANNER_ROOT_CLASS}`).boundingBox(),
        ]);
        if (!avatarBox || !bannerBox) throw new Error(`No avatar in ${templateId} ${size}`);
        const format = BANNER_SIZES[size];
        const cssPx = (avatarBox.width * format.width) / bannerBox.width;
        const ratio = Math.max(
          ...EXPORT_FORMATS.flatMap((file) => exportPixelRatios(format, file)),
        );
        const imagePx = cssPx * ratio;
        const row = `| ${templateId} | ${size} | ${Math.round(cssPx)} | ${ratio}× | ${Math.round(imagePx)} | ${imagePx <= AVATAR_SOURCE_PX ? "yes" : "no"} |`;
        console.log(row);
        rows.push(row);
      }
    }
  } finally {
    await browser.close();
  }
  return rows;
}

await mkdir(join(OUT_DIR, "crops"), { recursive: true });
const report = [
  `# Export quality: ${LABEL}`,
  "",
  `${USERNAME}, ${BACKGROUND} background, default settings. Crops show the block where the JPEG differs most from the PNG, PNG left.`,
  "",
  ...(await measureExports()),
  "",
  `## Avatar at XL (GitHub serves ${AVATAR_SOURCE_PX}px)`,
  "",
  ...(await measureAvatars()),
];
await writeFile(join(OUT_DIR, "report.md"), `${report.join("\n")}\n`);
console.log(`Wrote ${OUT_DIR}`);
