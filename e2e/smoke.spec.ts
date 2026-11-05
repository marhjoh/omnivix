import { expect, test, type Page } from "@playwright/test";
import { fakeGithub, USERNAME } from "./github";

/** Errors the page throws or logs; a smoke test should end with none. */
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

test("the quote banner loads and downloads as a PNG", async ({ page }) => {
  const errors = pageErrors(page);
  await page.goto("/studio/quote-banner");
  await expect(preview(page)).toHaveAttribute("data-state", "ready");
  await expect(download(page)).toBeEnabled();

  const [file] = await Promise.all([page.waitForEvent("download"), download(page).click()]);
  expect(file.suggestedFilename()).toMatch(/\.png$/);
  const bytes = await (await file.createReadStream()).toArray();
  // A PNG starts with its signature: \x89PNG.
  expect(Buffer.concat(bytes).subarray(0, 4)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  expect(errors).toEqual([]);
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
