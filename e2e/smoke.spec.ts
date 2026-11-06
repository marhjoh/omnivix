import { expect, test, type Page } from "@playwright/test";
import { fakeGithub, USERNAME } from "./github";
import { ADMIN_PASSWORD } from "../playwright.config";

/** Collects errors the page throws or logs to the console. */
function pageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

const preview = (page: Page) => page.locator(".omnivix-artboard");
const download = (page: Page) => page.getByRole("button", { name: /^Download / });

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

test("the quote banner loads and downloads as a PNG", async ({ page }) => {
  const errors = pageErrors(page);
  await page.goto("/studio/quote-banner");
  await expect(preview(page)).toHaveAttribute("data-state", "ready");
  await expect(download(page)).toBeEnabled();

  const [file] = await Promise.all([page.waitForEvent("download"), download(page).click()]);
  expect(file.suggestedFilename()).toMatch(/\.png$/);
  const bytes = await (await file.createReadStream()).toArray();
  expect(Buffer.concat(bytes).subarray(0, 4)).toEqual(PNG_SIGNATURE);
  expect(errors).toEqual([]);
});

test("an image URL returns the banner, cached by the CDN", async ({ request }) => {
  const response = await request.get("/banner/quote-banner.png");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe(
    "public, s-maxage=86400, stale-while-revalidate=604800",
  );
  expect((await response.body()).subarray(0, 4)).toEqual(PNG_SIGNATURE);
});

test("the export panel copies the banner's image URL as Markdown", async ({
  page,
  context,
  request,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/studio/quote-banner");
  await expect(preview(page)).toHaveAttribute("data-state", "ready");
  await page.getByRole("button", { name: /^Export options/ }).click();
  await page.getByRole("button", { name: "Markdown", exact: true }).click();
  await expect(page.getByText("Markdown copied.")).toBeVisible();

  const markdown = await page.evaluate(() => navigator.clipboard.readText());
  const [, url] = /^!\[Quote Banner\]\((\S+)\)$/.exec(markdown) ?? [];
  expect(url).toMatch(/\/banner\/quote-banner\.png/);
  const image = await request.get(url);
  expect(image.status()).toBe(200);
  expect((await image.body()).subarray(0, 4)).toEqual(PNG_SIGNATURE);
});

test.describe("GitHub banners", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      { name: "omnivix-username", value: USERNAME, url: "http://localhost:3100" },
    ]);
  });

  for (const templateId of ["github-banner", "repos-banner", "contribution-banner"]) {
    test(`${templateId} loads with its data`, async ({ page }) => {
      const errors = pageErrors(page);
      await fakeGithub(page, () => "data");
      await page.goto(`/studio/${templateId}`);
      await expect(preview(page)).toHaveAttribute("data-state", "ready");
      await expect(download(page)).toBeEnabled();
      expect(errors).toEqual([]);
    });
  }

  test("an unknown user offers to change the username", async ({ page }) => {
    await fakeGithub(page, () => "not-found");
    await page.goto("/studio/github-banner");
    await expect(preview(page)).toContainText(`No GitHub user named @${USERNAME}`);
    await expect(page.getByRole("button", { name: "Change username" })).toBeVisible();
    await expect(download(page)).toBeDisabled();
  });

  test("GitHub's rate limit says when to try again", async ({ page }) => {
    await fakeGithub(page, () => "rate-limited");
    await page.goto("/studio/github-banner");
    await expect(preview(page)).toContainText("GitHub's limit is reached");
    await expect(page.getByRole("button", { name: "Try again" })).toBeDisabled();
  });

  test("a network error recovers with Try again", async ({ page }) => {
    let answer: "offline" | "data" = "offline";
    await fakeGithub(page, () => answer);
    await page.goto("/studio/github-banner");
    await expect(preview(page)).toContainText("Couldn't load GitHub data");

    answer = "data";
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(preview(page)).toHaveAttribute("data-state", "ready");
    await expect(download(page)).toBeEnabled();
  });
});

test.describe("admin stats", () => {
  for (const path of ["/admin", "/admin/stats.csv"]) {
    test(`asks for the password on ${path}`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(401);
      expect(response.headers()["www-authenticate"]).toMatch(/^Basic /);
    });
  }

  test("opens with the password", async ({ browser }) => {
    const context = await browser.newContext({
      httpCredentials: { username: "admin", password: ADMIN_PASSWORD },
    });
    const page = await context.newPage();
    const errors = pageErrors(page);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Stats" })).toBeVisible();
    // The smoke tests run without a store.
    await expect(page.getByText("No Redis store is connected")).toBeVisible();
    await page.getByRole("link", { name: "7 days" }).click();
    await expect(page.getByRole("link", { name: "7 days" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(errors).toEqual([]);
    await context.close();
  });
});
