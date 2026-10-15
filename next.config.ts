import type { NextConfig } from "next";

/**
 * Background presets before #12 were misnamed JPEGs (`chicago.jpg` showed London). Share URLs carry
 * the image path, so old paths point at the same photo where it was kept, else the closest preset.
 */
const LEGACY_BACKGROUNDS: Record<string, string> = {
  "chicago.jpg": "london.avif",
  "toronto-day.jpg": "chicago.avif",
  "toronto-night.jpg": "toronto.avif",
  "vancouver.jpg": "swiss-alps.avif",
  "new-york-night.jpg": "new-york.avif",
  "new-york-day.jpg": "new-york.avif",
  "seattle-night.jpg": "new-york.avif",
  "seattle-day.jpg": "seoul.avif",
  "los-angeles.jpg": "chicago.avif",
  "montreal.jpg": "toronto.avif",
};

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return Object.entries(LEGACY_BACKGROUNDS).map(([from, to]) => ({
      source: `/backgrounds/${from}`,
      destination: `/backgrounds/${to}`,
      permanent: true,
    }));
  },
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
