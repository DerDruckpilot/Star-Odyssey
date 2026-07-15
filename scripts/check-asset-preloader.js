import assert from "node:assert/strict";
import {
  GAME_ASSET_PRELOAD_CONCURRENCY,
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

console.log("Asset preloader checks passed.");
