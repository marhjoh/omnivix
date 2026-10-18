// Captures the README screenshots in docs/images/ from a running app (`pnpm dev` first, or set
// BASE_URL). Pages are captured at 2× and encoded as WebP q90 with smartSubsample: 1× looks soft on
// high-DPI screens, and WebP's default chroma subsampling smears text and sharp UI edges.
// Run with `pnpm readme-screenshots`.
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import sharp, { type Sharp, type WebpOptions } from "sharp";
import { BACKGROUND_PRESETS } from "@/src/backgrounds/presets";
import { THEME_COOKIE_NAME, type Theme } from "@/src/theme/theme";
import { settingsCookieName, USERNAME_COOKIE } from "@/src/studio/studioCookies";
import type { TemplateId } from "@/src/types/template";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const OUT_DIR = join(process.cwd(), "docs/images");
const USERNAME = "marhjoh";
const WEBP = { quality: 90, smartSubsample: true } as const;
/** How long each template shows in the animated demo. */
const DEMO_FRAME_MS = 2200;

function presetSrc(id: string): string {
  const preset = BACKGROUND_PRESETS.find((p) => p.id === id);
  if (!preset) throw new Error(`No background preset "${id}"`);
  return preset.src;
}

const browser = await chromium.launch();

async function newPage(viewport: { width: number; height: number }, theme: Theme): Promise<Page> {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  await context.addCookies([
    { name: THEME_COOKIE_NAME, value: theme, url: BASE_URL },
    { name: USERNAME_COOKIE, value: USERNAME, url: BASE_URL },
  ]);
  return context.newPage();
}

/** Opens a template in the studio with a background, and waits until it can be exported. */
async function studio(page: Page, templateId: TemplateId, background: string): Promise<Buffer> {
  await page.context().addCookies([
    {
      name: settingsCookieName(templateId),
      value: encodeURIComponent(JSON.stringify({ backgroundImage: presetSrc(background) })),
      url: BASE_URL,
    },
  ]);
  await page.goto(`${BASE_URL}/studio/${templateId}`);
  // Download is enabled once the preview, its GitHub data and the background have loaded.
  await page.waitForFunction(
    () => {
      const download = document.querySelector<HTMLButtonElement>('button[aria-label^="Download "]');
      return download !== null && !download.disabled;
    },
    null,
    { timeout: 60_000 },
  );
  await page.mouse.move(0, 0);
  await page.waitForTimeout(500);
  return page.screenshot();
}

async function save(name: string, image: Sharp, options: WebpOptions = {}) {
  const path = join(OUT_DIR, name);
  const { size } = await image.webp({ ...WEBP, ...options }).toFile(path);
  console.log(`Wrote ${path} (${Math.round(size / 1024)} KB)`);
}

try {
  // Landing page, dark mode
  const landing = await newPage({ width: 1440, height: 900 }, "dark");
  await landing.goto(BASE_URL);
  await landing.waitForLoadState("networkidle");
  await landing.waitForTimeout(1500);
  await save("landing.webp", sharp(await landing.screenshot()));

  // Studio, light mode
  const light = await newPage({ width: 1440, height: 900 }, "light");
  await save("studio-light.webp", sharp(await studio(light, "github-banner", "sydney")));

  // Animated demo, dark mode: one frame per template
  const demo = await newPage({ width: 1280, height: 800 }, "dark");
  const frames = [
    await studio(demo, "github-banner", "london"),
    await studio(demo, "repos-banner", "seoul"),
    await studio(demo, "contribution-banner", "toronto"),
    await studio(demo, "quote-banner", "new-york"),
  ];
  await save("studio-demo.webp", sharp(frames, { join: { animated: true } }), {
    delay: frames.map(() => DEMO_FRAME_MS),
    loop: 0,
  });
} finally {
  await browser.close();
}
