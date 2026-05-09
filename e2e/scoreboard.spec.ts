import { expect, test } from "@playwright/test";

test.describe("Scoreboard", () => {
  test("loads the scoreboard and lists today's games", async ({ page }) => {
    await page.goto("/");
    // Wait for at least one game card link to appear (renders post-fetch).
    const gameLink = page.locator('a[href^="/game/"]').first();
    await expect(gameLink).toBeVisible();
  });

  test("clicking a game card navigates to /game/[id]", async ({ page }) => {
    await page.goto("/");
    const gameLink = page.locator('a[href^="/game/"]').first();
    await expect(gameLink).toBeVisible();
    const href = await gameLink.getAttribute("href");
    await gameLink.click();
    await expect(page).toHaveURL(new RegExp(href ?? "/game/"));
  });
});
