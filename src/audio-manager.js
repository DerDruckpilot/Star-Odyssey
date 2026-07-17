export const audioStorageKey = "star-odyssey-audio-settings-v1";

export const soundDefinitions = Object.freeze({
  uiFocus: { src: "./assets/audio/sfx/ui-focus.ogg", gain: 0.28, maxVoices: 3 },
  uiConfirm: { src: "./assets/audio/sfx/ui-confirm.ogg", gain: 0.46, maxVoices: 3 },
  uiBack: { src: "./assets/audio/sfx/ui-back.ogg", gain: 0.42, maxVoices: 2 },
  uiError: { src: "./assets/audio/sfx/ui-error.ogg", gain: 0.5, maxVoices: 2 },
  uiOpen: { src: "./assets/audio/sfx/ui-open.ogg", gain: 0.42, maxVoices: 2 },
  resourceGain: { src: "./assets/audio/sfx/resource-gain.ogg", gain: 0.38, maxVoices: 3 },
  victory: { src: "./assets/audio/sfx/victory.ogg", gain: 0.64, maxVoices: 1 },
  diceRoll: { src: "./assets/audio/sfx/dice-roll.ogg", gain: 0.54, maxVoices: 2 },
  diceResult: { src: "./assets/audio/sfx/dice-result.ogg", gain: 0.5, maxVoices: 2 },
  shipEngine: { src: "./assets/audio/sfx/ship-engine.ogg", gain: 0.34, maxVoices: 4 },
  weaponLaser: { src: "./assets/audio/sfx/weapon-laser.ogg", gain: 0.58, maxVoices: 4 },
  weaponPlasma: { src: "./assets/audio/sfx/weapon-plasma.ogg", gain: 0.5, maxVoices: 6 },
  battleImpact: { src: "./assets/audio/sfx/battle-impact.ogg", gain: 0.58, maxVoices: 3 },
  buildComplete: { src: "./assets/audio/sfx/build-complete.ogg", gain: 0.48, maxVoices: 3 }
});

export const appSoundIds = Object.freeze([
  "uiFocus",
  "uiConfirm",
  "uiBack",
  "uiError",
  "uiOpen"
]);

export const gameplaySoundIds = Object.freeze([
  "resourceGain",
  "victory",
  "diceRoll",
  "diceResult",
  "shipEngine",
  "weaponLaser",
  "weaponPlasma",
  "battleImpact",
  "buildComplete"
]);

const defaultSettings = Object.freeze({ enabled: true, volume: 0.6 });

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, Number(value) || 0));
}

function normalizeSettings(value) {
  return {
    enabled: value?.enabled !== false,
    volume: clamp(value?.volume ?? defaultSettings.volume, 0, 1)
  };
}

function loadStoredSettings(storage) {
  if (!storage) return { ...defaultSettings };
  try {
    return normalizeSettings(JSON.parse(storage.getItem(audioStorageKey) || "null"));
  } catch {
    return { ...defaultSettings };
  }
}

export class AudioManager {
  constructor({
    definitions = soundDefinitions,
    AudioCtor = globalThis.Audio,
    storage = globalThis.localStorage,
    loadTimeoutMs = 8000
  } = {}) {
    this.definitions = definitions;
    this.AudioCtor = AudioCtor;
    this.storage = storage;
    this.loadTimeoutMs = loadTimeoutMs;
    this.settings = loadStoredSettings(storage);
    this.assets = new Map();
    this.activeVoices = new Set();
    this.channels = new Map();
    this.unlocked = false;
    this.unlockPromise = null;
  }

  getSettings() {
    return { ...this.settings };
  }

  setEnabled(enabled) {
    this.settings.enabled = Boolean(enabled);
    if (!this.settings.enabled) this.stopAll();
    this.persistSettings();
    return this.getSettings();
  }

  setVolume(volume) {
    this.settings.volume = clamp(volume, 0, 1);
    for (const voice of this.activeVoices) {
      voice.audio.volume = clamp(this.settings.volume * voice.gain * voice.volume, 0, 1);
    }
    this.persistSettings();
    return this.getSettings();
  }

  persistSettings() {
    try {
      this.storage?.setItem(audioStorageKey, JSON.stringify(this.settings));
    } catch {
      // Sound settings remain usable for the current session when storage is unavailable.
    }
  }

  getStatus(id) {
    return this.assets.get(id)?.status ?? "idle";
  }

  isSettled(id) {
    return ["ready", "error"].includes(this.getStatus(id));
  }

  areSettled(ids) {
    return ids.every((id) => this.isSettled(id));
  }

  getStats() {
    const statuses = [...this.assets.values()].map((asset) => asset.status);
    return {
      total: statuses.length,
      ready: statuses.filter((status) => status === "ready").length,
      failed: statuses.filter((status) => status === "error").length,
      activeVoices: this.activeVoices.size,
      unlocked: this.unlocked,
      settings: this.getSettings()
    };
  }

  async load(id, { retry = false } = {}) {
    const definition = this.definitions[id];
    if (!definition) throw new Error(`Unbekannter Sound: ${id}`);

    const existing = this.assets.get(id);
    if (existing?.status === "ready") return existing.audio;
    if (existing?.status === "loading") return existing.promise;
    if (existing?.status === "error" && !retry) throw existing.error;
    if (typeof this.AudioCtor !== "function") {
      const error = new Error("Audio wird von dieser Umgebung nicht unterstuetzt.");
      this.assets.set(id, { status: "error", audio: null, error, promise: null });
      throw error;
    }

    const audio = new this.AudioCtor(definition.src);
    audio.preload = "auto";
    const record = { status: "loading", audio, error: null, promise: null };
    record.promise = new Promise((resolve, reject) => {
      let settled = false;
      const cleanup = () => {
        clearTimeout(timeoutId);
        audio.removeEventListener?.("loadedmetadata", handleReady);
        audio.removeEventListener?.("loadeddata", handleReady);
        audio.removeEventListener?.("canplay", handleReady);
        audio.removeEventListener?.("canplaythrough", handleReady);
        audio.removeEventListener?.("error", handleError);
      };
      const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        cleanup();
        callback(value);
      };
      const handleReady = () => {
        record.status = "ready";
        finish(resolve, audio);
      };
      const handleError = () => {
        const error = new Error(`Sound konnte nicht geladen werden: ${definition.src}`);
        record.status = "error";
        record.error = error;
        finish(reject, error);
      };
      const timeoutId = setTimeout(handleError, this.loadTimeoutMs);
      audio.addEventListener?.("loadedmetadata", handleReady, { once: true });
      audio.addEventListener?.("loadeddata", handleReady, { once: true });
      audio.addEventListener?.("canplay", handleReady, { once: true });
      audio.addEventListener?.("canplaythrough", handleReady, { once: true });
      audio.addEventListener?.("error", handleError, { once: true });
      audio.load?.();
      if (Number(audio.readyState) >= 2) queueMicrotask(handleReady);
    });
    this.assets.set(id, record);
    return record.promise;
  }

  async preload(ids, { retry = false, onProgress = null } = {}) {
    const uniqueIds = [...new Set(ids.filter((id) => this.definitions[id]))];
    let completed = retry ? 0 : uniqueIds.filter((id) => this.isSettled(id)).length;
    const report = () => onProgress?.({
      completed,
      total: uniqueIds.length,
      progress: uniqueIds.length === 0 ? 1 : completed / uniqueIds.length
    });
    report();

    const results = await Promise.all(uniqueIds.map(async (id) => {
      if (this.isSettled(id) && !retry) return { id, ok: this.getStatus(id) === "ready" };
      try {
        await this.load(id, { retry });
        return { id, ok: true };
      } catch (error) {
        console.warn(`[Audio] ${error.message}`);
        return { id, ok: false, error };
      } finally {
        completed += 1;
        report();
      }
    }));

    return {
      total: uniqueIds.length,
      ready: results.filter((result) => result.ok).length,
      failed: results.filter((result) => !result.ok).map((result) => result.id)
    };
  }

  unlock() {
    if (this.unlocked) return Promise.resolve(true);
    if (this.unlockPromise) return this.unlockPromise;
    const base = [...this.assets.values()].find((asset) => asset.status === "ready" && asset.audio)?.audio;
    if (!base) return Promise.resolve(false);

    const probe = base.cloneNode(true);
    probe.muted = true;
    probe.volume = 0;
    probe.currentTime = 0;
    let playResult;
    try {
      playResult = probe.play?.();
    } catch {
      return Promise.resolve(false);
    }
    this.unlockPromise = Promise.resolve(playResult)
      .then(() => {
        probe.pause?.();
        this.unlocked = true;
        return true;
      })
      .catch(() => false)
      .finally(() => {
        this.unlockPromise = null;
      });
    return this.unlockPromise;
  }

  play(id, { volume = 1, playbackRate = 1, loop = false, channel = null } = {}) {
    if (!this.settings.enabled) return null;
    const definition = this.definitions[id];
    const base = this.assets.get(id);
    if (!definition || base?.status !== "ready") {
      void this.preload([id]);
      return null;
    }

    if (channel) this.stopChannel(channel);
    this.limitVoices(id, definition.maxVoices ?? 3);
    const audio = base.audio.cloneNode(true);
    const voice = {
      id,
      audio,
      gain: definition.gain ?? 1,
      volume: clamp(volume, 0, 1),
      channel
    };
    audio.currentTime = 0;
    audio.loop = Boolean(loop);
    audio.playbackRate = clamp(playbackRate, 0.5, 2);
    audio.volume = clamp(this.settings.volume * voice.gain * voice.volume, 0, 1);
    const cleanup = () => this.releaseVoice(voice);
    audio.addEventListener?.("ended", cleanup, { once: true });
    audio.addEventListener?.("error", cleanup, { once: true });
    this.activeVoices.add(voice);
    if (channel) this.channels.set(channel, voice);

    try {
      const playResult = audio.play?.();
      playResult?.then?.(() => {
        this.unlocked = true;
      }).catch?.(() => {
        this.unlocked = false;
        cleanup();
      });
    } catch {
      cleanup();
      return null;
    }
    return audio;
  }

  playLoop(id, channel, options = {}) {
    return this.play(id, { ...options, loop: true, channel });
  }

  stopChannel(channel) {
    const voice = this.channels.get(channel);
    if (voice) this.releaseVoice(voice, true);
  }

  stopAll() {
    for (const voice of [...this.activeVoices]) this.releaseVoice(voice, true);
  }

  limitVoices(id, maximum) {
    const matching = [...this.activeVoices].filter((voice) => voice.id === id);
    while (matching.length >= maximum) this.releaseVoice(matching.shift(), true);
  }

  releaseVoice(voice, stopAudio = false) {
    if (!voice || !this.activeVoices.has(voice)) return;
    if (stopAudio) {
      voice.audio.pause?.();
      try {
        voice.audio.currentTime = 0;
      } catch {
        // Some browsers reject currentTime changes before metadata is available.
      }
    }
    this.activeVoices.delete(voice);
    if (voice.channel && this.channels.get(voice.channel) === voice) this.channels.delete(voice.channel);
  }
}

export const audioManager = new AudioManager();
