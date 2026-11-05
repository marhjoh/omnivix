import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/**
 * Smoke tests against a production build (`pnpm build` first). The server runs without secrets,
 * like CI: tests fake GitHub's data in the browser, the rate limits are off, and export tokens use
 * the per-process secret.
 */
export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    // Empty values win over .env.local (Next only fills variables that aren't set).
    env: {
      GITHUB_TOKEN: "",
      EXPORT_TOKEN_SECRET: "",
      UPSTASH_REDIS_REST_URL: "",
      UPSTASH_REDIS_REST_TOKEN: "",
      KV_REST_API_URL: "",
      KV_REST_API_TOKEN: "",
    },
  },
});
