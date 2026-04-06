import type { Page } from "playwright";
import { chromium as playwrightChromium } from "playwright";
import chromium from "@sparticuz/chromium";
import { BannerSize } from "@/src/types/template";
import { getViewport } from "@/src/export/viewport";

async function describeRenderPage(page: Page, requestedUrl: string) {
  const title = await page.title().catch(() => "");
  let finalUrl = "";
  try {
    finalUrl = page.url();
  } catch {
    finalUrl = "";
  }
  const h1 = await page.locator("h1").first().innerText().catch(() => "");
  const body = await page.locator("body").innerText({ timeout: 3000 }).catch(() => "");
  return `requestedUrl=${requestedUrl} finalUrl=${finalUrl} title=${JSON.stringify(title)} h1=${JSON.stringify(h1.slice(0, 160))} bodyPreview=${JSON.stringify(body.slice(0, 500))}`;
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
}: {
  url: string;
  size: BannerSize;
  pixelRatio?: 1 | 2 | 3;
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
    const context = await browser.newContext({
      viewport: getViewport(size, pixelRatio),
      deviceScaleFactor: pixelRatio,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(25_000);
    const response = await page.goto(url, { waitUntil: "load", timeout: 25_000 });
    const status = response?.status() ?? 0;
    if (status >= 400) {
      throw new Error(
        `Render page returned HTTP ${status}. ${await describeRenderPage(page, url)}`,
      );
    }
    const target = page.locator(".banner-export-root");
    try {
      await target.waitFor({ state: "visible", timeout: 25_000 });
    } catch (err) {
      throw new Error(
        `Banner root not visible (HTTP ${status}). ${await describeRenderPage(page, url)}`,
        { cause: err },
      );
    }
    await waitForRasterReady(page);
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
