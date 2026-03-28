import type { Page } from "playwright";
import { chromium } from "playwright";
import { BannerSize } from "@/src/types/template";
import { getViewport } from "@/src/export/viewport";

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
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: getViewport(size, pixelRatio),
      deviceScaleFactor: pixelRatio,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(25_000);
    await page.goto(url, { waitUntil: "load", timeout: 25_000 });
    const target = page.locator(".banner-export-root");
    await target.waitFor({ state: "visible", timeout: 25_000 });
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
