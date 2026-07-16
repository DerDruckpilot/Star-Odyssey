import { chromium } from "@playwright/test";

const baseUrl = process.env.STAR_ODYSSEY_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  serviceWorkers: "block",
  viewport: { width: 1920, height: 1080 }
});
const page = await context.newPage();
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("requestfailed", (request) => {
  errors.push(`request: ${new URL(request.url()).pathname} (${request.failure()?.errorText ?? "failed"})`);
});

await page.addInitScript(() => {
  window.__starOdysseyLongTasks = [];
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__starOdysseyLongTasks.push({
          startTime: Number(entry.startTime.toFixed(2)),
          duration: Number(entry.duration.toFixed(2))
        });
      }
    });
    observer.observe({ type: "longtask", buffered: true });
  } catch {
    // Long-task entries are optional in browsers without the API.
  }
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readResourceSnapshot() {
  return page.evaluate(() => {
    const entries = performance.getEntriesByType("resource").map((entry) => ({
      pathname: new URL(entry.name).pathname,
      durationMs: Number(entry.duration.toFixed(2)),
      transferBytes: entry.transferSize || 0,
      encodedBytes: entry.encodedBodySize || 0,
      decodedBytes: entry.decodedBodySize || 0
    }));
    const counts = new Map();
    for (const entry of entries) counts.set(entry.pathname, (counts.get(entry.pathname) ?? 0) + 1);
    return {
      count: entries.length,
      transferBytes: entries.reduce((sum, entry) => sum + entry.transferBytes, 0),
      encodedBytes: entries.reduce((sum, entry) => sum + entry.encodedBytes, 0),
      decodedBytes: entries.reduce((sum, entry) => sum + entry.decodedBytes, 0),
      duplicatePaths: [...counts.entries()].filter(([, count]) => count > 1),
      largest: [...entries]
        .sort((left, right) => right.decodedBytes - left.decodedBytes)
        .slice(0, 12)
    };
  });
}

async function getAuthorizedControllerUrls(playerCount) {
  await page.waitForFunction((count) => {
    const sessionId = localStorage.getItem("star-odyssey-controller-session")
      || sessionStorage.getItem("star-odyssey-controller-session");
    if (!sessionId) return false;
    try {
      const tokens = JSON.parse(localStorage.getItem(`star-odyssey-controller-access-v1:${sessionId}`) || "{}");
      return Array.from({ length: count }, (_, index) => Boolean(tokens[`player-${index + 1}`])).every(Boolean);
    } catch {
      return false;
    }
  }, playerCount);
  return page.locator(".qr-url").allTextContents();
}

const navigationStarted = Date.now();
await page.goto(`${baseUrl}/?resetAutosave=1`, { waitUntil: "domcontentloaded" });
const loaderVisibleAtDomReady = await page.locator("#app-startup-loader").isVisible();
await page.locator(".main-menu-scene").waitFor({ state: "visible", timeout: 30000 });
const startupTiming = await page.evaluate(() => {
  const navigation = performance.getEntriesByType("navigation")[0];
  const paint = performance.getEntriesByName("first-contentful-paint")[0];
  return {
    domContentLoadedMs: Number((navigation?.domContentLoadedEventEnd ?? 0).toFixed(2)),
    firstContentfulPaintMs: Number((paint?.startTime ?? 0).toFixed(2)),
    menuReadyMs: Number(performance.now().toFixed(2)),
    loaderProgress: document.querySelector("#app-startup-progress-text")?.textContent ?? "",
    metrics: { ...window.__starOdysseyPerformance },
    longTasks: [...(window.__starOdysseyLongTasks ?? [])],
    memoryBytes: performance.memory ? {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize
    } : null
  };
});
const startupResources = await readResourceSnapshot();

const beforeSetupMetrics = await page.evaluate(() => ({ ...window.__starOdysseyPerformance }));
await page.getByRole("button", { name: "Neues Spiel" }).click();
await page.getByRole("button", { name: "3 Spieler" }).click();
await page.getByRole("button", { name: "Klassisches Spiel" }).click();
await page.getByRole("button", { name: "Weiter" }).click();
await page.getByRole("heading", { name: "Controller verbinden" }).waitFor();
const lobbyEnteredAt = await page.evaluate(() => performance.now());
const lobbyEnteredMetrics = await page.evaluate(() => ({ ...window.__starOdysseyPerformance }));
const controllerUrls = await getAuthorizedControllerUrls(3);
assert(controllerUrls.length === 3, "Die 3-Spieler-Lobby hat nicht drei Controller-URLs erzeugt.");

const controllers = await Promise.all(controllerUrls.map(async (url) => {
  const controller = await context.newPage();
  await controller.goto(url, { waitUntil: "domcontentloaded" });
  return controller;
}));
const setup = [
  { name: "Alice", color: "Rot" },
  { name: "Bob", color: "Blau" },
  { name: "Cara", color: "Grün" }
];
for (const [index, controller] of controllers.entries()) {
  await controller.getByLabel("Name").fill(setup[index].name);
  await controller.getByRole("button", { name: setup[index].color, exact: true }).click();
  await controller.getByRole("button", { name: "Bereit", exact: true }).click();
}
const controllersReadyMetrics = await page.evaluate(() => ({ ...window.__starOdysseyPerformance }));

const startButton = page.getByRole("button", { name: "Spiel starten", exact: true });
await startButton.waitFor({ state: "visible" });
await page.waitForFunction(() => {
  const button = [...document.querySelectorAll("button")].find((candidate) => candidate.textContent?.trim() === "Spiel starten");
  return Boolean(button && !button.disabled);
}, null, { timeout: 60000 });
const lobbyReadyAt = await page.evaluate(() => performance.now());
const lobbyReadyMetrics = await page.evaluate(() => ({ ...window.__starOdysseyPerformance }));
const lobbyResources = await readResourceSnapshot();
const beforeBoardStartCount = lobbyResources.count;
const boardStartTime = await page.evaluate(() => performance.now());
await startButton.click();
await page.locator(".board-placeholder .board-svg").waitFor({ state: "visible", timeout: 30000 });
const boardReadyTiming = await page.evaluate((startTime) => ({
  readyDelayMs: Number((performance.now() - startTime).toFixed(2)),
  planets: document.querySelectorAll(".board-svg .planet-image").length,
  structures: document.querySelectorAll(".board-svg .structure").length,
  ships: document.querySelectorAll(".board-svg .ship").length,
  metrics: { ...window.__starOdysseyPerformance }
}), boardStartTime);
const boardResources = await readResourceSnapshot();
const resourcesAfterBoardStart = boardResources.largest.length >= 0
  ? await page.evaluate((entryIndex) => performance.getEntriesByType("resource")
    .slice(entryIndex)
    .filter((entry) => entry.transferSize > 0)
    .map((entry) => ({ pathname: new URL(entry.name).pathname, transferBytes: entry.transferSize })), beforeBoardStartCount)
  : [];

for (const controller of controllers) await controller.close();

const placementContext = await browser.newContext({
  serviceWorkers: "block",
  viewport: { width: 1920, height: 1080 }
});
const placementPage = await placementContext.newPage();
placementPage.on("console", (message) => {
  if (message.type() === "error") errors.push(`placement console: ${message.text()}`);
});
placementPage.on("requestfailed", (request) => {
  errors.push(`placement request: ${new URL(request.url()).pathname} (${request.failure()?.errorText ?? "failed"})`);
});
await placementPage.addInitScript(() => {
  window.__starOdysseyLongTasks = [];
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__starOdysseyLongTasks.push({
          startTime: Number(entry.startTime.toFixed(2)),
          duration: Number(entry.duration.toFixed(2))
        });
      }
    });
    observer.observe({ type: "longtask", buffered: true });
  } catch {
    // Long-task entries are optional in browsers without the API.
  }
});
await placementPage.goto(`${baseUrl}/?resetAutosave=1`, { waitUntil: "domcontentloaded" });
await placementPage.locator(".main-menu-scene").waitFor({ state: "visible", timeout: 30000 });
await placementPage.evaluate(async () => {
  const [{ buildShip, createGameState }, { boardLayout }] = await Promise.all([
    import("/src/game/gameState.js"),
    import("/src/data/boardLayout.js")
  ]);
  let gameState = createGameState({ language: "de", playerCount: 2, boardLayout });
  const site = boardLayout.startSystems[0].colonySites[0];
  gameState.phase = "tradeBuild";
  gameState.currentPlayerIndex = 0;
  gameState.players[0].resources = { ore: 10, fuel: 10, carbon: 10, food: 10, goods: 10 };
  gameState.board.structures = [{
    id: "measurement-spaceport",
    ownerPlayerId: "player-1",
    type: "spaceport",
    locationId: site.nodeId,
    systemId: site.systemId,
    adjacentPlanetIds: site.adjacentPlanetIds
  }];
  gameState = buildShip(gameState, boardLayout, "colonyShip");
  localStorage.setItem("star-odyssey-current-game", JSON.stringify(gameState));
  localStorage.removeItem("starOdyssey.autosave.v1");
});
await placementPage.reload({ waitUntil: "domcontentloaded" });
await placementPage.locator(".space-point.is-ship-build-target").first().waitFor({ state: "visible", timeout: 60000 });
await placementPage.evaluate(() => {
  window.__placementFrameTimes = [];
  const endAt = performance.now() + 1850;
  let previous = performance.now();
  const sample = (now) => {
    window.__placementFrameTimes.push(now - previous);
    previous = now;
    if (now < endAt) requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);
});
const placementMetricsBefore = await placementPage.evaluate(() => ({ ...window.__starOdysseyPerformance }));
await placementPage.locator(".space-point.is-ship-build-target").first().click();
await placementPage.waitForTimeout(1900);
const placement = await placementPage.evaluate((before) => {
  const samples = (window.__placementFrameTimes ?? []).filter((value) => value > 0 && value < 1000);
  const sorted = [...samples].sort((left, right) => left - right);
  const average = samples.reduce((sum, value) => sum + value, 0) / Math.max(1, samples.length);
  const metrics = window.__starOdysseyPerformance;
  return {
    sampleCount: samples.length,
    averageFrameMs: Number(average.toFixed(2)),
    p90FrameMs: Number((sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))] ?? 0).toFixed(2)),
    maxFrameMs: Number((sorted.at(-1) ?? 0).toFixed(2)),
    estimatedFps: Number((1000 / Math.max(average, 0.01)).toFixed(1)),
    appRenderDelta: metrics.appRenders - before.appRenders,
    boardRenderDelta: metrics.boardSvgBuilds - before.boardSvgBuilds,
    animationFrameDelta: metrics.placementAnimationFrames - before.placementAnimationFrames,
    scheduler: { ...metrics.animation }
  };
}, placementMetricsBefore);

const diagnostics = await placementPage.evaluate(() => ({
  longTasks: window.__starOdysseyLongTasks ?? [],
  memoryBytes: performance.memory ? {
    used: performance.memory.usedJSHeapSize,
    total: performance.memory.totalJSHeapSize
  } : null
}));

const result = {
  measuredAt: new Date().toISOString(),
  baseUrl,
  viewport: "1920x1080",
  browser: "Chromium headless, Service Worker blockiert, frischer Browserkontext",
  wallClockMs: Date.now() - navigationStarted,
  startup: {
    loaderVisibleAtDomReady,
    ...startupTiming,
    resources: startupResources
  },
  menuAndLobby: {
    appRenderDelta: boardReadyTiming.metrics.appRenders - beforeSetupMetrics.appRenders,
    setupRenderDelta: lobbyEnteredMetrics.appRenders - beforeSetupMetrics.appRenders,
    controllerConnectionRenderDelta: controllersReadyMetrics.appRenders - lobbyEnteredMetrics.appRenders,
    finalPreparationRenderDelta: lobbyReadyMetrics.appRenders - controllersReadyMetrics.appRenders,
    lobbyPreparationMs: Number((lobbyReadyAt - lobbyEnteredAt).toFixed(2)),
    resources: lobbyResources
  },
  boardStart: {
    ...boardReadyTiming,
    resourcesAfterStart: resourcesAfterBoardStart
  },
  placement,
  diagnostics,
  errors
};

console.log(JSON.stringify(result, null, 2));
await placementContext.close();
await context.close();
await browser.close();
