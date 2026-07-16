export const GAME_ASSET_PRELOAD_CONCURRENCY = 4;

export const assetLoadStates = Object.freeze({
  idle: "idle",
  loading: "loading",
  ready: "ready",
  error: "error"
});

export function collectAssetUrls(values) {
  const entries = Array.isArray(values) ? values : [values];
  const urls = [];
  for (const value of entries) {
    if (typeof value === "string") {
      urls.push(value);
    } else if (Array.isArray(value)) {
      urls.push(...collectAssetUrls(value));
    } else if (value && typeof value === "object") {
      urls.push(...collectAssetUrls(Object.values(value)));
    }
  }
  return urls;
}

export function selectAssetUrlsForColors(assetPaths, colors) {
  return colors.flatMap((color) => collectAssetUrls(assetPaths?.[color] ?? []));
}

export async function preloadAssetUrls(urls, loadAsset, {
  concurrency = GAME_ASSET_PRELOAD_CONCURRENCY,
  onAssetComplete = null
} = {}) {
  const queue = [...new Set(urls.filter(Boolean))];
  if (queue.length === 0) return [];

  const results = new Array(queue.length);
  const workerCount = Math.min(queue.length, Math.max(1, Math.floor(concurrency)));
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < queue.length) {
      const index = nextIndex;
      nextIndex += 1;
      const url = queue[index];
      results[index] = await loadAsset(url);
      onAssetComplete?.(url, results[index]);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
  return results;
}

async function loadDecodedImage(url) {
  const image = new Image();
  image.decoding = "async";
  image.fetchPriority = "low";

  await new Promise((resolve, reject) => {
    image.addEventListener("load", resolve, { once: true });
    image.addEventListener("error", () => reject(new Error(`Asset konnte nicht geladen werden: ${url}`)), { once: true });
    image.src = url;
  });

  if (typeof image.decode === "function") {
    try {
      await image.decode();
    } catch (error) {
      if (!image.complete || image.naturalWidth === 0) throw error;
    }
  }

  return image;
}

function normalizeAssetList(values) {
  return [...new Set(collectAssetUrls(values).filter(Boolean))];
}

function createGroupSnapshot(group) {
  if (!group) {
    return {
      id: "",
      status: assetLoadStates.idle,
      progress: 0,
      total: 0,
      completed: 0,
      requiredFailures: [],
      optionalFailures: []
    };
  }
  return {
    id: group.id,
    status: group.status,
    progress: group.progress,
    total: group.total,
    completed: group.completed,
    requiredFailures: [...group.requiredFailures],
    optionalFailures: [...group.optionalFailures]
  };
}

export class AssetManager {
  constructor({
    concurrency = GAME_ASSET_PRELOAD_CONCURRENCY,
    loadAsset = loadDecodedImage
  } = {}) {
    this.concurrency = concurrency;
    this.loadAsset = loadAsset;
    this.assets = new Map();
    this.groups = new Map();
    this.groupRevisions = new Map();
  }

  get(url) {
    return this.assets.get(url)?.value ?? null;
  }

  getAssetStatus(url) {
    return this.assets.get(url)?.status ?? assetLoadStates.idle;
  }

  isReady(url) {
    return this.getAssetStatus(url) === assetLoadStates.ready;
  }

  async load(url, { retry = false } = {}) {
    if (!url) return null;
    const existing = this.assets.get(url);
    if (existing?.status === assetLoadStates.ready) return existing.value;
    if (existing?.status === assetLoadStates.loading) return existing.promise;
    if (existing?.status === assetLoadStates.error && !retry) throw existing.error;

    const record = {
      status: assetLoadStates.loading,
      value: null,
      error: null,
      promise: null
    };
    record.promise = Promise.resolve()
      .then(() => this.loadAsset(url))
      .then((value) => {
        record.status = assetLoadStates.ready;
        record.value = value;
        return value;
      })
      .catch((error) => {
        record.status = assetLoadStates.error;
        record.error = error instanceof Error ? error : new Error(String(error));
        throw record.error;
      });
    this.assets.set(url, record);
    return record.promise;
  }

  getGroupStatus(groupId) {
    return createGroupSnapshot(this.groups.get(groupId));
  }

  isGroupReady(groupId) {
    return this.groups.get(groupId)?.status === assetLoadStates.ready;
  }

  async preloadGroup(groupId, {
    required = [],
    optional = []
  } = {}, {
    retry = false,
    onProgress = null
  } = {}) {
    const requiredUrls = normalizeAssetList(required);
    const optionalUrls = normalizeAssetList(optional).filter((url) => !requiredUrls.includes(url));
    const entries = [
      ...requiredUrls.map((url) => ({ url, required: true })),
      ...optionalUrls.map((url) => ({ url, required: false }))
    ];
    const signature = entries.map((entry) => `${entry.required ? "r" : "o"}:${entry.url}`).join("\n");
    const existing = this.groups.get(groupId);

    if (!retry && existing?.signature === signature) {
      if (existing.status === assetLoadStates.loading) {
        if (onProgress) existing.listeners.add(onProgress);
        return existing.promise;
      }
      if (existing.status === assetLoadStates.ready) {
        onProgress?.(createGroupSnapshot(existing));
        return createGroupSnapshot(existing);
      }
    }

    const revision = (this.groupRevisions.get(groupId) ?? 0) + 1;
    this.groupRevisions.set(groupId, revision);
    const group = {
      id: groupId,
      revision,
      signature,
      status: assetLoadStates.loading,
      progress: entries.length === 0 ? 1 : 0,
      total: entries.length,
      completed: 0,
      requiredFailures: [],
      optionalFailures: [],
      listeners: new Set(onProgress ? [onProgress] : []),
      promise: null
    };
    this.groups.set(groupId, group);

    const notify = () => {
      const snapshot = createGroupSnapshot(group);
      for (const listener of group.listeners) listener(snapshot);
    };
    notify();

    group.promise = (async () => {
      await preloadAssetUrls(entries, async (entry) => {
        try {
          await this.load(entry.url, { retry });
          return { ...entry, ok: true };
        } catch (error) {
          return { ...entry, ok: false, error };
        }
      }, {
        concurrency: this.concurrency,
        onAssetComplete: (_entry, result) => {
          if (this.groupRevisions.get(groupId) !== revision) return;
          group.completed += 1;
          group.progress = group.total === 0 ? 1 : group.completed / group.total;
          if (!result.ok) {
            const failures = result.required ? group.requiredFailures : group.optionalFailures;
            failures.push(result.url);
          }
          notify();
        }
      });

      if (this.groupRevisions.get(groupId) !== revision) return createGroupSnapshot(group);
      group.progress = 1;
      group.status = group.requiredFailures.length > 0 ? assetLoadStates.error : assetLoadStates.ready;
      notify();
      const snapshot = createGroupSnapshot(group);
      if (group.status === assetLoadStates.error) {
        const error = new Error(`Kritische Assets fehlen in Gruppe ${groupId}: ${group.requiredFailures.join(", ")}`);
        error.assetGroup = snapshot;
        throw error;
      }
      return snapshot;
    })();

    return group.promise;
  }
}

export const assetManager = new AssetManager();
