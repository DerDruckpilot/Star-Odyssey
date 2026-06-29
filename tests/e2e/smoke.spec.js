import { expect, test } from "@playwright/test";

test("main menu, QR controller lobby, board, and phone menu work", async ({ page }) => {
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

  const popupPromise = page.waitForEvent("popup");
  await page.locator(".qr-card").first().click();
  const popup = await popupPromise;
  await popup.waitForLoadState("domcontentloaded");
  const popupUrl = new URL(popup.url());
  const qrUrl = new URL(controllerUrls[0]);
  expect(`${popupUrl.origin}${popupUrl.pathname}`).toBe(`${qrUrl.origin}${qrUrl.pathname}`);
  expect(popupUrl.searchParams.get("session")).toBe(qrUrl.searchParams.get("session"));
  expect(popupUrl.searchParams.get("player")).toBe("1");
  expect(popupUrl.searchParams.get("testWindow")).toBe("iphone16promax-landscape");
  await popup.close();

  const controllerOne = await page.context().newPage();
  const controllerTwo = await page.context().newPage();

  await controllerOne.goto(controllerUrls[0]);
  await controllerTwo.goto(controllerUrls[1]);
  await expect(controllerOne.getByText("Verbunden als Spieler 1")).toBeVisible();
  await expect(controllerTwo.getByText("Verbunden als Spieler 2")).toBeVisible();

  await controllerOne.getByLabel("Name").fill("Alice");
  await controllerOne.getByRole("button", { name: "Red" }).click();
  await controllerOne.getByRole("button", { name: "Bereit" }).click();
  await expect(page.getByText("Alice is ready")).toBeVisible();

  await controllerTwo.getByLabel("Name").fill("Bob");
  await controllerTwo.getByRole("button", { name: "Blue" }).click();
  await controllerTwo.getByRole("button", { name: "Bereit" }).click();

  await expect(page.locator(".board-placeholder")).toBeVisible();
  await expect(page.locator(".board-event-log")).toBeVisible();
  await expect(page.getByRole("button", { name: "Player 1" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "⚙" })).toHaveCount(0);

  await page.screenshot({ path: "test-results/screenshots/board.png", fullPage: true });

  await controllerOne.getByRole("button", { name: "Handeln" }).click();
  await expect(controllerOne.getByRole("heading", { name: "Handeln" })).toBeVisible();
  await expect(controllerOne.getByRole("button", { name: "Spielfeld" })).toBeVisible();
  await expect(controllerOne.getByRole("button", { name: "Einstellungen" })).toBeVisible();
  await expect(controllerTwo.getByRole("button", { name: "Einstellungen" })).toHaveCount(0);
  await controllerOne.getByRole("button", { name: "Spielfeld" }).click();
  await expect(controllerOne.locator(".controller-board-viewport")).toBeVisible();
  await expect(controllerOne.getByRole("button", { name: "Zurück zum Menü" })).toBeVisible();

  await controllerOne.close();
  await controllerTwo.close();
});

test("card debug review pages load and filter cards", async ({ page }) => {
  await page.goto("/debug-friendship-cards.html");
  await expect(page.getByRole("heading", { name: "Freundschaftskarten" })).toBeVisible();
  await expect(page.locator("#card-list details").first()).toBeVisible();
  await page.locator("#card-search").fill("diplomats");
  await expect(page.locator("#card-list details").first()).toBeVisible();

  await page.goto("/debug-encounter-cards.html");
  await expect(page.getByRole("heading", { name: "Begegnungskarten" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Spielfeld-Vorschau" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Spieler-Menü-Vorschau" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Begegnungen" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Editor" })).toBeVisible();
  await expect(page.locator("#card-list details").first()).toBeVisible();
  await expect(page.locator("#encounter-simulator")).toBeVisible();
  await expect(page.locator('nav a[href="./menu-preview.html"]')).toBeVisible();
  await expect(page.locator("#card-list details")).toHaveCount(32);
  await page.getByRole("button", { name: "Simulation starten" }).click();
  await page.locator(".encounter-preview-actions button").first().click();
  await expect(page.locator(".debug-sim-history")).toBeVisible();
  await page.getByRole("button", { name: "Export selected encounter" }).click();
  await expect(page.locator("#export-output")).toHaveValue(/"encounterNumber": 1/);
  await page.locator("#card-search").fill("pirate");
  await expect(page.locator("#card-list details").first()).toBeVisible();

  await page.goto("/debug-encounter-simulator.html");
  await expect(page.getByRole("heading", { name: "Encounter Simulator" })).toBeVisible();
  await expect(page.locator(".encounter-sim-board-stage")).toBeVisible();
  await expect(page.locator("#sim-controller")).toBeVisible();
  await page.locator("#encounter-menu-toggle").click();
  await expect(page.locator(".encounter-review-row")).toHaveCount(32);
  await page.locator(".encounter-review-row input").first().check();
  await page.reload();
  await page.locator("#encounter-menu-toggle").click();
  await expect(page.locator(".encounter-review-row input").first()).toBeChecked();
  await page.locator(".encounter-review-row").nth(1).click();
  await expect(page.locator("#sim-controller")).toContainText("2.");
  await page.locator(".encounter-sim-actions button").first().click();
  await expect(page.locator(".encounter-sim-history")).toBeVisible();
});

test("menu preview loads processed assets and live layout controls", async ({ page }) => {
  await page.goto("/menu-preview.html");

  await expect(page.locator(".menu-preview-scene")).toBeVisible();
  await expect(page.getByRole("button", { name: "Neues Spiel" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Spiel laden" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Spiel beenden" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Einstellungen" })).toBeVisible();
  await expect(page.locator(".menu-title-stack__logo")).toBeVisible();
  await expect(page.locator(".menu-deco--planet")).toBeVisible();
  await expect(page.locator(".menu-deco--galaxy")).toBeVisible();
  await expect(page.locator('a[href="./debug-upgrades.html"]')).toBeVisible();
  await expect(page.locator('a[href="./debug-encounter-cards.html"]')).toBeVisible();
  await expect(page.locator("#layout-json")).toHaveValue(/"buttons"/);

  await page.locator('input[data-group="logo"][data-field="scale"][type="number"]').fill("1.1");
  await expect(page.locator("#layout-json")).toHaveValue(/"scale": 1.1/);

  const manifestResponse = await page.request.get("/public/assets/ui/menu/processed/menu-assets.manifest.json");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest.assets.length).toBeGreaterThanOrEqual(28);
  for (const asset of manifest.assets) {
    const response = await page.request.get(`/${asset.finalPath}`);
    expect(response.ok(), `${asset.assetKey} exists`).toBe(true);
  }
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
  await expect(page.locator('nav a[href="./menu-preview.html"]')).toBeVisible();

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
