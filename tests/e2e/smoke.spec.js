import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

function collectControllerStateFrames(page) {
  const states = [];
  page.on("websocket", (webSocket) => {
    webSocket.on("framereceived", ({ payload }) => {
      try {
        const message = JSON.parse(typeof payload === "string" ? payload : payload.toString());
        if (message.type === "state" && message.state) states.push(message.state);
      } catch {
        // Ignore non-JSON websocket frames from unrelated browser tooling.
      }
    });
  });
  return states;
}

function getLatestPlayerState(states) {
  return [...states].reverse().find((state) => state.players?.length > 0) ?? null;
}

function expectPrivateControllerState(state, ownPlayerId, foreignPlayerId, expectedMissionCount = 3) {
  expect(state.viewerPlayerId).toBe(ownPlayerId);
  const ownPlayer = state.players.find((player) => player.id === ownPlayerId);
  const foreignPlayer = state.players.find((player) => player.id === foreignPlayerId);
  expect(ownPlayer).toHaveProperty("resources");
  expect(ownPlayer.supernovaMissions).toHaveLength(expectedMissionCount);
  expect(ownPlayer.friendship).toHaveProperty("cards");
  expect(foreignPlayer).not.toHaveProperty("resources");
  expect(foreignPlayer).not.toHaveProperty("supernovaMissions");
  expect(foreignPlayer).not.toHaveProperty("tradeRates");
  expect(foreignPlayer.friendship ?? {}).not.toHaveProperty("cards");
  expect(foreignPlayer.resourceCount).toBeGreaterThanOrEqual(0);
}

async function getAuthorizedControllerUrl(page, playerNumber) {
  await page.waitForFunction((slotNumber) => {
    const sessionId = localStorage.getItem("star-odyssey-controller-session")
      || sessionStorage.getItem("star-odyssey-controller-session");
    if (!sessionId) return false;
    try {
      const tokens = JSON.parse(localStorage.getItem(`star-odyssey-controller-access-v1:${sessionId}`) || "{}");
      return Boolean(tokens[`player-${slotNumber}`]);
    } catch {
      return false;
    }
  }, playerNumber);

  return page.evaluate((slotNumber) => {
    const sessionId = localStorage.getItem("star-odyssey-controller-session")
      || sessionStorage.getItem("star-odyssey-controller-session");
    const tokens = JSON.parse(localStorage.getItem(`star-odyssey-controller-access-v1:${sessionId}`) || "{}");
    const url = new URL("/controller.html", window.location.origin);
    url.searchParams.set("session", sessionId);
    url.searchParams.set("player", String(slotNumber));
    url.searchParams.set("token", tokens[`player-${slotNumber}`]);
    return url.toString();
  }, playerNumber);
}

function collectShipAssetRequests(page) {
  const requests = [];
  page.on("request", (request) => {
    const pathname = new URL(request.url()).pathname;
    if (pathname.includes("/assets/generated/") && pathname.includes("ship")) requests.push(pathname);
  });
  return requests;
}

async function enterControllerLobby(page, variant, playerCount = 3) {
  await page.goto("/");
  await page.getByRole("button", { name: "Neues Spiel" }).click();
  await page.getByRole("button", { name: `${playerCount} Spieler` }).click();
  if (variant === "supernova") await page.getByRole("button", { name: "Supernova" }).click();
  await page.getByRole("button", { name: "Weiter" }).click();
  await expect(page.getByRole("heading", { name: "Controller verbinden" })).toBeVisible();
}

test("startup loader is visible before decoded menu assets are released", async ({ page }) => {
  await page.route("**/star-odyssey-frame-ornate-4k.webp", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    await route.continue();
  });

  await page.goto("/?resetAutosave=1", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#app-startup-loader")).toBeVisible();
  await expect(page.locator(".main-menu-scene")).toHaveCount(0);
  await expect(page.locator(".main-menu-scene")).toBeVisible();
  await expect(page.locator("#app-startup-loader")).toBeHidden();
  await expect(page.locator("#app-startup-progress-text")).toHaveText("100 %");
});

test("startup loader reports a critical asset error and retries successfully", async ({ page }) => {
  let attempts = 0;
  await page.route("**/star-odyssey-compass.png", async (route) => {
    attempts += 1;
    if (attempts === 1) {
      await route.abort("failed");
      return;
    }
    await route.continue();
  });

  await page.goto("/?resetAutosave=1", { waitUntil: "domcontentloaded" });
  const retry = page.getByRole("button", { name: "Erneut versuchen" });
  await expect(retry).toBeVisible();
  await retry.click();
  await expect(page.locator(".main-menu-scene")).toBeVisible();
  await expect(page.locator("#app-startup-loader")).toBeHidden();
  expect(attempts).toBeGreaterThanOrEqual(2);
});

test("two-player Classic and Supernova lobbies use exactly two human controllers", async ({ browser }) => {
  test.setTimeout(120000);
  for (const variant of ["classic", "supernova"]) {
    const context = await browser.newContext();
    const host = await context.newPage();
    await enterControllerLobby(host, variant, 2);

    const controllerUrls = await host.locator(".qr-url").allTextContents();
    expect(controllerUrls).toHaveLength(2);
    const controllerOne = await context.newPage();
    const controllerTwo = await context.newPage();
    await controllerOne.goto(controllerUrls[0]);
    await controllerTwo.goto(controllerUrls[1]);
    await expect(controllerOne.getByText("Verbunden als Spieler 1")).toBeVisible();
    await expect(controllerTwo.getByText("Verbunden als Spieler 2")).toBeVisible();

    await controllerOne.getByLabel("Name").fill(`${variant}-Alice`);
    await controllerOne.getByRole("button", { name: "Rot" }).click();
    await controllerOne.getByRole("button", { name: "Bereit" }).click();
    await controllerTwo.getByLabel("Name").fill(`${variant}-Bob`);
    await controllerTwo.getByRole("button", { name: "Blau" }).click();
    await controllerTwo.getByRole("button", { name: "Bereit" }).click();

    await expect(host.locator(".board-placeholder")).toBeVisible();
    const storedGame = await host.evaluate(() => JSON.parse(localStorage.getItem("star-odyssey-current-game") ?? "null"));
    expect(storedGame.playerCount).toBe(2);
    expect(storedGame.players).toHaveLength(2);
    expect(storedGame.gameVariant).toBe(variant);

    await controllerOne.close();
    const reconnectedController = await context.newPage();
    await reconnectedController.goto(controllerUrls[0]);
    await expect(reconnectedController.locator(".controller-status")).toHaveText("Verbunden");
    await reconnectedController.close();
    await controllerTwo.close();
    await context.close();
  }
});

async function selectFirstControllerColor(page, color) {
  const controllerUrl = (await page.locator(".qr-url").allTextContents())[0];
  const controller = await page.context().newPage();
  await controller.goto(controllerUrl);
  await expect(controller.getByText("Verbunden als Spieler 1")).toBeVisible();
  await controller.getByRole("button", { name: color }).click();
  return controller;
}

test("lobby preloads only selected colors and only loads battleships for Supernova", async ({ browser }) => {
  test.setTimeout(90000);
  const classicContext = await browser.newContext();
  const classicPage = await classicContext.newPage();
  const classicRequests = collectShipAssetRequests(classicPage);
  await enterControllerLobby(classicPage, "classic");
  const classicController = await selectFirstControllerColor(classicPage, "Rot");
  await expect(classicPage.locator(".qr-card").first().locator(".qr-status")).toHaveText("Name/Farbe gewählt");
  await expect.poll(() => classicRequests.filter((url) => url.includes("player-ship-red")).length, { timeout: 30000 }).toBe(3);
  await expect.poll(() => classicRequests.filter((url) => url.includes("trade-ship-red")).length, { timeout: 30000 }).toBe(3);
  expect(classicRequests.filter((url) => url.includes("battle-ship"))).toEqual([]);
  expect(classicRequests.some((url) => /(?:player|trade)-ship-(?:blue|green|yellow)/.test(url))).toBe(false);
  await classicController.close();
  await classicContext.close();

  const supernovaContext = await browser.newContext();
  const supernovaPage = await supernovaContext.newPage();
  const supernovaRequests = collectShipAssetRequests(supernovaPage);
  await enterControllerLobby(supernovaPage, "supernova");
  const supernovaController = await selectFirstControllerColor(supernovaPage, "Blau");
  await expect.poll(() => supernovaRequests.filter((url) => url.includes("player-ship-blue")).length, { timeout: 30000 }).toBe(3);
  await expect.poll(() => supernovaRequests.filter((url) => url.includes("trade-ship-blue")).length, { timeout: 30000 }).toBe(3);
  await expect.poll(() => supernovaRequests.filter((url) => url.includes("battle-ship-blue")).length, { timeout: 30000 }).toBe(3);
  expect(supernovaRequests.some((url) => /(?:player|trade|battle)-ship-(?:red|green|yellow)/.test(url))).toBe(false);
  await supernovaController.close();
  await supernovaContext.close();
});

test("main menu, QR controller lobby, board, and phone menu work", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator(".main-menu-scene")).toBeVisible();
  await expect(page.locator('[data-menu-layer="logo"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Neues Spiel" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Spiel laden" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Spiel beenden" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Einstellungen" })).toBeVisible();
  const menuIconSources = [
    "icon_new_game.png",
    "icon_load_game.png",
    "icon_quit_game.png",
    "icon_settings.png"
  ];
  const menuIcons = page.locator(".main-menu-action-icon");
  await expect(menuIcons).toHaveCount(menuIconSources.length);
  for (const [index, expectedSource] of menuIconSources.entries()) {
    const icon = menuIcons.nth(index);
    await expect(icon).toBeVisible();
    await expect(icon).toHaveAttribute("data-icon-source", new RegExp(`${expectedSource.replace(".", "\\.")}$`));
    await expect(icon).toHaveCSS("box-shadow", "none");
    await expect.poll(() => icon.evaluate((element) => getComputedStyle(element).webkitMaskImage)).not.toBe("none");
  }
  await expect(page.getByRole("button", { name: "EN", exact: true })).toHaveCount(0);
  await expect(page.getByText("Ein digitales Weltraum-Brettspiel")).toHaveCount(0);

  await page.getByRole("button", { name: "Einstellungen" }).click();
  await expect(page.getByRole("heading", { name: "Menü" })).toBeVisible();
  await expect(page.getByRole("button", { name: "DE", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "EN", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Schließen" }).click();

  await page.getByRole("button", { name: "Neues Spiel" }).click();
  await expect(page.getByRole("heading", { name: "Spieleranzahl wählen" })).toBeVisible();
  await expect(page.getByRole("button", { name: "DE", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "EN", exact: true })).toHaveCount(0);

  await expect(page.getByRole("button", { name: "2 Spieler" })).toBeVisible();
  await page.getByRole("button", { name: "3 Spieler" }).click();
  await page.getByRole("button", { name: "Supernova" }).click();
  const standardMissionMode = page.getByRole("button", { name: "Standard · 3 Missionen" });
  const professionalMissionMode = page.getByRole("button", { name: "Profi (optional) · 2 Missionen" });
  await expect(standardMissionMode).toHaveAttribute("aria-pressed", "true");
  await professionalMissionMode.click();
  await expect(professionalMissionMode).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Weiter" }).click();

  await expect(page.getByRole("heading", { name: "Controller verbinden" })).toBeVisible();
  await expect(page.getByRole("button", { name: "DE", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "EN", exact: true })).toHaveCount(0);
  const lobbyBack = page.getByRole("button", { name: "Zurück" });
  await expect(lobbyBack).toBeFocused();
  const controllerUrls = await page.locator(".qr-url").allTextContents();
  expect(controllerUrls).toHaveLength(3);
  expect(controllerUrls[0]).toContain("/controller.html?session=");
  expect(controllerUrls[0]).toContain("player=1");
  expect(new URL(controllerUrls[0]).searchParams.get("token")).toMatch(/^[a-f0-9]{48}$/);
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
  const controllerThree = await page.context().newPage();
  const controllerOneStates = collectControllerStateFrames(controllerOne);
  const controllerTwoStates = collectControllerStateFrames(controllerTwo);
  const controllerThreeStates = collectControllerStateFrames(controllerThree);

  await controllerOne.goto(controllerUrls[0]);
  await controllerTwo.goto(controllerUrls[1]);
  await controllerThree.goto(controllerUrls[2]);
  await expect(controllerOne.getByText("Verbunden als Spieler 1")).toBeVisible();
  await expect(controllerTwo.getByText("Verbunden als Spieler 2")).toBeVisible();
  await expect(controllerThree.getByText("Verbunden als Spieler 3")).toBeVisible();
  await expect(lobbyBack).toBeFocused();

  const duplicateController = await page.context().newPage();
  await duplicateController.goto(controllerUrls[0]);
  await expect(duplicateController.locator(".controller-status")).toHaveText("Spieler bereits verbunden");
  await expect(controllerOne.locator(".controller-status")).toHaveText("Verbunden");
  await duplicateController.close();

  await controllerOne.getByLabel("Name").fill("Alice");
  await controllerOne.getByRole("button", { name: "Rot" }).click();
  await controllerOne.getByRole("button", { name: "Bereit" }).click();
  await expect(page.getByText("Alice ist bereit")).toBeVisible();
  await expect(lobbyBack).toBeFocused();

  await controllerTwo.getByLabel("Name").fill("Bob");
  await controllerTwo.getByRole("button", { name: "Blau" }).click();
  await controllerTwo.getByRole("button", { name: "Bereit" }).click();

  await controllerThree.getByLabel("Name").fill("Cara");
  await controllerThree.getByRole("button", { name: "Grün" }).click();
  await controllerThree.getByRole("button", { name: "Bereit" }).click();

  await expect(page.locator(".board-placeholder")).toBeVisible();
  await expect(page.locator(".board-event-log")).toBeVisible();
  await expect(page.locator(".structure--neutral")).toHaveCount(3);
  await expect(page.locator('.structure--neutral image[href*="player-colony-yellow.png"]')).toHaveCount(2);
  await expect(page.locator('.structure--neutral image[href*="player-spaceport-yellow.png"]')).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Player 1" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "⚙" })).toHaveCount(0);
  await expect.poll(() => Boolean(getLatestPlayerState(controllerOneStates))).toBe(true);
  await expect.poll(() => Boolean(getLatestPlayerState(controllerTwoStates))).toBe(true);
  await expect.poll(() => Boolean(getLatestPlayerState(controllerThreeStates))).toBe(true);
  expectPrivateControllerState(getLatestPlayerState(controllerOneStates), "player-1", "player-2", 2);
  expectPrivateControllerState(getLatestPlayerState(controllerTwoStates), "player-2", "player-1", 2);
  expectPrivateControllerState(getLatestPlayerState(controllerThreeStates), "player-3", "player-1", 2);
  expect(getLatestPlayerState(controllerOneStates).gameVariant).toBe("supernova");

  await expect(page.locator(".supernova-missions")).toHaveCount(0);
  await expect(page.getByText("Supernova-Missionen")).toHaveCount(0);

  await page.screenshot({ path: "test-results/screenshots/board.png", fullPage: true });

  await controllerOne.getByRole("button", { name: "Bauen" }).click();
  await expect(controllerOne.getByText("Supernova-Fabriken")).toBeVisible();
  await expect(controllerOne.locator(".factory-build-card")).toHaveCount(5);
  await controllerOne.getByRole("button", { name: "Handeln" }).click();
  await expect(controllerOne.getByRole("heading", { name: "Handeln" })).toBeVisible();
  await expect(controllerOne.getByRole("button", { name: "Spielfeld" })).toBeVisible();
  await expect(controllerOne.getByRole("button", { name: "Einstellungen" })).toBeVisible();
  await expect(controllerTwo.getByRole("button", { name: "Einstellungen" })).toHaveCount(0);
  await controllerOne.getByRole("button", { name: "Spielfeld" }).click();
  await expect(controllerOne.locator(".controller-board-viewport")).toBeVisible();
  await expect(controllerOne.getByRole("button", { name: "Zurück zum Menü" })).toBeVisible();

  await controllerOne.close();
  const reconnectedControllerOne = await page.context().newPage();
  const reconnectedControllerOneStates = collectControllerStateFrames(reconnectedControllerOne);
  await reconnectedControllerOne.goto(controllerUrls[0]);
  await expect(reconnectedControllerOne.getByRole("heading", { name: "Alice" })).toBeVisible();
  await expect(reconnectedControllerOne.locator(".controller-status")).toHaveText("Verbunden");
  await expect.poll(() => Boolean(getLatestPlayerState(reconnectedControllerOneStates))).toBe(true);
  expectPrivateControllerState(getLatestPlayerState(reconnectedControllerOneStates), "player-1", "player-2", 2);

  await reconnectedControllerOne.close();
  await controllerTwo.close();
  await controllerThree.close();
});

test("English controllers render localized setup, tabs, factories, and missions", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Einstellungen" }).click();
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByRole("button", { name: "Close" }).click();
  await page.getByRole("button", { name: "New Game" }).click();
  await expect(page.getByRole("heading", { name: "Select number of players" })).toBeVisible();
  await page.getByRole("button", { name: "3 players" }).click();
  await page.getByRole("button", { name: "Supernova" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  const controllerUrls = await page.locator(".qr-url").allTextContents();
  const controllers = await Promise.all(controllerUrls.map(() => page.context().newPage()));
  for (const [index, controller] of controllers.entries()) {
    await controller.goto(controllerUrls[index]);
  }

  const setup = [
    { name: "Alice", color: "Red" },
    { name: "Bob", color: "Blue" },
    { name: "Cara", color: "Green" }
  ];
  for (const [index, controller] of controllers.entries()) {
    await expect(controller.getByText(`Connected as Player ${index + 1}`)).toBeVisible();
    await controller.getByLabel("Name").fill(setup[index].name);
    await controller.getByRole("button", { name: setup[index].color, exact: true }).click();
    await controller.getByRole("button", { name: "Ready", exact: true }).click();
  }

  await expect(page.locator(".board-placeholder")).toBeVisible();
  const activeController = controllers[0];
  await activeController.setViewportSize({ width: 852, height: 393 });
  await activeController.getByRole("button", { name: "Build", exact: true }).click();
  await expect(activeController.getByText("Supernova factories")).toBeVisible();
  await expect(activeController.getByText("Refinery", { exact: true })).toBeVisible();
  await expect(activeController.getByText("Food Factory", { exact: true })).toBeVisible();

  await activeController.getByRole("button", { name: "Overview", exact: true }).click();
  await expect(activeController.getByText("Supernova missions")).toBeVisible();
  await expect(activeController.locator(".player-overview .friendship-card")).toHaveCount(3);

  const visibleControllerText = await activeController.locator("body").innerText();
  expect(visibleControllerText).not.toMatch(/Verbunden|Bereit|Bauen|Handeln|Übersicht|Warte|Rohstoff|Fabrik|Missionen|Treibstoff|Nahrung|Handelsware|Schlachtschiff|Raumhafen|Einstellungen/);
  expect(await activeController.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  expect(await activeController.locator(".controller-tabbar").evaluate((tabbar) => tabbar.scrollWidth <= tabbar.clientWidth + 1)).toBe(true);
  await activeController.setViewportSize({ width: 740, height: 360 });
  expect(await activeController.locator(".controller-tabbar").evaluate((tabbar) => tabbar.scrollWidth <= tabbar.clientWidth + 1)).toBe(true);
  expect(await activeController.evaluate(() => document.documentElement.lang)).toBe("en");

  await Promise.all(controllers.map((controller) => controller.close()));
});

test("main menu uses a 16:9 stage and shows a portrait rotate hint", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/");
  const scene = page.locator(".main-menu-scene");
  const title = page.locator(".main-menu-title");
  const buttonList = page.locator(".main-menu-button-list");
  await expect(scene).toBeVisible();
  const desktopBox = await scene.boundingBox();
  const desktopTitleBox = await title.boundingBox();
  const desktopButtonListBox = await buttonList.boundingBox();
  expect(desktopBox?.width).toBeGreaterThan(1910);
  expect(Math.abs((desktopBox.width / desktopBox.height) - (16 / 9))).toBeLessThan(0.02);

  await page.setViewportSize({ width: 3840, height: 2160 });
  const fourKBox = await scene.boundingBox();
  const fourKTitleBox = await title.boundingBox();
  const fourKButtonListBox = await buttonList.boundingBox();
  expect(fourKBox?.width).toBeGreaterThan(3830);
  expect(fourKTitleBox.width / desktopTitleBox.width).toBeGreaterThan(1.95);
  expect(fourKButtonListBox.width / desktopButtonListBox.width).toBeGreaterThan(2.05);
  expect(fourKButtonListBox.y + fourKButtonListBox.height).toBeLessThan((fourKBox.y + fourKBox.height) * 0.82);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".main-menu-rotate-hint")).toBeVisible();
  await expect(scene).toBeHidden();

  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/");
  await expect(scene).toBeVisible();
  await expect(page.locator(".main-menu-rotate-hint")).toBeHidden();
  const landscapeSceneBox = await scene.boundingBox();
  const landscapeButtonListBox = await buttonList.boundingBox();
  expect(landscapeButtonListBox.y + landscapeButtonListBox.height).toBeLessThan((landscapeSceneBox.y + landscapeSceneBox.height) * 0.9);
});

test("TV remote focus reaches setup and the controller PWA shell is valid", async ({ page }) => {
  await page.goto("/");
  const newGame = page.getByRole("button", { name: "Neues Spiel" });
  await expect(newGame).toBeFocused();
  await expect(page.getByRole("heading", { name: "Star Odyssey" })).toHaveCount(1);

  await page.evaluate(() => {
    const event = new KeyboardEvent("keydown", { bubbles: true, key: "Unidentified" });
    Object.defineProperties(event, {
      keyCode: { value: 20 },
      which: { value: 20 }
    });
    document.dispatchEvent(event);
  });
  await expect(page.getByRole("button", { name: "Spiel laden" })).toBeFocused();
  await page.waitForTimeout(150);
  await expect(page.getByRole("button", { name: "Spiel laden" })).toBeFocused();
  await page.keyboard.press("ArrowUp");

  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("button", { name: "Spiel laden" })).toBeFocused();
  await page.waitForTimeout(150);
  await expect(page.getByRole("button", { name: "Spiel laden" })).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Spieleranzahl wählen" })).toBeVisible();
  await expect(page.getByRole("button", { name: "2 Spieler" })).toBeFocused();
  await page.waitForTimeout(150);
  await expect(page.getByRole("button", { name: "2 Spieler" })).toBeFocused();

  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("button", { name: "Klassisches Spiel" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("button", { name: "Zurück" })).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await expect(page.getByRole("button", { name: "2 Spieler" })).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "2 Spieler" })).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(150);
  await expect(page.getByRole("button", { name: "2 Spieler" })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "3 Spieler" })).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("button", { name: "Klassisches Spiel" })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "Supernova" })).toBeFocused();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(150);
  await expect(page.getByRole("button", { name: "Supernova" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("button", { name: "Profi (optional) · 2 Missionen" })).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("button", { name: "Standard · 3 Missionen" })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "Profi (optional) · 2 Missionen" })).toBeFocused();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(150);
  await expect(page.getByRole("button", { name: "Profi (optional) · 2 Missionen" })).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(page.getByRole("button", { name: "Supernova" })).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("button", { name: "Klassisches Spiel" })).toBeFocused();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(150);
  await expect(page.getByRole("button", { name: "Klassisches Spiel" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("button", { name: "Zurück" })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "Weiter" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Controller verbinden" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Zurück" })).toBeFocused();
  await expect(page.locator(".qr-card").first()).toHaveAttribute("tabindex", "-1");
  await page.waitForTimeout(350);
  await expect(page.getByRole("button", { name: "Zurück" })).toBeFocused();

  const shellDecoration = await page.locator(".shell-screen").evaluate((element) => ({
    legacyBorder: getComputedStyle(element, "::before").borderTopStyle,
    coverPanel: getComputedStyle(element, "::after").content
  }));
  expect(["", "none"]).toContain(shellDecoration.legacyBorder);
  expect(["", "none"]).toContain(shellDecoration.coverPanel);

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

test("controller service worker replaces stale UI caches", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const oldCache = await caches.open("star-odyssey-ui-v1");
    await oldCache.put("/controller.webmanifest", new Response("stale-v1"));
  });

  await page.goto("/controller.html?session=CACHE-TEST&player=1");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => {
        navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true });
      });
    }
  });

  await expect.poll(() => page.evaluate(() => caches.keys())).toEqual(["star-odyssey-ui-v2"]);
  await page.evaluate(async () => {
    const cache = await caches.open("star-odyssey-ui-v2");
    await cache.put("/controller.webmanifest", new Response("stale-v2"));
  });

  const liveManifest = await page.evaluate(async () => (await fetch("/controller.webmanifest")).text());
  expect(liveManifest).toContain('"display": "standalone"');
  const cachedManifest = await page.evaluate(async () => {
    const cache = await caches.open("star-odyssey-ui-v2");
    return (await cache.match("/controller.webmanifest"))?.text();
  });
  expect(cachedManifest).toContain('"display": "standalone"');
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
  for (const asset of manifest.assets.filter((entry) => entry.category !== "reference")) {
    const response = await page.request.get(`/${asset.finalPath}`);
    expect(response.ok(), `${asset.assetKey} exists`).toBe(true);
  }
  const referenceAsset = manifest.assets.find((entry) => entry.category === "reference");
  const referenceResponse = await page.request.get(`/${referenceAsset.finalPath}`);
  expect(referenceResponse.status()).toBe(404);

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

test("storage failures stay visible and retry without a false save success", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const [{ createGameState }, { boardLayout }, { gameVariants }] = await Promise.all([
      import("/src/game/gameState.js"),
      import("/src/data/boardLayout.js"),
      import("/src/data/supernova.js")
    ]);
    const gameState = createGameState({
      language: "de",
      playerCount: 3,
      boardLayout,
      gameVariant: gameVariants.classic
    });
    localStorage.removeItem("starOdyssey.autosave.v1");
    localStorage.setItem("star-odyssey-current-game", JSON.stringify(gameState));
  });
  await page.reload();
  await expect(page.locator(".board-screen")).toBeVisible();

  await page.evaluate(() => {
    const originalSetItem = Storage.prototype.setItem;
    window.__starOdysseyOriginalSetItem = originalSetItem;
    Storage.prototype.setItem = function setItemWithFailure(key, value) {
      if (["starOdyssey.autosave.v1", "star-odyssey-current-game", "star-odyssey-saves"].includes(String(key))) {
        throw new DOMException("Storage quota exceeded", "QuotaExceededError");
      }
      return originalSetItem.call(this, key, value);
    };
    window.dispatchEvent(new Event("pagehide"));
  });

  const storageWarning = page.locator('[data-storage-warning="true"]');
  await expect(storageWarning).toContainText("Speichern fehlgeschlagen");

  await page.getByRole("button", { name: "⚙" }).click();
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await page.getByPlaceholder("Name des Spielstands").fill("Quota-Test");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByText("Spielstand konnte nicht gespeichert werden.")).toBeVisible();
  await expect(page.getByText("Spiel gespeichert.")).toHaveCount(0);

  await page.evaluate(() => {
    Storage.prototype.setItem = window.__starOdysseyOriginalSetItem;
    delete window.__starOdysseyOriginalSetItem;
  });
  await storageWarning.getByRole("button", { name: "Erneut versuchen" }).click();

  await expect(storageWarning).toHaveCount(0);
  await expect(page.getByText("Speichern funktioniert wieder.")).toBeVisible();
  const stored = await page.evaluate(() => ({
    autosave: JSON.parse(localStorage.getItem("starOdyssey.autosave.v1") ?? "null"),
    saves: JSON.parse(localStorage.getItem("star-odyssey-saves") ?? "[]")
  }));
  expect(stored.autosave?.gameState?.gameVariant).toBe("classic");
  expect(stored.saves.some((save) => save.name === "Quota-Test" && save.gameState?.gameVariant === "classic")).toBe(true);
});

test("save backups preserve Supernova pending state and reject unsupported versions", async ({ page }) => {
  await page.goto("/");
  const expectedPendingType = await page.evaluate(async () => {
    const [{
      advanceToFlightPhase,
      createGameState,
      determineFlightSpeed,
      resolveEncounterChoice,
      startPendingFlightEncounter,
      submitEncounterPending,
      updateEncounterResourceSelection
    }, { boardLayout }, { gameVariants, supernovaMissionCounts }] = await Promise.all([
      import("/src/game/gameState.js"),
      import("/src/data/boardLayout.js"),
      import("/src/data/supernova.js")
    ]);
    let gameState = createGameState({
      language: "de",
      playerCount: 3,
      boardLayout,
      gameVariant: gameVariants.supernova,
      supernovaMissionCount: supernovaMissionCounts.professional
    });
    gameState = {
      ...gameState,
      players: gameState.players.map((player, index) => index === 0
        ? {
          ...player,
          resources: { ore: 1, fuel: 0, carbon: 0, food: 0, goods: 0 },
          halfMedals: 2
        }
        : player),
      board: {
        ...gameState.board,
        ships: [{
          id: "portable-save-ship",
          ownerPlayerId: "player-1",
          type: "colonyShip",
          locationId: boardLayout.points[0].id,
          status: "active"
        }]
      }
    };
    gameState = advanceToFlightPhase(gameState);
    gameState = determineFlightSpeed(gameState, {
      balls: ["black", "yellow"],
      encounterCardId: "spreadsheet-14"
    });
    gameState = startPendingFlightEncounter(gameState);
    gameState = resolveEncounterChoice(gameState, { choiceId: "accept" });
    gameState = updateEncounterResourceSelection(gameState, "ore", 1);
    gameState = submitEncounterPending(gameState);

    const savedAt = "2026-07-14T20:00:00.000Z";
    localStorage.setItem("star-odyssey-saves", JSON.stringify([{
      id: "save-portability-e2e",
      name: "Supernova Pending",
      savedAt,
      displayDate: savedAt,
      language: "de",
      playerCount: gameState.playerCount,
      view: "board",
      boardState: gameState.board,
      gameState
    }]));
    localStorage.setItem("star-odyssey-controller-session", "portable-session-sentinel");
    localStorage.setItem(
      "star-odyssey-controller-access-v1:portable-session-sentinel",
      JSON.stringify({ "player-1": "portable-token-sentinel" })
    );
    return gameState.activeEncounter?.pendingStep?.type;
  });

  await page.getByRole("button", { name: "Spiel laden" }).click();
  await expect(page.getByRole("heading", { name: "Spiel laden" })).toBeVisible();
  await expect(page.getByText("Supernova Pending")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportieren" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("star-odyssey-supernova-pending.json");
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();
  const backupText = await readFile(downloadPath, "utf8");
  const backup = JSON.parse(backupText);
  expect(backup.format).toBe("star-odyssey-save-backup");
  expect(backup.version).toBe(1);
  expect(backup.save.gameState.gameVariant).toBe("supernova");
  expect(backup.save.gameState.supernova.missionCount).toBe(2);
  expect(backup.save.gameState.activeEncounter.pendingStep.type).toBe(expectedPendingType);
  expect(backupText).not.toContain("portable-session-sentinel");
  expect(backupText).not.toContain("portable-token-sentinel");

  await page.evaluate(() => localStorage.setItem("star-odyssey-saves", "[]"));
  await page.locator('[data-save-import-input="true"]').setInputFiles(downloadPath);
  await expect(page.getByRole("dialog").getByText("Spielstand „Supernova Pending“ importiert.")).toBeVisible();
  const imported = await page.evaluate(() => ({
    currentGame: localStorage.getItem("star-odyssey-current-game"),
    saves: JSON.parse(localStorage.getItem("star-odyssey-saves") ?? "[]"),
    session: localStorage.getItem("star-odyssey-controller-session"),
    access: localStorage.getItem("star-odyssey-controller-access-v1:portable-session-sentinel")
  }));
  expect(imported.currentGame).toBeNull();
  expect(imported.saves).toHaveLength(1);
  expect(imported.saves[0].id).not.toBe("save-portability-e2e");
  expect(imported.saves[0].gameState.gameVariant).toBe("supernova");
  expect(imported.saves[0].gameState.supernova.missionCount).toBe(2);
  expect(imported.saves[0].gameState.activeEncounter.pendingStep.type).toBe(expectedPendingType);
  expect(imported.session).toBe("portable-session-sentinel");
  expect(JSON.parse(imported.access)).toEqual({ "player-1": "portable-token-sentinel" });

  const unsupportedBackup = {
    ...backup,
    version: 999
  };
  await page.locator('[data-save-import-input="true"]').setInputFiles({
    name: "unsupported-save.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(unsupportedBackup))
  });
  await expect(page.getByRole("dialog").getByText("Diese Backup-Version wird nicht unterstützt.")).toBeVisible();
  const saveCountAfterRejection = await page.evaluate(() => (
    JSON.parse(localStorage.getItem("star-odyssey-saves") ?? "[]").length
  ));
  expect(saveCountAfterRejection).toBe(1);
});

test("Supernova factories render on the board", async ({ page }) => {
  await page.goto("/");
  const factory = await page.evaluate(async () => {
    const [{ createGameState }, { boardLayout }, { gameVariants }] = await Promise.all([
      import("/src/game/gameState.js"),
      import("/src/data/boardLayout.js"),
      import("/src/data/supernova.js")
    ]);
    const gameState = createGameState({
      language: "de",
      playerCount: 2,
      boardLayout,
      gameVariant: gameVariants.supernova
    });
    const system = boardLayout.planetSystems[0];
    const planet = system.planets[0];
    const factoryState = {
      id: "factory-visual-test",
      ownerPlayerId: "player-1",
      type: planet.resource,
      resource: planet.resource,
      planetId: planet.id,
      systemId: system.id
    };
    gameState.phase = "tradeBuild";
    gameState.board.exploredSystems = [...new Set([...(gameState.board.exploredSystems ?? []), system.id])];
    gameState.supernova.factories = [factoryState];
    localStorage.removeItem("starOdyssey.autosave.v1");
    localStorage.setItem("star-odyssey-current-game", JSON.stringify(gameState));
    return factoryState;
  });

  await page.reload();
  const marker = page.locator(`[data-factory-id="${factory.id}"]`);
  await expect(page.locator(".board-screen")).toBeVisible();
  await expect(marker).toHaveCount(1);
  await expect(marker.locator("title")).toContainText("Spieler 1");
  await expect(marker.locator("image.factory-marker-image")).toHaveAttribute("href", /factory-(mine|refinery|food|carbon|trade)-red\.png$/);
  await expect(marker.locator("image.factory-marker-image")).toHaveAttribute("width", "60");
  await expect(marker.locator("image.factory-marker-image")).toHaveAttribute("height", "60");
  await expect(marker.locator("text.factory-number-marker")).toHaveCount(1);
  const factoryCenterOffset = await page.evaluate(({ factoryId, planetId }) => {
    const factoryMarker = document.querySelector(`[data-factory-id="${factoryId}"]`);
    const planet = document.querySelector(`.planet[data-planet-id="${planetId}"]`);
    const factoryBounds = factoryMarker?.getBoundingClientRect();
    const planetBounds = planet?.getBoundingClientRect();
    if (!factoryBounds || !planetBounds) return null;
    return {
      x: Math.abs(factoryBounds.x + factoryBounds.width / 2 - (planetBounds.x + planetBounds.width / 2)),
      y: Math.abs(factoryBounds.y + factoryBounds.height / 2 - (planetBounds.y + planetBounds.height / 2))
    };
  }, { factoryId: factory.id, planetId: factory.planetId });
  expect(factoryCenterOffset).not.toBeNull();
  expect(factoryCenterOffset.x).toBeLessThan(1);
  expect(factoryCenterOffset.y).toBeLessThan(1);

  const controller = await page.context().newPage();
  await controller.goto(await getAuthorizedControllerUrl(page, 1));
  await expect(controller.getByRole("heading", { name: "Spieler 1" })).toBeVisible();
  await expect(controller.locator(".controller-status")).toHaveText("Verbunden");
  await controller.getByRole("button", { name: "Spielfeld" }).click();
  await expect(controller.locator(`[data-factory-id="${factory.id}"]`)).toHaveCount(1);
  await expect(controller.locator(`[data-factory-id="${factory.id}"] image.factory-marker-image`)).toHaveAttribute("href", /factory-(mine|refinery|food|carbon|trade)-red\.png$/);
  await controller.close();
});

test("active controller places a Supernova factory on a valid planet", async ({ page }) => {
  await page.goto("/");
  const setup = await page.evaluate(async () => {
    const [{ createGameState, getBuildableSupernovaFactoryOptions }, { boardLayout }, { gameVariants }] = await Promise.all([
      import("/src/game/gameState.js"),
      import("/src/data/boardLayout.js"),
      import("/src/data/supernova.js")
    ]);
    const gameState = createGameState({
      language: "de",
      playerCount: 2,
      boardLayout,
      gameVariant: gameVariants.supernova
    });
    const system = gameState.board.placedSystems.find((candidate) => candidate.planets?.length && candidate.colonySites?.length);
    const site = system.colonySites.find((candidate) => candidate.adjacentPlanetIds?.length);
    const planet = system.planets.find((candidate) => site.adjacentPlanetIds.includes(candidate.id));
    gameState.phase = "tradeBuild";
    gameState.currentPlayerIndex = 0;
    gameState.board.exploredSystems = [...new Set([...(gameState.board.exploredSystems ?? []), system.id])];
    gameState.board.structures = [{
      id: "factory-placement-colony",
      ownerPlayerId: "player-1",
      type: "colony",
      locationId: site.nodeId,
      systemId: system.id,
      adjacentPlanetIds: site.adjacentPlanetIds
    }];
    gameState.players[0].resources = { ore: 10, fuel: 10, carbon: 10, food: 10, goods: 10 };
    const option = getBuildableSupernovaFactoryOptions(gameState, boardLayout, "player-1")
      .find((candidate) => candidate.planetId === planet.id && candidate.canBuild);
    localStorage.removeItem("starOdyssey.autosave.v1");
    localStorage.setItem("star-odyssey-current-game", JSON.stringify(gameState));
    return {
      planetId: planet.id,
      factoryType: option.factoryType,
      factoryLabel: option.label,
      resource: option.resource,
      resourceBefore: gameState.players[0].resources[option.resource],
      resourceCost: option.cost[option.resource] ?? 0
    };
  });

  await page.reload();
  await expect(page.locator(".board-screen")).toBeVisible();
  const controller = await page.context().newPage();
  const sentFrames = [];
  controller.on("websocket", (webSocket) => webSocket.on("framesent", (event) => sentFrames.push(String(event.payload))));
  await controller.goto(await getAuthorizedControllerUrl(page, 1));
  await controller.getByRole("button", { name: "Bauen", exact: true }).click();
  const enabledFactoryBuild = controller.locator(".factory-build-card")
    .filter({ hasText: setup.factoryLabel })
    .getByRole("button", { name: "Bauen", exact: true });
  await expect(enabledFactoryBuild).toBeEnabled();
  await enabledFactoryBuild.click();
  const target = controller.locator(`[data-planet-id="${setup.planetId}"].is-factory-target`);
  await expect(target).toBeVisible();
  await target.click();
  await expect.poll(() => sentFrames.some((frame) => frame.includes('"actionId":"board.select"'))).toBe(true);

  const marker = page.locator(`[data-factory-id][data-planet-id="${setup.planetId}"]`);
  await expect(marker).toHaveCount(1);
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem("star-odyssey-current-game") ?? "null"));
  expect(persisted.supernova.pendingFactoryPlacement).toBeNull();
  expect(persisted.supernova.factories).toHaveLength(1);
  expect(persisted.supernova.factories[0].planetId).toBe(setup.planetId);
  expect(persisted.players[0].resources[setup.resource]).toBe(setup.resourceBefore - setup.resourceCost);
  await controller.close();
});

test("active controller starts a visible single-player encounter roll", async ({ page }) => {
  await page.goto("/");
  const initialFlightSpeed = await page.evaluate(async () => {
    const [{
      advanceToFlightPhase,
      createGameState,
      determineFlightSpeed,
      resolveEncounterChoice,
      startPendingFlightEncounter,
      submitEncounterPending,
      updateEncounterResourceSelection
    }, { boardLayout }] = await Promise.all([
      import("/src/game/gameState.js"),
      import("/src/data/boardLayout.js")
    ]);
    let gameState = createGameState({
      language: "de",
      playerCount: 2,
      boardLayout
    });
    gameState = {
      ...gameState,
      players: gameState.players.map((player, index) => index === 0
        ? {
          ...player,
          resources: { ore: 1, fuel: 0, carbon: 0, food: 0, goods: 0 },
          halfMedals: 2
        }
        : player),
      board: {
        ...gameState.board,
        ships: [{
          id: "encounter-roll-e2e-ship",
          ownerPlayerId: "player-1",
          type: "colonyShip",
          locationId: boardLayout.points[0].id,
          status: "active"
        }]
      }
    };
    gameState = advanceToFlightPhase(gameState);
    gameState = determineFlightSpeed(gameState, {
      balls: ["black", "yellow"],
      encounterCardId: "spreadsheet-14"
    });
    gameState = startPendingFlightEncounter(gameState);
    gameState = resolveEncounterChoice(gameState, { choiceId: "accept" });
    gameState = updateEncounterResourceSelection(gameState, "ore", 1);
    gameState = submitEncounterPending(gameState);
    localStorage.removeItem("starOdyssey.autosave.v1");
    localStorage.setItem("star-odyssey-current-game", JSON.stringify(gameState));
    return gameState.flightSpeedTotal;
  });

  await page.reload();
  await expect(page.locator(".board-screen")).toBeVisible();
  await expect(page.locator(".mothership-speed-overlay")).toHaveCount(0);

  const controller = await page.context().newPage();
  await controller.goto(await getAuthorizedControllerUrl(page, 1));
  const rollButton = controller.getByRole("button", { name: "Mit Mutterschiff würfeln" });
  await expect(rollButton).toBeVisible();
  await rollButton.click();

  await expect(page.locator(".mothership-speed-overlay")).toBeVisible();
  await expect(page.locator(".mothership-speed-ball")).toHaveCount(2);
  await expect(controller.getByText("Der Wurf wird auf dem Spielfeld angezeigt.")).toBeVisible();
  await expect(rollButton).toHaveCount(0);
  await expect(page.locator(".encounter-modal-overlay")).toHaveCount(0);

  await expect.poll(async () => page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("star-odyssey-current-game") ?? "null");
    return state?.activeEncounter?.status ?? null;
  }), { timeout: 10000 }).toBe("resolved");
  await expect(page.locator(".mothership-speed-overlay")).toHaveCount(0);
  const resolvedState = await page.evaluate(() => JSON.parse(localStorage.getItem("star-odyssey-current-game") ?? "null"));
  expect(resolvedState.flightSpeedTotal).toBe(initialFlightSpeed);
  await expect(controller.getByRole("button", { name: "Begegnung abschließen", exact: true })).toBeVisible();
  await controller.close();
});

test("Tooth of Time shows its saved result phases before drawing again", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const [{
      createGameState,
      determineFlightSpeed,
      resolveEncounterChoice,
      startPendingFlightEncounter,
      submitEncounterPending
    }, { boardLayout }] = await Promise.all([
      import("/src/game/gameState.js"),
      import("/src/data/boardLayout.js")
    ]);
    let gameState = createGameState({
      language: "de",
      playerCount: 2,
      boardLayout
    });
    gameState = {
      ...gameState,
      phase: "flight",
      currentPlayerIndex: 0,
      players: gameState.players.map((player, index) => ({
        ...player,
        upgrades: index === 0
          ? { drive: 6, cargo: 1, cannon: 2 }
          : { drive: 4, cargo: 2, cannon: 1 },
        friendshipCards: [],
        halfMedals: 0
      })),
      board: {
        ...gameState.board,
        ships: [{
          id: "tooth-of-time-e2e-ship",
          ownerPlayerId: "player-1",
          type: "colonyShip",
          locationId: boardLayout.points[0].id,
          status: "active"
        }]
      }
    };
    gameState = determineFlightSpeed(gameState, {
      balls: ["black", "yellow"],
      encounterCardId: "spreadsheet-32"
    });
    gameState = startPendingFlightEncounter(gameState);
    gameState = resolveEncounterChoice(gameState, { choiceId: "continue" });
    gameState = submitEncounterPending(gameState, { upgrade: "drive" });
    gameState = submitEncounterPending(gameState, { upgrade: "drive" });
    localStorage.removeItem("starOdyssey.autosave.v1");
    localStorage.setItem("star-odyssey-current-game", JSON.stringify(gameState));
  });

  await page.reload();
  await expect(page.locator(".encounter-message-step h2")).toHaveText("Galaktischer Rat");
  await expect(page.locator(".encounter-message-step")).toContainText("Spieler 2 erhält eine halbe Medaille.");

  const controller = await page.context().newPage();
  await controller.goto(await getAuthorizedControllerUrl(page, 1));
  await expect(controller.locator(".encounter-message-step h3")).toHaveText("Galaktischer Rat");
  await controller.getByRole("button", { name: "Weiter" }).click();

  await expect(page.locator(".encounter-message-step h2")).toHaveText("Neue Begegnung");
  await expect(controller.locator(".encounter-message-step h3")).toHaveText("Neue Begegnung");
  await expect(controller.locator(".encounter-message-step")).toContainText("Die Begegnungen wurden neu gemischt.");
  await controller.getByRole("button", { name: "Weiter" }).click();

  await expect.poll(async () => page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("star-odyssey-current-game") ?? "null");
    return state?.activeEncounter?.cardId ?? null;
  })).not.toBe("spreadsheet-32");
  const finalState = await page.evaluate(() => JSON.parse(localStorage.getItem("star-odyssey-current-game") ?? "null"));
  expect(finalState.players[1].halfMedals).toBe(1);
  await controller.close();
});

test("both controllers must roll before a Supernova ship battle is shown", async ({ page }) => {
  await page.goto("/");
  const initialFlightSpeed = await page.evaluate(async () => {
    const [{ createGameState }, { boardLayout }, { gameVariants }] = await Promise.all([
      import("/src/game/gameState.js"),
      import("/src/data/boardLayout.js"),
      import("/src/data/supernova.js")
    ]);
    const gameState = createGameState({
      language: "de",
      playerCount: 2,
      boardLayout,
      gameVariant: gameVariants.supernova
    });
    const attackerNodeId = boardLayout.points[0].id;
    const defenderNodeId = boardLayout.points[1].id;
    const ships = [
      {
        id: "battle-e2e-attacker",
        ownerPlayerId: "player-1",
        type: "battleShip",
        variant: 1,
        locationId: attackerNodeId,
        status: "active"
      },
      {
        id: "battle-e2e-support-2",
        ownerPlayerId: "player-1",
        type: "battleShip",
        variant: 2,
        locationId: boardLayout.points[2].id,
        status: "active"
      },
      {
        id: "battle-e2e-support-3",
        ownerPlayerId: "player-1",
        type: "battleShip",
        variant: 3,
        locationId: boardLayout.points[3].id,
        status: "active"
      },
      {
        id: "battle-e2e-defender",
        ownerPlayerId: "player-2",
        type: "tradeShip",
        variant: 1,
        locationId: defenderNodeId,
        status: "active"
      }
    ];
    gameState.phase = "flight";
    gameState.currentPlayerIndex = 0;
    gameState.hasRolledFlightSpeed = true;
    gameState.flightSpeedBase = 7;
    gameState.flightSpeedTotal = 7;
    gameState.flightRoll = { balls: ["red", "yellow"], baseSpeed: 7, encounterTriggered: false };
    gameState.players = gameState.players.map((player, index) => ({
      ...player,
      upgrades: index === 0 ? { ...player.upgrades, cannon: 6 } : player.upgrades,
      ships: ships.filter((ship) => ship.ownerPlayerId === player.id)
    }));
    gameState.board = {
      ...gameState.board,
      selectedElement: { type: "ship", id: "battle-e2e-attacker" },
      ships
    };
    gameState.remainingMovementByShipId = Object.fromEntries(ships.map((ship) => [ship.id, 5]));
    gameState.supernova = {
      ...gameState.supernova,
      shipBattle: {
        id: "battle-e2e",
        stage: "rolling",
        round: 1,
        attackerPlayerId: "player-1",
        defenderPlayerId: "player-2",
        attackerShipId: "battle-e2e-attacker",
        defenderShipId: "battle-e2e-defender",
        defenderShipType: "tradeShip",
        attackerOriginNodeId: attackerNodeId,
        targetNodeId: defenderNodeId,
        pathCost: 1,
        attackerRoll: null,
        defenderRoll: null,
        attackerStrength: null,
        defenderStrength: null,
        winnerPlayerId: null,
        loserPlayerId: null,
        pendingUpgradePlayerId: null,
        removableUpgradeIds: []
      }
    };
    localStorage.removeItem("starOdyssey.autosave.v1");
    localStorage.setItem("star-odyssey-current-game", JSON.stringify(gameState));
    return gameState.flightSpeedTotal;
  });

  await page.reload();
  await expect(page.locator(".board-screen")).toBeVisible();
  await expect(page.locator(".supernova-battle-overlay")).toHaveCount(0);

  const attackerController = await page.context().newPage();
  const defenderController = await page.context().newPage();
  const attackerUrl = await getAuthorizedControllerUrl(page, 1);
  const defenderUrl = await getAuthorizedControllerUrl(page, 2);
  await attackerController.goto(attackerUrl);
  await defenderController.goto(defenderUrl);

  const attackerRoll = attackerController.getByRole("button", { name: "Mit Mutterschiff würfeln" });
  const defenderRoll = defenderController.getByRole("button", { name: "Mit Mutterschiff würfeln" });
  await expect(attackerRoll).toBeVisible();
  await expect(defenderRoll).toBeVisible();
  await attackerRoll.click();
  await expect(attackerController.getByText("Du hast gewürfelt. Warte auf den anderen Spieler.")).toBeVisible();
  await expect(page.locator(".supernova-battle-overlay")).toHaveCount(0);
  await expect(defenderRoll).toBeVisible();

  await attackerController.close();
  const reconnectedAttacker = await page.context().newPage();
  await reconnectedAttacker.goto(attackerUrl);
  await expect(reconnectedAttacker.getByText("Du hast gewürfelt. Warte auf den anderen Spieler.")).toBeVisible();
  await expect(reconnectedAttacker.getByRole("button", { name: "Mit Mutterschiff würfeln" })).toHaveCount(0);

  await defenderRoll.click();
  await expect(page.locator(".supernova-battle-overlay")).toBeVisible();
  await expect(page.locator(".supernova-battle-player")).toHaveCount(2);
  await expect(page.locator(".supernova-battle-ball-pocket")).toHaveCount(2);
  await expect.poll(async () => page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("star-odyssey-current-game") ?? "null");
    return state?.supernova?.shipBattle ?? null;
  }), { timeout: 10000 }).toBeNull();

  const resolvedState = await page.evaluate(() => JSON.parse(localStorage.getItem("star-odyssey-current-game") ?? "null"));
  expect(resolvedState.flightSpeedTotal).toBe(initialFlightSpeed);
  expect(resolvedState.supernova.blockedShipIds).toContain("battle-e2e-defender");
  expect(new Set(resolvedState.board.ships.map((ship) => ship.locationId)).size).toBe(resolvedState.board.ships.length);
  await reconnectedAttacker.close();
  await defenderController.close();
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
