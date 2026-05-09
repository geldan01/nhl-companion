import { expect, test } from "@playwright/test";

const FIXTURE_GAME_ID = 2025030221;

test.describe("Game detail", () => {
  test("score header renders on game detail page", async ({ page }) => {
    await page.goto(`/game/${FIXTURE_GAME_ID}`);
    const header = page.getByRole("banner", { name: /game header/i });
    await expect(header).toBeVisible();
    // Fixture: PHI 0, CAR 3 — both score values visible inside the header.
    await expect(header.getByText("0")).toBeVisible();
    await expect(header.getByText("3")).toBeVisible();
  });

  test("on a mobile viewport all three tabs are reachable", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(`/game/${FIXTURE_GAME_ID}`);
    await expect(page.getByRole("tab", { name: /plays/i })).toBeVisible();
    await page.getByRole("tab", { name: /box/i }).click();
    await expect(page.getByRole("tab", { name: /box/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.getByRole("tab", { name: /shots/i }).click();
    await expect(page.getByRole("tab", { name: /shots/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("on a desktop viewport all three panes are reachable simultaneously", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/game/${FIXTURE_GAME_ID}`);
    // No tabs on desktop; instead, all three panes share the same screen.
    await expect(page.getByRole("tab", { name: /plays/i })).toHaveCount(0);
    await expect(page.getByText(/team stats/i)).toBeVisible();
    await expect(page.getByText(/Shot map lands in Phase 4/i)).toBeVisible();
  });
});
