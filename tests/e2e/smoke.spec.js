import { expect, test } from "@playwright/test";

test("main menu, new game flow, board, HUD, and settings menu work", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Star Odyssey" })).toBeVisible();
  await expect(page.getByText("Ein digitales Weltraum-Brettspiel")).toBeVisible();

  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.getByText("A digital space board game")).toBeVisible();

  await page.getByRole("button", { name: "New Game" }).click();
  await expect(page.getByRole("heading", { name: "Select number of players" })).toBeVisible();

  await page.getByRole("button", { name: "2 players" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Connect controllers" })).toBeVisible();
  await page.getByRole("button", { name: "Start game now" }).click();

  await expect(page.locator(".board-placeholder")).toBeVisible();
  await expect(page.locator(".board-event-log")).toBeVisible();
  await expect(page.getByRole("button", { name: "Player 1" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Player 2" })).toBeVisible();

  await page.screenshot({ path: "test-results/screenshots/board.png", fullPage: true });

  await page.getByRole("button", { name: "Player 1" }).click();
  await expect(page.locator(".player-hud-panel")).toBeVisible();
  await expect(page.getByRole("button", { name: "Turn" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Log" })).toHaveCount(0);
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.locator(".player-hud-panel")).toHaveCount(0);

  await page.getByRole("button", { name: "⚙" }).click();
  await expect(page.getByRole("heading", { name: "Menu" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
});

test("card debug review pages load and filter cards", async ({ page }) => {
  await page.goto("/debug-friendship-cards.html");
  await expect(page.getByRole("heading", { name: "Freundschaftskarten" })).toBeVisible();
  await expect(page.locator("#card-list details").first()).toBeVisible();
  await page.locator("#card-search").fill("diplomats");
  await expect(page.locator("#card-list details").first()).toBeVisible();

  await page.goto("/debug-encounter-cards.html");
  await expect(page.getByRole("heading", { name: "Begegnungskarten" })).toBeVisible();
  await expect(page.locator("#card-list details").first()).toBeVisible();
  await expect(page.locator("#encounter-simulator")).toBeVisible();
  await page.locator("#card-search").fill("pirate");
  await expect(page.locator("#card-list details").first()).toBeVisible();
});

test("outpost debug page loads and exports layout", async ({ page }) => {
  await page.goto("/debug-outposts.html");

  await expect(page.getByRole("heading", { name: "Außenposten Debug" })).toBeVisible();
  await expect(page.locator("#debug-stage")).toBeVisible();
  await expect(page.locator(".debug-object--outpost")).toBeVisible();
  await expect(page.locator('nav a[href="./debug-upgrades.html"]')).toBeVisible();
  await expect(page.locator('nav a[href="./debug-outposts.html"]')).toHaveAttribute("aria-current", "page");
  await expect(page.locator('nav a[href="./debug-friendship-cards.html"]')).toBeVisible();
  await expect(page.locator('nav a[href="./debug-encounter-cards.html"]')).toBeVisible();

  await page.locator("#layout-variant").selectOption("oneTop");
  await expect(page.locator("#layout-variant")).toHaveValue("oneTop");

  await page.locator("#station-count").selectOption("5");
  await expect(page.locator(".debug-object--tradeStation")).toHaveCount(5);
  await expect(page.locator("#station-asset-5")).toBeVisible();

  await page.locator(".debug-object--outpost").click();
  await page.locator("#control-scale").fill("1.1");
  await page.locator("#save-layout").click();
  await expect(page.locator("#export-output")).toHaveValue(/"source": "debug-outposts\.html"/);
  await expect(page.locator("#export-output")).toHaveValue(/"layoutVariant": "oneTop"/);
  await expect(page.locator("#export-output")).toHaveValue(/"stationCount": 5/);
});
