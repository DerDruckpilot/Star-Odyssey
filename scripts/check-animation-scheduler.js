import assert from "node:assert/strict";
import { AnimationScheduler, animationQualityTiers } from "../src/animation-scheduler.js";

let visible = true;
let nextFrameId = 1;
const frames = new Map();
const scheduler = new AnimationScheduler({
  now: () => 100,
  isVisible: () => visible,
  requestFrame: (callback) => {
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
  },
  cancelFrame: (id) => frames.delete(id)
});

function runFrame(time) {
  const [id, callback] = frames.entries().next().value ?? [];
  assert.ok(id, "Ein gemeinsamer Animationsframe muss geplant sein.");
  frames.delete(id);
  callback(time);
}

const calls = [];
scheduler.start("first", (time) => {
  calls.push(["first", time]);
  return calls.filter(([id]) => id === "first").length < 2;
});
scheduler.start("second", (time) => {
  calls.push(["second", time]);
  return false;
});
assert.equal(frames.size, 1, "Mehrere Animationen müssen genau einen RAF teilen.");
runFrame(116);
assert.equal(scheduler.has("second"), false);
assert.equal(scheduler.has("first"), true);
runFrame(132);
assert.equal(scheduler.has("first"), false);
assert.equal(frames.size, 0);
assert.equal(scheduler.stats.frames, 2);

scheduler.start("paused", () => true);
visible = false;
scheduler.handleVisibilityChange();
assert.equal(frames.size, 0, "Versteckte Seiten dürfen keinen RAF weiterlaufen lassen.");
visible = true;
scheduler.handleVisibilityChange();
assert.equal(frames.size, 1, "Nach Sichtbarkeit muss eine aktive Animation fortgesetzt werden.");
scheduler.stop("paused");

const slowFrames = new Map();
let slowId = 1;
const adaptive = new AnimationScheduler({
  now: () => 0,
  requestFrame: (callback) => {
    const id = slowId++;
    slowFrames.set(id, callback);
    return id;
  },
  cancelFrame: (id) => slowFrames.delete(id)
});
adaptive.start("load", () => true);
let timestamp = 0;
for (let index = 0; index < 30; index += 1) {
  const [id, callback] = slowFrames.entries().next().value;
  slowFrames.delete(id);
  timestamp += 40;
  callback(timestamp);
}
assert.equal(adaptive.qualityTier, animationQualityTiers.performance);
assert.equal(adaptive.getQualityScale(), 0.62);
adaptive.clear();

console.log("Animation scheduler checks passed.");
