import "server-only";
import { access, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect, Schedule } from "effect";
import { type Page, chromium as playwrightChromium } from "playwright";
import chromium from "@sparticuz/chromium";
import type { ExportPixelRatio, ExportFormat } from "@/src/export/format";
import { toJpeg } from "@/src/export/jpeg";
import { BANNER_SIZES, exportPixelRatioFor, type BannerSize } from "@/src/lib/sizes";
import { FIT_STATUS_ATTRIBUTE } from "@/src/banner/fit";
import { BANNER_ROOT_CLASS } from "@/src/banner/placement";
import type { ExportImage } from "@/src/export/images";
import { GITHUB_LIMIT_ATTRIBUTE, GITHUB_USER_MISSING_ATTRIBUTE } from "@/src/export/renderProblem";
import { RenderFailed } from "@/src/export/errors";
import { GithubRateLimited, GithubUserNotFound } from "@/src/github/errors";

/**
 * Writes a script that starts `executable` with core dumps off. On Vercel, Chromium crashes as it
 * closes. Each crash dumps hundreds of MB into /tmp, which fills up within two exports.
 */
async function withoutCoreDumps(executable: string): Promise<string> {
  const script = join(tmpdir(), "chromium-no-core-dumps");
  try {
    await access(script);
  } catch {
    // Write under another name and rename, so a concurrent export never runs a half-written script.
    const draft = `${script}-${process.pid}-${Date.now()}`;
    await writeFile(draft, `#!/bin/sh\nulimit -c 0\nexec "${executable}" "$@"\n`, { mode: 0o755 });
    await rename(draft, script);
  }
  return script;
}

/** The limit for each Playwright step. The whole export also has a deadline (renderBanner.ts). */
const RENDER_TIMEOUT_MS = 25_000;

/** Hosts besides the app that the render page may load from, for GitHub profile photos. */
const ALLOWED_HOSTS = new Set(["avatars.githubusercontent.com"]);

/** `FitContent` sizes content in the browser after hydration. Wait until every fit is done. */
async function waitForContentFit(page: Page) {
  await page.waitForFunction(
    (attribute) =>
      [...document.querySelectorAll(`[${attribute}]`)].every(
        (el) => el.getAttribute(attribute) === "ready",
      ),
    FIT_STATUS_ATTRIBUTE,
  );
}

async function waitForRasterReady(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
      ),
    );
  });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
}

/** Vercel's Chromium (with core dumps off), or Playwright's own locally. */
async function launchBrowser() {
  if (!process.env.VERCEL) return playwrightChromium.launch({ headless: true });
  return playwrightChromium.launch({
    headless: true,
    executablePath: await withoutCoreDumps(await chromium.executablePath()),
    args: chromium.args,
  });
}

/**
 * Blocks every request except to the app and ALLOWED_HOSTS. Image links were already downloaded
 * and checked. The main page may still navigate, so `openRenderPage` can report a redirect to the
 * Vercel login. Frames may not. Uploaded and linked images are served from memory at their `path`.
 */
async function restrictRequests(page: Page, origin: string, images: ExportImage[]) {
  // Sent to the app only, never to the other allowed hosts.
  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  await page.route("**/*", (route) => {
    const request = route.request();
    const target = new URL(request.url());
    if (target.origin === origin) {
      return route.fallback(
        bypassSecret
          ? { headers: { ...request.headers(), "x-vercel-protection-bypass": bypassSecret } }
          : undefined,
      );
    }
    const allowed =
      ALLOWED_HOSTS.has(target.hostname) ||
      (request.isNavigationRequest() && request.frame() === page.mainFrame());
    return allowed ? route.fallback() : route.abort("blockedbyclient");
  });
  // Routes added later take precedence, so these run before the one above.
  for (const image of images) {
    await page.route(`**${image.path}`, (route) =>
      route.fulfill({ status: 200, contentType: image.contentType, body: image.body }),
    );
  }
}

/** Runs a step in Chromium. Any failure becomes `RenderFailed`. */
function step<A>(run: () => Promise<A>) {
  return Effect.tryPromise({ try: run, catch: (cause) => new RenderFailed({ cause }) });
}

/**
 * Chromium for one export. It closes when the export's scope ends: after the screenshot, after a
 * failure, or when the deadline stops the export mid-step.
 */
const scopedBrowser = Effect.acquireRelease(
  // If the launch fails, try once more.
  step(launchBrowser).pipe(Effect.retry({ times: 1, schedule: Schedule.spaced("500 millis") })),
  (browser) =>
    // On Vercel, Chromium can crash while closing. The export is done by then.
    Effect.promise(() => browser.close().catch(() => undefined)),
);

/** Loads the render page. Fails on an HTTP error or a redirect to the Vercel login. */
const openRenderPage = Effect.fnUntraced(function* (page: Page, url: string) {
  const response = yield* step(() => page.goto(url, { waitUntil: "load" }));
  const status = response?.status() ?? 0;
  if (status >= 400) {
    return yield* new RenderFailed({ cause: new Error(`Render page returned HTTP ${status}`) });
  }
  if (page.url().includes("vercel.com/login")) {
    return yield* new RenderFailed({
      cause: new Error("Render page blocked by Vercel Deployment Protection"),
    });
  }
});

/**
 * If GitHub data failed, the render page shows a marker instead of the banner. This turns it back
 * into the GitHub error.
 */
const failOnRenderProblem = Effect.fnUntraced(function* (page: Page) {
  const problem = yield* step(() =>
    page.evaluate(
      ([limit, missing]) => ({
        limitUntil: document.querySelector(`[${limit}]`)?.getAttribute(limit) ?? null,
        userMissing: document.querySelector(`[${missing}]`) !== null,
      }),
      [GITHUB_LIMIT_ATTRIBUTE, GITHUB_USER_MISSING_ATTRIBUTE] as const,
    ),
  );
  if (problem.limitUntil) {
    return yield* new GithubRateLimited({ resetAt: new Date(problem.limitUntil) });
  }
  if (problem.userMissing) return yield* new GithubUserNotFound();
});

/** Opens the render page at the banner's size and pixel ratio and screenshots the banner. */
export const captureBanner = Effect.fnUntraced(function* ({
  url,
  size,
  pixelRatio,
  format,
  transparent = false,
  images = [],
}: {
  url: string;
  size: BannerSize;
  pixelRatio?: ExportPixelRatio;
  format: ExportFormat;
  transparent?: boolean;
  /** Uploaded or linked images, each served at its `path`. */
  images?: ExportImage[];
}) {
  const banner = BANNER_SIZES[size];
  const browser = yield* scopedBrowser;
  const page = yield* step(async () => {
    const context = await browser.newContext({
      viewport: { width: banner.width, height: banner.height },
      // Falls back to the default ratio and caps it for the format. YouTube PNGs are 1× only.
      deviceScaleFactor: exportPixelRatioFor(banner, format, pixelRatio),
    });
    return context.newPage();
  });
  page.setDefaultTimeout(RENDER_TIMEOUT_MS);
  yield* step(() => restrictRequests(page, new URL(url).origin, images));
  yield* openRenderPage(page, url);
  yield* failOnRenderProblem(page);

  const target = page.locator(`.${BANNER_ROOT_CLASS}`);
  yield* step(() => target.waitFor({ state: "visible" }));
  yield* step(() => waitForRasterReady(page));
  yield* step(() => waitForContentFit(page));
  const png = yield* step(() =>
    target.screenshot({
      type: "png",
      animations: "disabled",
      scale: "device",
      omitBackground: transparent,
    }),
  );
  return format === "jpeg" ? yield* step(() => toJpeg(png, banner.uploadLimit)) : png;
}, Effect.scoped);
