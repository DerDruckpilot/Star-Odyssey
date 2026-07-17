import assert from "node:assert/strict";
import { AudioManager, audioStorageKey } from "../src/audio-manager.js";

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }
}

class FakeAudio {
  static instances = [];

  constructor(src = "") {
    this.src = src;
    this.readyState = 0;
    this.currentTime = 0;
    this.volume = 1;
    this.playbackRate = 1;
    this.loop = false;
    this.paused = true;
    this.listeners = new Map();
    FakeAudio.instances.push(this);
  }

  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(callback);
  }

  removeEventListener(type, callback) {
    this.listeners.get(type)?.delete(callback);
  }

  emit(type) {
    for (const callback of [...(this.listeners.get(type) ?? [])]) callback({ type, target: this });
  }

  load() {
    queueMicrotask(() => {
      this.readyState = 2;
      this.emit("loadeddata");
    });
  }

  cloneNode() {
    const clone = new FakeAudio(this.src);
    clone.readyState = this.readyState;
    return clone;
  }

  play() {
    this.paused = false;
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }
}

class FailingAudio extends FakeAudio {
  load() {
    queueMicrotask(() => this.emit("error"));
  }
}

const definitions = {
  focus: { src: "./focus.ogg", gain: 0.5, maxVoices: 2 },
  engine: { src: "./engine.ogg", gain: 0.25, maxVoices: 1 }
};

async function run() {
  const storage = new MemoryStorage();
  const manager = new AudioManager({ definitions, AudioCtor: FakeAudio, storage, loadTimeoutMs: 100 });
  const progress = [];
  const preloadResult = await manager.preload(["focus", "engine", "focus"], {
    onProgress: (snapshot) => progress.push(snapshot.progress)
  });

  assert.deepEqual(preloadResult, { total: 2, ready: 2, failed: [] });
  assert.equal(manager.areSettled(["focus", "engine"]), true);
  assert.equal(manager.getStats().ready, 2);
  assert.equal(progress.at(-1), 1);

  const baseInstanceCount = FakeAudio.instances.length;
  await manager.preload(["focus", "engine"]);
  assert.equal(FakeAudio.instances.length, baseInstanceCount, "bereits geladene Sounds werden wiederverwendet");

  const voice = manager.play("focus");
  assert.ok(voice);
  assert.equal(voice.paused, false);
  assert.equal(voice.volume, 0.3);
  manager.setVolume(0.8);
  assert.equal(voice.volume, 0.4);

  const loop = manager.playLoop("engine", "ship-1");
  assert.ok(loop?.loop);
  assert.equal(manager.getStats().activeVoices, 2);
  manager.stopChannel("ship-1");
  assert.equal(loop.paused, true);
  assert.equal(manager.getStats().activeVoices, 1);

  manager.setEnabled(false);
  assert.equal(manager.play("focus"), null);
  assert.equal(manager.getStats().activeVoices, 0);
  assert.deepEqual(JSON.parse(storage.getItem(audioStorageKey)), { enabled: false, volume: 0.8 });

  const restored = new AudioManager({ definitions, AudioCtor: FakeAudio, storage, loadTimeoutMs: 100 });
  assert.deepEqual(restored.getSettings(), { enabled: false, volume: 0.8 });

  const failing = new AudioManager({ definitions, AudioCtor: FailingAudio, storage: null, loadTimeoutMs: 100 });
  const originalWarn = console.warn;
  let failureResult;
  try {
    console.warn = () => {};
    failureResult = await failing.preload(["focus"]);
  } finally {
    console.warn = originalWarn;
  }
  assert.deepEqual(failureResult.failed, ["focus"]);
  assert.equal(failing.areSettled(["focus"]), true, "optionale Audiofehler blockieren den Spielstart nicht");

  console.log("Audio manager checks passed.");
}

await run();
