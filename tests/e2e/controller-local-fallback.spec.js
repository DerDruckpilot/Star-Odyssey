import { expect, test } from "@playwright/test";

async function disableRelay(page) {
  await page.routeWebSocket("**/ws", (webSocket) => webSocket.close());
}

async function openTwoPlayerLobby(page) {
  await page.goto("/?resetAutosave=1");
  await page.getByRole("button", { name: "Neues Spiel", exact: true }).click();
  await page.getByRole("button", { name: "2 Spieler", exact: true }).click();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Controller verbinden", exact: true })).toBeVisible();
}

test("local controllers remain ready when the websocket relay is unavailable", async ({ browser }) => {
  test.setTimeout(60000);
  const context = await browser.newContext();
  const host = await context.newPage();
  await disableRelay(host);
  await openTwoPlayerLobby(host);

  const controllerUrls = await host.locator(".qr-url").allTextContents();
  const controllerOne = await context.newPage();
  const controllerTwo = await context.newPage();
  await disableRelay(controllerOne);
  await disableRelay(controllerTwo);
  await controllerOne.goto(controllerUrls[0]);
  await controllerTwo.goto(controllerUrls[1]);

  await expect(controllerOne.locator(".controller-status")).toHaveText("Verbunden");
  await expect(controllerTwo.locator(".controller-status")).toHaveText("Verbunden");

  await controllerOne.getByLabel("Name", { exact: true }).fill("Alice");
  await controllerOne.getByRole("button", { name: "Rot", exact: true }).click();
  await controllerOne.getByRole("button", { name: "Bereit", exact: true }).click();
  await controllerTwo.getByLabel("Name", { exact: true }).fill("Bob");
  await controllerTwo.getByRole("button", { name: "Blau", exact: true }).click();
  await controllerTwo.getByRole("button", { name: "Bereit", exact: true }).click();

  await expect(host.getByText("Spieler verbunden: 2/2", { exact: true })).toBeVisible();
  await expect(host.getByRole("button", { name: "Spiel starten", exact: true })).toHaveCount(0);
  await expect(host.locator(".board-placeholder")).toBeVisible({ timeout: 30000 });

  await context.close();
});
