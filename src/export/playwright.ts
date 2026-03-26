import { chromium } from "playwright";
import { BannerSize } from "@/src/types/template";
import { getViewport } from "@/src/export/viewport";

export async function captureBannerPng({
  url,
  size,
  pixelRatio = 2,
}: {
  url: string;
  size: BannerSize;
  pixelRatio?: 1 | 2;
}) {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: getViewport(size, pixelRatio),
      deviceScaleFactor: pixelRatio,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20_000);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
    const target = page.locator(".banner-export-root");
    await target.waitFor({ state: "visible", timeout: 20_000 });
    await page.waitForTimeout(500);
    const screenshot = await target.screenshot({ type: "png", animations: "disabled" });
    await context.close();
    return screenshot;
  } finally {
    await browser.close();
  }
}
