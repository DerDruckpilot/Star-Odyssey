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
