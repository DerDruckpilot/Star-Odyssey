import { expect, test } from "@playwright/test";

test("main menu, QR controller lobby, board, and phone menu work", async ({ page, browser }) => {
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
  const controllerUrls = await page.locator(".qr-url").allTextContents();
  expect(controllerUrls).toHaveLength(2);
  expect(controllerUrls[0]).toContain("/controller.html?session=");
  expect(controllerUrls[0]).toContain("player=1");
  expect(controllerUrls[0]).not.toContain("localhost");

  const controllerOneContext = await browser.newContext();
  const controllerTwoContext = await browser.newContext();
  const controllerOne = await controllerOneContext.newPage();
  const controllerTwo = await controllerTwoContext.newPage();

  await controllerOne.goto(controllerUrls[0]);
  await controllerTwo.goto(controllerUrls[1]);
  await expect(controllerOne.getByText("Verbunden als Spieler 1")).toBeVisible();
  await expect(controllerTwo.getByText("Verbunden als Spieler 2")).toBeVisible();

  await controllerOne.getByLabel("Name").fill("Alice");
  await controllerOne.getByRole("button", { name: "Red" }).click();
  await controllerOne.getByRole("button", { name: "Bereit" }).click();

  await controllerTwo.getByLabel("Name").fill("Bob");
  await controllerTwo.getByRole("button", { name: "Blue" }).click();
  await controllerTwo.getByRole("button", { name: "Bereit" }).click();

  await expect(page.locator(".board-placeholder")).toBeVisible();
  await expect(page.locator(".board-event-log")).toBeVisible();
  await expect(page.getByRole("button", { name: "Player 1" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "⚙" })).toHaveCount(0);

  await page.screenshot({ path: "test-results/screenshots/board.png", fullPage: true });

  await expect(controllerOne.getByRole("button", { name: "Spielfeld" })).toBeVisible();
  await controllerOne.getByRole("button", { name: "Spielfeld" }).click();
  await expect(controllerOne.locator(".controller-board-viewport")).toBeVisible();
  await expect(controllerOne.getByRole("button", { name: "Einstellungen" })).toBeVisible();
  await expect(controllerTwo.getByRole("button", { name: "Einstellungen" })).toHaveCount(0);

  await controllerOneContext.close();
  await controllerTwoContext.close();
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
  await expect(page.locator('nav a[href="./debug-colonies.html"]')).toBeVisible();
  await expect(page.locator('nav a[href="./debug-spaceports.html"]')).toBeVisible();
  await expect(page.locator('nav a[href="./debug-friendship-cards.html"]')).toBeVisible();
  await expect(page.locator('nav a[href="./debug-encounter-cards.html"]')).toBeVisible();

  await page.locator("#layout-variant").selectOption("oneTopTwoBottom");
  await expect(page.locator("#layout-variant")).toHaveValue("oneTopTwoBottom");

  await expect(page.locator(".debug-object--tradeStation")).toHaveCount(5);

  await page.locator(".debug-object--outpost").click();
  await page.locator("#control-scale").fill("1.1");
  await page.locator("#save-layout").click();
  await expect(page.locator("#export-output")).toHaveValue(/"source": "debug-outposts\.html"/);
  await expect(page.locator("#export-output")).toHaveValue(/"layoutType": "oneTopTwoBottom"/);
  await expect(page.locator("#export-output")).toHaveValue(/"tradeStationSlots": \[/);
  await expect(page.locator("#export-output")).toHaveValue(/"id": "station-slot-5"/);
});

test("player colony and spaceport debug pages load and export layouts", async ({ page }) => {
  const pages = [
    {
      path: "/debug-colonies.html",
      heading: "Kolonien Debug",
      objectClass: ".debug-object--colony",
      source: "debug-colonies.html"
    },
    {
      path: "/debug-spaceports.html",
      heading: "Raumhäfen Debug",
      objectClass: ".debug-object--spaceport",
      source: "debug-spaceports.html"
    }
  ];

  for (const debugPage of pages) {
    await page.goto(debugPage.path);
    await expect(page.getByRole("heading", { name: debugPage.heading })).toBeVisible();
    await expect(page.locator("#debug-stage")).toBeVisible();
    await expect(page.locator(".debug-dummy-planet")).toHaveCount(3);
    await expect(page.locator(debugPage.objectClass)).toHaveCount(3);
    await expect(page.locator('nav a[href="./debug-colonies.html"]')).toBeVisible();
    await expect(page.locator('nav a[href="./debug-spaceports.html"]')).toBeVisible();

    await page.locator("#layout-variant").selectOption("layoutB");
    await expect(page.locator("#layout-variant")).toHaveValue("layoutB");
    await expect(page.locator(debugPage.objectClass)).toHaveCount(3);
    await page.locator(debugPage.objectClass).nth(1).click();
    await expect(page.locator("#selected-title")).toContainText("Position 2");
    await page.locator("#control-scale").fill("1.1");
    await page.locator("#save-layout").click();
    await expect(page.locator("#export-output")).toHaveValue(new RegExp(`"source": "${debugPage.source.replace(".", "\\.")}"`));
    await expect(page.locator("#export-output")).toHaveValue(/"layoutA": \{\s+"positions": \[/);
    await expect(page.locator("#export-output")).toHaveValue(/"layoutB": \{\s+"positions": \[/);
    await expect(page.locator("#export-output")).toHaveValue(/"id": ".*-site-3"/);
    await expect(page.locator("#export-output")).toHaveValue(/"z": 32/);
  }
});
