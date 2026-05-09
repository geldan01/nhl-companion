import { expect, test } from "@playwright/test";

test.describe("Now watching pill lifecycle", () => {
  test("pick a game from scoreboard, navigate around, click pill, clear it", async ({
    page,
  }) => {
    // Start at scoreboard. The header pill should NOT be present yet
    // (no game has been picked).
    await page.goto("/");
    const header = page.locator("header").first();
    await expect(header).toBeVisible();
    await expect(header.locator('a[href^="/game/"]')).toHaveCount(0);

    // Pick the first game on the scoreboard.
    const firstCard = page.locator('main a[href^="/game/"]').first();
    const cardHref = await firstCard.getAttribute("href");
    await firstCard.click();
    await expect(page).toHaveURL(new RegExp(cardHref ?? "/game/"));

    // The pill in the header now points to the same game. Use a precise
    // selector — the header has its own anchor to the watched game.
    const pillLink = header.locator(`a[href="${cardHref}"]`);
    await expect(pillLink).toBeVisible();

    // Navigate to /standings via the in-app nav (client-side; preserves React
    // state). page.goto would do a full page load and reset WatchingProvider.
    await page.getByRole("link", { name: /^standings$/i }).first().click();
    await expect(page).toHaveURL(/\/standings/);
    await expect(pillLink).toBeVisible();

    // Click the pill: back at /game/[id].
    await pillLink.click();
    await expect(page).toHaveURL(new RegExp(cardHref ?? "/game/"));

    // Click the X on the score header: clears the pill and routes to /.
    await page.getByRole("button", { name: /stop watching this game/i }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(header.locator('a[href^="/game/"]')).toHaveCount(0);
  });
});
