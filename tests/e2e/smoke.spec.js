import { expect, test } from "@playwright/test";

test("main menu, QR controller lobby, board, and phone menu work", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator(".main-menu-scene")).toBeVisible();
  await expect(page.locator('[data-menu-layer="logo"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Neues Spiel" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Spiel laden" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Spiel beenden" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Einstellungen" })).toBeVisible();
  await expect(page.getByRole("button", { name: "EN", exact: true })).toHaveCount(0);
  await expect(page.getByText("Ein digitales Weltraum-Brettspiel")).toHaveCount(0);

  await page.getByRole("button", { name: "Einstellungen" }).click();
  await expect(page.getByRole("heading", { name: "Menü" })).toBeVisible();
  await page.getByRole("button", { name: "Schließen" }).click();

  await page.getByRole("button", { name: "Neues Spiel" }).click();
  await expect(page.getByRole("heading", { name: "Spieleranzahl wählen" })).toBeVisible();

  await page.getByRole("button", { name: "2 Spieler" }).click();
  await page.getByRole("button", { name: "Weiter" }).click();

  await expect(page.getByRole("heading", { name: "Controller verbinden" })).toBeVisible();
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
  await controllerOne.getByRole("button", { name: "Rot" }).click();
  await controllerOne.getByRole("button", { name: "Bereit" }).click();
  await expect(page.getByText("Alice ist bereit")).toBeVisible();

  await controllerTwo.getByLabel("Name").fill("Bob");
  await controllerTwo.getByRole("button", { name: "Blau" }).click();
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

test("main menu uses a 16:9 stage and shows a portrait rotate hint", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  const scene = page.locator(".main-menu-scene");
  await expect(scene).toBeVisible();
  const desktopBox = await scene.boundingBox();
  expect(desktopBox?.width).toBeGreaterThan(1270);
  expect(Math.abs((desktopBox.width / desktopBox.height) - (16 / 9))).toBeLessThan(0.02);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".main-menu-rotate-hint")).toBeVisible();
  await expect(scene).toBeHidden();

  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/");
  await expect(scene).toBeVisible();
  await expect(page.locator(".main-menu-rotate-hint")).toBeHidden();
});

test("TV remote focus reaches setup and the controller PWA shell is valid", async ({ page }) => {
  await page.goto("/");
  const newGame = page.getByRole("button", { name: "Neues Spiel" });
  await expect(newGame).toBeFocused();
  await expect(page.getByRole("heading", { name: "Star Odyssey" })).toHaveCount(1);

  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("button", { name: "Spiel laden" })).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Spieleranzahl wählen" })).toBeVisible();
  await expect(page.getByRole("button", { name: "2 Spieler" })).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "2 Spieler" })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("button", { name: "Klassisches Spiel" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("button", { name: "Zurück" })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "Weiter" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Controller verbinden" })).toBeVisible();

  const manifestResponse = await page.request.get("/controller.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.orientation).toBe("landscape");
  expect(manifest.icons).toHaveLength(2);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/controller.html?session=TEST&player=1");
  await expect(page.locator(".controller-orientation-hint")).toBeVisible();
  await expect(page.locator("#controller-root")).toBeHidden();
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
  await expect(page.getByRole("button", { name: "Passiver Spieler" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Unbeteiligter Spieler" })).toBeVisible();
  await expect(page.locator("#card-list details").first()).toBeVisible();
  await expect(page.locator("#encounter-simulator")).toBeVisible();
  await expect(page.locator('nav a[href="./menu-preview.html"]')).toBeVisible();
  await expect(page.locator('nav a[href="./menu-button-preview.html"]')).toBeVisible();
  await expect(page.locator("#card-list details")).toHaveCount(32);
  await page.getByRole("button", { name: "Simulation starten" }).click();
  await page.locator(".encounter-preview-actions button").first().click();
  await expect(page.locator(".debug-sim-history")).toBeVisible();
  await page.getByRole("button", { name: "Export selected encounter" }).click();
  await expect(page.locator("#export-output")).toHaveValue(/"encounterNumber": 1/);
  await page.getByRole("button", { name: "Passiver Spieler" }).click();
  await expect(page.locator("#encounter-simulator")).toContainText(/Passiver|passive/);
  await page.getByRole("button", { name: "Unbeteiligter Spieler" }).click();
  await expect(page.locator("#encounter-simulator")).toContainText(/Unbeteiligter|Begegnung/);
  await page.getByRole("button", { name: "Aktiver Spieler" }).click();
  await page.getByRole("button", { name: "Step hinzufügen" }).click();
  await expect(page.locator("#step-editor")).toContainText("new_step");
  await page.locator("#add-active-choice").click();
  await expect(page.locator("#step-editor")).toContainText("Choice 1");
  await page.locator("#add-active-effect").click();
  await expect(page.locator("#step-editor")).toContainText("Effekt 1");
  const storedEncounterFlows = await page.evaluate(() => localStorage.getItem("starOdyssey.debug.encounterFlows.v1"));
  expect(storedEncounterFlows).toContain("new_step");
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
  await expect(page.locator('[data-menu-layer="logo"]')).toBeVisible();
  await expect(page.locator('[data-menu-layer="planet"]')).toBeVisible();
  await expect(page.locator('[data-menu-layer="galaxy"]')).toBeVisible();
  await expect(page.locator('[data-menu-layer="frame_corner_top_right"]')).toBeVisible();
  await expect(page.locator('a[href="./debug-upgrades.html"]')).toBeVisible();
  await expect(page.locator('a[href="./debug-encounter-cards.html"]')).toBeVisible();
  await expect(page.locator('a[href="./menu-button-preview.html"]')).toBeVisible();
  await expect(page.locator("#layout-json")).toHaveValue(/"buttons_group"/);
  await expect(page.locator("#apply-layout")).toBeVisible();
  await expect(page.locator("#download-layout")).toBeVisible();

  await page.locator('input[data-group="logo"][data-field="scale"][type="number"]').fill("1.1");
  await expect(page.locator("#layout-json")).toHaveValue(/"scale": 1.1/);
  await page.locator('input[data-group="frame_corner_top_right"][data-field="mirrorX"]').uncheck();
  await expect(page.locator("#layout-json")).toHaveValue(/"mirrorX": false/);
  await page.locator("#layout-json").fill('{ "logo": { "x": 71 } }');
  await page.locator("#apply-layout").click();
  await expect(page.locator("#layout-json")).toHaveValue(/"x": 71/);
  const menuDownloadPromise = page.waitForEvent("download");
  await page.locator("#download-layout").click();
  const menuDownload = await menuDownloadPromise;
  expect(menuDownload.suggestedFilename()).toBe("star-odyssey-menu-preview-layout.json");
  await page.locator("#layout-json").fill("{bad");
  await page.locator("#apply-layout").click();
  await expect(page.locator("#menu-preview-log")).toContainText("JSON konnte nicht angewendet werden");

  const manifestResponse = await page.request.get("/public/assets/ui/menu/processed/menu-assets.manifest.json");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest.assets.length).toBeGreaterThanOrEqual(28);
  for (const asset of manifest.assets) {
    const response = await page.request.get(`/${asset.finalPath}`);
    expect(response.ok(), `${asset.assetKey} exists`).toBe(true);
  }

  await page.goto("/menu-button-preview.html");
  await expect(page.getByRole("heading", { name: "Button Preview" })).toBeVisible();
  await expect(page.locator("#button-lab-primary .menu-composite-button")).toBeVisible();
  await expect(page.locator("#button-lab-variants .menu-composite-button")).toHaveCount(4);
  await expect(page.locator("#button-layout-json")).toHaveValue(/"iconRing"/);
  await expect(page.locator("#apply-button-layout")).toBeVisible();
  await expect(page.locator("#download-button-layout")).toBeVisible();
  await page.locator('input[data-group="text"][data-field="fontSize"][type="number"]').fill("44");
  await expect(page.locator("#button-layout-json")).toHaveValue(/"fontSize": 44/);
  await page.locator("#button-layout-json").fill('{ "text": { "fontSize": 36 } }');
  await page.locator("#apply-button-layout").click();
  await expect(page.locator("#button-layout-json")).toHaveValue(/"fontSize": 36/);
  const buttonDownloadPromise = page.waitForEvent("download");
  await page.locator("#download-button-layout").click();
  const buttonDownload = await buttonDownloadPromise;
  expect(buttonDownload.suggestedFilename()).toBe("star-odyssey-menu-button-layout.json");
  await page.locator("#button-layout-json").fill("{bad");
  await page.locator("#apply-button-layout").click();
  await expect(page.locator("#button-preview-log")).toContainText("JSON konnte nicht angewendet werden");
  const buttonLayoutResponse = await page.request.get("/public/assets/ui/menu/processed/menu-button-layout.json");
  expect(buttonLayoutResponse.ok()).toBe(true);
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
  await expect(page.locator('nav a[href="./menu-button-preview.html"]')).toBeVisible();

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
