import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  /** Keep Chromium pack + Playwright out of the server bundle so Vercel lambdas still have brotli `bin/`. */
  serverExternalPackages: ["@sparticuz/chromium", "playwright", "playwright-core"],
  outputFileTracingIncludes: {
    "/api/export": [
      "./node_modules/@sparticuz/chromium/**/*",
      "./node_modules/.pnpm/playwright-core@*/node_modules/playwright-core/browsers.json",
    ],
  },
};

export default nextConfig;
