import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";
import { fakeGithub, USERNAME } from "./github";
import { encodeAiUsage, USAGE_DAYS } from "@/src/banner/aiUsage";
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

test("the tech stack banner adds an icon found by search", async ({ page }) => {
  const errors = pageErrors(page);
  await page.goto("/studio/tech-stack-banner");
  await expect(preview(page)).toHaveAttribute("data-state", "ready");

  await page.getByRole("combobox", { name: "Icons" }).fill("rust");
  await page.getByRole("option", { name: "Rust", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove Rust" })).toBeVisible();
  await expect(preview(page).getByText("Rust", { exact: true })).toBeVisible();
  await expect(download(page)).toBeEnabled();
  expect(errors).toEqual([]);
});

test("the intro banner shows a typed name and link without GitHub data", async ({ page }) => {
  const errors = pageErrors(page);
  await page.goto("/studio/intro-banner");
  await expect(preview(page)).toHaveAttribute("data-state", "ready");

  await page.getByLabel("Name", { exact: true }).fill("Ada Lovelace");
  await page.getByLabel("Website", { exact: true }).fill("https://ada.dev/");
  await expect(preview(page).getByText("Ada Lovelace", { exact: true })).toBeVisible();
  await expect(preview(page).getByText("ada.dev", { exact: true })).toBeVisible();
  await expect(download(page)).toBeEnabled();
  expect(errors).toEqual([]);
});

test("the AI usage banner reads ccusage output pasted in its dialog", async ({ page }) => {
  const errors = pageErrors(page);
  await page.goto("/studio/ai-usage-banner");
  const dialog = page.getByRole("dialog", { name: "Add your AI usage" });
  const field = dialog.getByLabel("ccusage output");
  await expect(field).toBeFocused();

  await expect(dialog.getByRole("button", { name: "Use usage" })).toBeDisabled();
  await field.fill("not ccusage");
  await dialog.getByRole("button", { name: "Use usage" }).click();
  await expect(page.getByText("This isn't JSON.")).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(preview(page)).toContainText("Add your AI usage");
  await expect(download(page)).toBeDisabled();

  await page.getByRole("button", { name: "Add usage", exact: true }).click();
  await field.fill(
    JSON.stringify({
      daily: [
        {
          date: "2026-10-01",
          totalTokens: 5000,
          totalCost: 3.2,
          modelBreakdowns: [{ modelName: "claude-haiku-4-5-20251001", inputTokens: 5000 }],
        },
      ],
    }),
  );
  await dialog.getByRole("button", { name: "Use usage" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("This isn't JSON.")).toBeHidden();
  await expect(preview(page)).toHaveAttribute("data-state", "ready");
  await expect(preview(page).getByText("Haiku 4.5")).toBeVisible();
  await expect(page.getByRole("button", { name: "AI usage Oct 1, 2026" })).toBeVisible();
  await expect(download(page)).toBeEnabled();
  expect(errors).toEqual([]);
});

test("a studio link with AI usage renders the same on the server and in the browser", async ({
  page,
}) => {
  const errors = pageErrors(page);
  const usage = encodeAiUsage({
    end: "2026-11-07",
    levels: "0".repeat(USAGE_DAYS - 40) + "2".repeat(40),
    tokens: 5000,
    cost: 3,
    models: [{ name: "Opus 5.5", percent: 100 }],
    agents: [{ name: "Claude Code", percent: 100 }],
  });
  await page.goto(`/studio/ai-usage-banner?usage=${encodeURIComponent(usage)}`);
  await expect(preview(page)).toHaveAttribute("data-state", "ready");
  await expect(page.getByRole("button", { name: "AI usage Sep 29 – Nov 7, 2026" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("a transparent image URL has no background color", async ({ request }) => {
  const response = await request.get("/banner/quote-banner.png?transparent=true");
  expect(response.status()).toBe(200);
  // The corner is outside the quote, so only the background color could fill it.
  const { data } = await sharp(await response.body())
    .ensureAlpha()
    .extract({ left: 0, top: 0, width: 1, height: 1 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  expect(data[3]).toBe(0);
});

test("picking Transparent shows the preview over a checkerboard", async ({ page }) => {
  await page.goto("/studio/quote-banner");
  await expect(preview(page)).toHaveAttribute("data-state", "ready");
  await expect(preview(page)).not.toHaveAttribute("data-transparent");
  await page.getByRole("button", { name: /^Export options/ }).click();
  await page.getByRole("button", { name: /^Transparent/ }).click();
  await expect(preview(page)).toHaveAttribute("data-transparent");
  await expect(download(page)).toHaveAccessibleName("Download transparent PNG");
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
  expect(image.headers()["cache-control"]).toBe(
    "public, s-maxage=86400, stale-while-revalidate=604800",
  );
  expect((await image.body()).subarray(0, 4)).toEqual(PNG_SIGNATURE);
});

test.describe("GitHub banners", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      { name: "omnivix-username", value: USERNAME, url: "http://localhost:3100" },
    ]);
  });

  for (const templateId of [
    "github-banner",
    "repos-banner",
    "stats-banner",
    "terminal-banner",
    "contribution-banner",
  ]) {
    test(`${templateId} loads with its data`, async ({ page }) => {
      const errors = pageErrors(page);
      await fakeGithub(page, () => "data");
      await page.goto(`/studio/${templateId}`);
      await expect(preview(page)).toHaveAttribute("data-state", "ready");
      await expect(download(page)).toBeEnabled();
      expect(errors).toEqual([]);
    });
  }

  test("a studio link draws text in the contribution grid", async ({ page }) => {
    const errors = pageErrors(page);
    await fakeGithub(page, () => "data");
    await page.goto("/studio/contribution-banner?gridText=Hi%202026");
    await expect(preview(page)).toHaveAttribute("data-state", "ready");
    await expect(page.getByLabel("Text", { exact: true })).toHaveValue("Hi 2026");
    await expect(page.getByRole("button", { name: "Contributions" })).toBeVisible();
    expect(errors).toEqual([]);
  });

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
