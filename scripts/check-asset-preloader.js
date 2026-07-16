import assert from "node:assert/strict";
import {
  AssetManager,
  GAME_ASSET_PRELOAD_CONCURRENCY,
  assetLoadStates,
  collectAssetUrls,
  preloadAssetUrls,
  selectAssetUrlsForColors
} from "../src/asset-preloader.js";

assert.deepEqual(
  collectAssetUrls(["board", ["planet"], { red: ["ship-1", "ship-2"] }, null]),
  ["board", "planet", "ship-1", "ship-2"]
);
assert.deepEqual(collectAssetUrls("single-asset"), ["single-asset"]);
assert.deepEqual(collectAssetUrls({ red: "red-asset", blue: ["blue-asset"] }), ["red-asset", "blue-asset"]);

const colorAssets = {
  red: ["red-1", "red-2"],
  blue: ["blue-1"],
  green: ["green-1"]
};
assert.deepEqual(selectAssetUrlsForColors(colorAssets, ["blue", "red"]), ["blue-1", "red-1", "red-2"]);
assert.deepEqual(selectAssetUrlsForColors(colorAssets, []), []);

let activeLoads = 0;
let maxActiveLoads = 0;
const completed = [];
await preloadAssetUrls(
  ["a", "b", "c", "d", "e", "a"],
  async (url) => {
    activeLoads += 1;
    maxActiveLoads = Math.max(maxActiveLoads, activeLoads);
    await new Promise((resolve) => setTimeout(resolve, 2));
    activeLoads -= 1;
    completed.push(url);
  },
  { concurrency: GAME_ASSET_PRELOAD_CONCURRENCY }
);

assert.equal(maxActiveLoads, GAME_ASSET_PRELOAD_CONCURRENCY);
assert.deepEqual([...completed].sort(), ["a", "b", "c", "d", "e"]);

const loadAttempts = new Map();
const manager = new AssetManager({
  concurrency: 2,
  loadAsset: async (url) => {
    loadAttempts.set(url, (loadAttempts.get(url) ?? 0) + 1);
    if (url === "missing-required" && loadAttempts.get(url) === 1) throw new Error("missing");
    if (url === "missing-optional") throw new Error("optional");
    return { url };
  }
});
const progress = [];
const readyGroup = await manager.preloadGroup("menu", {
  required: ["hero", "frame", "hero"],
  optional: ["decorative"]
}, {
  onProgress: (snapshot) => progress.push(snapshot.progress)
});
assert.equal(readyGroup.status, assetLoadStates.ready);
assert.equal(readyGroup.total, 3);
assert.equal(readyGroup.completed, 3);
assert.equal(progress.at(-1), 1);
assert.equal(manager.get("hero").url, "hero");
assert.equal(loadAttempts.get("hero"), 1);

await manager.preloadGroup("menu", {
  required: ["hero", "frame"],
  optional: ["decorative"]
});
assert.equal(loadAttempts.get("hero"), 1, "A ready asset must not be loaded twice.");

await assert.rejects(() => manager.preloadGroup("game", {
  required: ["missing-required"],
  optional: ["missing-optional"]
}));
assert.equal(manager.getGroupStatus("game").status, assetLoadStates.error);
assert.deepEqual(manager.getGroupStatus("game").requiredFailures, ["missing-required"]);
assert.deepEqual(manager.getGroupStatus("game").optionalFailures, ["missing-optional"]);

const retriedGroup = await manager.preloadGroup("game", {
  required: ["missing-required"],
  optional: []
}, { retry: true });
assert.equal(retriedGroup.status, assetLoadStates.ready);
assert.equal(loadAttempts.get("missing-required"), 2);

console.log("Asset preloader checks passed.");
