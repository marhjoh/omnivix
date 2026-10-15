import type { Page } from "playwright";
import { chromium as playwrightChromium } from "playwright";
import chromium from "@sparticuz/chromium";
import { BannerSize } from "@/src/types/template";
import { getViewport } from "@/src/export/viewport";
import { FIT_STATUS_ATTRIBUTE } from "@/src/banner/fit";
import { EXPORT_BACKGROUND_PATH, type ExportBackground } from "@/src/export/background";

/** Hosts the render page may load from besides its own origin (GitHub profile photos). */
const ALLOWED_HOSTS = new Set(["avatars.githubusercontent.com"]);

/** `FitContent` sizes content in the browser after hydration, so wait for every fit to finish. */
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

export async function captureBannerPng({
  url,
  size,
  pixelRatio = 3,
  background,
}: {
  url: string;
  size: BannerSize;
  pixelRatio?: 1 | 2 | 3;
  /** Uploaded or linked background, served at `EXPORT_BACKGROUND_PATH`. */
  background?: ExportBackground;
}) {
  const isVercel = Boolean(process.env.VERCEL);
  const browser = isVercel
    ? await playwrightChromium.launch({
        headless: true,
        executablePath: await chromium.executablePath(),
        args: chromium.args,
      })
    : await playwrightChromium.launch({ headless: true });
  try {
    const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    const context = await browser.newContext({
      viewport: getViewport(size, pixelRatio),
      deviceScaleFactor: pixelRatio,
      ...(bypassSecret ? { extraHTTPHeaders: { "x-vercel-protection-bypass": bypassSecret } } : {}),
    });
    const page = await context.newPage();
    page.setDefaultTimeout(25_000);
    // Only the app and allowed hosts are reachable; links are downloaded and checked beforehand.
    // Routes added later take precedence, so the background route below runs first.
    const { origin } = new URL(url);
    await page.route("**/*", (route) => {
      const target = new URL(route.request().url());
      const allowed =
        target.origin === origin ||
        ALLOWED_HOSTS.has(target.hostname) ||
        route.request().isNavigationRequest();
      return allowed ? route.fallback() : route.abort("blockedbyclient");
    });
    if (background) {
      await page.route(`**${EXPORT_BACKGROUND_PATH}`, (route) =>
        route.fulfill({ status: 200, contentType: background.contentType, body: background.body }),
      );
    }
    const response = await page.goto(url, { waitUntil: "load", timeout: 25_000 });
    const status = response?.status() ?? 0;
    if (status >= 400) {
      throw new Error(`Render page returned HTTP ${status}`);
    }
    const finalUrl = page.url();
    if (finalUrl.includes("vercel.com/login")) {
      throw new Error("Render page blocked by Vercel Deployment Protection");
    }
    const target = page.locator(".banner-export-root");
    await target.waitFor({ state: "visible", timeout: 25_000 });
    await waitForRasterReady(page);
    await waitForContentFit(page);
    const screenshot = await target.screenshot({
      type: "png",
      animations: "disabled",
      scale: "device",
    });
    await context.close();
    return screenshot;
  } finally {
    await browser.close();
  }
}
