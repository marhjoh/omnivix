import type { NextConfig } from "next";

/** Chromium and the files Playwright needs to find it. */
const chromiumFiles = [
  "./node_modules/@sparticuz/chromium/**/*",
  "./node_modules/.pnpm/playwright-core@*/node_modules/playwright-core/browsers.json",
];

const nextConfig: NextConfig = {
  devIndicators: false,
  /**
   * Chromium and Playwright stay outside the bundle, or Vercel loses @sparticuz/chromium's
   * compressed `bin/`.
   */
  serverExternalPackages: ["@sparticuz/chromium", "playwright", "playwright-core"],
  outputFileTracingIncludes: {
    "/api/export": chromiumFiles,
    "/banner/*": chromiumFiles,
  },
};

export default nextConfig;
