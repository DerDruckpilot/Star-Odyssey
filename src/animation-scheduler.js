const defaultRequestFrame = (callback) => globalThis.requestAnimationFrame(callback);
const defaultCancelFrame = (frameId) => globalThis.cancelAnimationFrame(frameId);
const defaultNow = () => globalThis.performance?.now?.() ?? Date.now();

export const animationQualityTiers = Object.freeze({
  high: "high",
  performance: "performance"
});

export class AnimationScheduler {
  constructor(options = {}) {
    this.requestFrame = options.requestFrame ?? defaultRequestFrame;
    this.cancelFrame = options.cancelFrame ?? defaultCancelFrame;
    this.readNow = options.now ?? defaultNow;
    this.isVisible = options.isVisible ?? (() => true);
    this.callbacks = new Map();
    this.frameId = null;
    this.lastRealTime = null;
    this.timelineTime = this.readNow();
    this.frameDurations = [];
    this.qualityTier = animationQualityTiers.high;
    this.stats = {
      frames: 0,
      longFrames: 0,
      averageFrameMs: 0,
      p90FrameMs: 0,
      qualityTier: this.qualityTier,
      activeAnimations: 0
    };
    this.tick = this.tick.bind(this);
  }

  start(id, callback) {
    if (!id || typeof callback !== "function") return;
    this.callbacks.set(id, callback);
    this.stats.activeAnimations = this.callbacks.size;
    this.requestNextFrame();
  }

  stop(id) {
    this.callbacks.delete(id);
    this.stats.activeAnimations = this.callbacks.size;
    if (this.callbacks.size === 0) this.stopFrameLoop();
  }

  has(id) {
    return this.callbacks.has(id);
  }

  now() {
    if (this.callbacks.size === 0 && this.isVisible()) {
      this.timelineTime = this.readNow();
    }
    return this.timelineTime;
  }

  getQualityScale() {
    return this.qualityTier === animationQualityTiers.performance ? 0.62 : 1;
  }

  handleVisibilityChange() {
    this.lastRealTime = null;
    if (!this.isVisible()) {
      if (this.frameId !== null) this.cancelFrame(this.frameId);
      this.frameId = null;
      return;
    }
    this.requestNextFrame();
  }

  clear() {
    this.callbacks.clear();
    this.stats.activeAnimations = 0;
    this.stopFrameLoop();
  }

  requestNextFrame() {
    if (this.frameId !== null || this.callbacks.size === 0 || !this.isVisible()) return;
    this.frameId = this.requestFrame(this.tick);
  }

  stopFrameLoop() {
    if (this.frameId !== null) this.cancelFrame(this.frameId);
    this.frameId = null;
    this.lastRealTime = null;
  }

  tick(realTime) {
    this.frameId = null;
    if (!this.isVisible()) {
      this.lastRealTime = null;
      return;
    }

    if (this.lastRealTime !== null) {
      const frameDuration = Math.max(0, realTime - this.lastRealTime);
      this.timelineTime += frameDuration;
      this.recordFrameDuration(frameDuration);
    }
    this.lastRealTime = realTime;
    this.stats.frames += 1;

    const callbacks = [...this.callbacks.entries()];
    for (const [id, callback] of callbacks) {
      if (this.callbacks.get(id) !== callback) continue;
      let keepRunning = false;
      try {
        keepRunning = callback(this.timelineTime, this) !== false;
      } catch (error) {
        console.error(`Animation ${id} wurde nach einem Fehler beendet.`, error);
      }
      if (!keepRunning && this.callbacks.get(id) === callback) this.callbacks.delete(id);
    }

    this.stats.activeAnimations = this.callbacks.size;
    if (this.callbacks.size > 0) {
      this.requestNextFrame();
    } else {
      this.lastRealTime = null;
    }
  }

  recordFrameDuration(duration) {
    if (!Number.isFinite(duration) || duration <= 0 || duration > 1000) return;
    this.frameDurations.push(duration);
    if (this.frameDurations.length > 180) this.frameDurations.shift();
    if (duration > 34) this.stats.longFrames += 1;

    const sorted = [...this.frameDurations].sort((left, right) => left - right);
    const total = this.frameDurations.reduce((sum, value) => sum + value, 0);
    const average = total / this.frameDurations.length;
    const p90 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))] ?? 0;
    this.stats.averageFrameMs = Number(average.toFixed(2));
    this.stats.p90FrameMs = Number(p90.toFixed(2));

    if (this.frameDurations.length >= 24 && (average > 25 || p90 > 34)) {
      this.qualityTier = animationQualityTiers.performance;
    } else if (this.frameDurations.length >= 120 && average < 18 && p90 < 24) {
      this.qualityTier = animationQualityTiers.high;
    }
    this.stats.qualityTier = this.qualityTier;
  }
}

const browserVisibility = () => typeof document === "undefined" || document.visibilityState !== "hidden";

export const animationScheduler = new AnimationScheduler({
  isVisible: browserVisibility
});

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => animationScheduler.handleVisibilityChange());
}
